import * as functions from 'firebase-functions';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { getAddress, verifyMessage } from 'viem';
import { createHash, randomBytes } from 'crypto';
import {
  CreateWalletChallengeSchema,
  VerifyWalletSignatureSchema,
  CreateSupportConversationSchema,
  AssignSupportAgentSchema,
  SendAgentMessageSchema,
  CloseSupportConversationSchema,
  BlockSupportUserSchema,
} from '@bspc/validation';
import { buildEip4361Message } from '@bspc/web3';

if (process.env.FUNCTIONS_EMULATOR === 'true' || process.env.FIREBASE_EMULATOR_HUB || process.env.NODE_ENV !== 'production') {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  }
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  }
}

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Rate limiting state (sliding window in-memory storage)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function cleanRateLimitMap() {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (record.resetAt <= now) {
      rateLimitMap.delete(key);
    }
  }
}

function checkRateLimit(key: string, limit = 5, windowMs = 60000): void {
  cleanRateLimitMap();
  const now = Date.now();
  const hashedKey = createHash('sha256').update(key).digest('hex');
  const record = rateLimitMap.get(hashedKey);

  if (!record || record.resetAt <= now) {
    rateLimitMap.set(hashedKey, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (record.count >= limit) {
    throw new HttpsError('resource-exhausted', 'Rate limit exceeded. Please try again later.');
  }

  record.count += 1;
}

// Security logging helper
async function writeLoginEvent(
  eventType: string,
  success: boolean,
  walletAddress: string,
  reasonCode: string,
  rawIp = '127.0.0.1',
  rawUserAgent = 'unknown'
) {
  try {
    const ipHash = createHash('sha256').update(rawIp).digest('hex');
    const userAgentSummary = rawUserAgent.substring(0, 100);

    await db.collection('loginEvents').add({
      eventId: `log-${Date.now()}-${randomBytes(4).toString('hex')}`,
      eventType,
      success,
      walletAddress,
      reasonCode,
      ipHash,
      userAgentSummary,
      createdAt: admin.firestore.Timestamp.now(),
    });
  } catch (err) {
    console.error('Failed to write login audit event:', err);
  }
}

// ------------------------------------------------------------------
// 1. createWalletChallenge (2nd-Gen Callable Function)
// ------------------------------------------------------------------
export const createWalletChallenge = onCall(
  {
    enforceAppCheck: process.env.ENFORCE_APP_CHECK === 'true',
    cors: true,
  },
  async (request) => {
    const rawIp = request.rawRequest?.ip || '127.0.0.1';
    const rawUserAgent = request.rawRequest?.headers['user-agent'] || 'unknown';

    // Validate payload schema
    const parseResult = CreateWalletChallengeSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new HttpsError('invalid-argument', 'Invalid request payload parameters.');
    }

    const { walletAddress, chainId } = parseResult.data;

    // Network check
    if (chainId !== 11155111) {
      await writeLoginEvent('UNSUPPORTED_CHAIN', false, walletAddress, 'CHAIN_NOT_SUPPORTED', rawIp, rawUserAgent);
      throw new HttpsError('invalid-argument', 'Unsupported network. Only Sepolia testnet (Chain ID 11155111) is supported.');
    }

    // Address EIP-55 Checksumming
    let checksummedAddress: string;
    try {
      checksummedAddress = getAddress(walletAddress);
    } catch {
      throw new HttpsError('invalid-argument', 'Malformed EVM wallet address.');
    }

    // Rate limiting (by normalized address + IP)
    checkRateLimit(`challenge-${checksummedAddress.toLowerCase()}-${rawIp}`, 5, 60000);

    // Generate 128-bit cryptographic nonce
    const nonce = randomBytes(16).toString('hex');
    const nonceHash = createHash('sha256').update(nonce).digest('hex');

    const domain = process.env.WALLET_AUTH_DOMAIN || 'bspc.io';
    const uri = process.env.WALLET_AUTH_URI || 'https://bspc.io';
    const challengeId = `c-${Date.now()}-${randomBytes(6).toString('hex')}`;
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 300000); // 5 minute TTL

    const message = buildEip4361Message({
      domain,
      address: checksummedAddress,
      statement: 'Sign in to BSPC. This request authenticates your wallet only. It does not initiate a transaction, transfer assets, or grant token approval.',
      uri,
      chainId,
      nonce,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      requestId: challengeId,
    });

    const ipHash = createHash('sha256').update(rawIp).digest('hex');
    const userAgentHash = createHash('sha256').update(rawUserAgent).digest('hex');

    // Store hashed challenge in Firestore
    await db.collection('walletChallenges').doc(challengeId).set({
      challengeId,
      walletAddress: checksummedAddress,
      walletAddressLowercase: checksummedAddress.toLowerCase(),
      chainId,
      nonceHash,
      message,
      domain,
      uri,
      issuedAt: admin.firestore.Timestamp.fromDate(issuedAt),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      usedAt: null,
      status: 'pending',
      requestIpHash: ipHash,
      userAgentHash,
      createdAt: admin.firestore.Timestamp.now(),
    });

    await writeLoginEvent('CHALLENGE_CREATED', true, checksummedAddress, 'CHALLENGE_ISSUED', rawIp, rawUserAgent);

    return {
      challengeId,
      message,
      expiresAt: expiresAt.toISOString(),
    };
  }
);

// ------------------------------------------------------------------
// 2. verifyWalletSignature (2nd-Gen Callable Function)
// ------------------------------------------------------------------
export const verifyWalletSignature = onCall(
  {
    enforceAppCheck: process.env.ENFORCE_APP_CHECK === 'true',
    cors: true,
  },
  async (request) => {
    const rawIp = request.rawRequest?.ip || '127.0.0.1';
    const rawUserAgent = request.rawRequest?.headers['user-agent'] || 'unknown';

    const parseResult = VerifyWalletSignatureSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new HttpsError('invalid-argument', 'Invalid request payload parameters.');
    }

    const { challengeId, signature } = parseResult.data;

    const challengeRef = db.collection('walletChallenges').doc(challengeId);

    // Atomic transaction: verify challenge validity and transition to verifying
    let storedData: any;
    try {
      await db.runTransaction(async (transaction) => {
        const challengeDoc = await transaction.get(challengeRef);
        if (!challengeDoc.exists) {
          throw new HttpsError('not-found', 'Challenge not found or expired.');
        }

        storedData = challengeDoc.data();

        // Check if already consumed or revoked
        if (storedData.status === 'consumed') {
          throw new HttpsError('failed-precondition', 'Challenge has already been consumed (replay prevented).');
        }

        if (storedData.status === 'revoked') {
          throw new HttpsError('failed-precondition', 'Challenge has been revoked.');
        }

        // Expiry check
        const now = Date.now();
        const expiresAtMs = storedData.expiresAt.toMillis();
        if (now > expiresAtMs) {
          transaction.update(challengeRef, { status: 'expired' });
          throw new HttpsError('deadline-exceeded', 'Challenge has expired. Please request a new challenge.');
        }

        // Idempotent state machine transition: set status to 'verifying'
        transaction.update(challengeRef, {
          status: 'verifying',
          verifyingAt: admin.firestore.Timestamp.now(),
        });
      });
    } catch (err: any) {
      if (err instanceof HttpsError) throw err;
      throw new HttpsError('internal', err?.message || 'Transaction failed.');
    }

    const { walletAddress, message, chainId, domain, uri } = storedData;
    const checksummedAddress = getAddress(walletAddress);

    // Verify network, domain, uri bounds
    if (chainId !== 11155111) {
      await writeLoginEvent('UNSUPPORTED_CHAIN', false, checksummedAddress, 'CHAIN_NOT_SUPPORTED', rawIp, rawUserAgent);
      throw new HttpsError('invalid-argument', 'Challenge target chain ID mismatch.');
    }

    const expectedDomain = process.env.WALLET_AUTH_DOMAIN || 'bspc.io';
    if (domain && domain !== expectedDomain) {
      await writeLoginEvent('INVALID_SIGNATURE', false, checksummedAddress, 'DOMAIN_MISMATCH', rawIp, rawUserAgent);
      throw new HttpsError('invalid-argument', 'Challenge domain mismatch.');
    }

    const expectedUri = process.env.WALLET_AUTH_URI || 'https://bspc.io';
    if (uri && uri !== expectedUri) {
      await writeLoginEvent('INVALID_SIGNATURE', false, checksummedAddress, 'URI_MISMATCH', rawIp, rawUserAgent);
      throw new HttpsError('invalid-argument', 'Challenge URI mismatch.');
    }

    // Signature verification via viem recoverAddress / verifyMessage
    try {
      const isValid = await verifyMessage({
        address: checksummedAddress as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });

      if (!isValid) {
        await challengeRef.update({ status: 'failed_retryable' });
        await writeLoginEvent('INVALID_SIGNATURE', false, checksummedAddress, 'SIGNATURE_MISMATCH', rawIp, rawUserAgent);
        throw new HttpsError('unauthenticated', 'Signature validation failed. Invalid wallet signature.');
      }
    } catch (err: any) {
      if (err instanceof HttpsError) throw err;
      await challengeRef.update({ status: 'failed_retryable' });
      await writeLoginEvent('INVALID_SIGNATURE', false, checksummedAddress, 'SIGNATURE_MALFORMED', rawIp, rawUserAgent);
      throw new HttpsError('unauthenticated', 'Malformed signature.');
    }

    // Deterministic UID Namespace for Wallet Users (evm_<address-without-0x>)
    const cleanAddress = checksummedAddress.toLowerCase().replace('0x', '');
    const userUid = `evm_${cleanAddress}`;

    let firebaseCustomToken: string;

    try {
      // 1. Get or Create Auth user
      let authUser: admin.auth.UserRecord;
      try {
        authUser = await admin.auth().getUser(userUid);
      } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
          authUser = await admin.auth().createUser({
            uid: userUid,
            displayName: `EVM ${checksummedAddress.substring(0, 6)}...${checksummedAddress.substring(38)}`,
          });
        } else {
          throw e;
        }
      }

      // Check if user is disabled
      if (authUser.disabled) {
        await challengeRef.update({ status: 'revoked' });
        await writeLoginEvent('LOGIN_FAILED', false, checksummedAddress, 'USER_DISABLED', rawIp, rawUserAgent);
        throw new HttpsError('permission-denied', 'User account is disabled.');
      }

      // 2. Set Custom Claim (Wallet users receive actorType: "wallet_user" and NEVER admin roles)
      const existingClaims = authUser.customClaims || {};
      const updatedClaims = {
        ...existingClaims,
        actorType: 'wallet_user',
      };
      // Ensure admin roles are never accidentally set on wallet UIDs
      delete (updatedClaims as any).role;

      await admin.auth().setCustomUserClaims(userUid, updatedClaims);

      // 3. Upsert Firestore user record
      const userRef = db.collection('users').doc(userUid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        await userRef.set({
          uid: userUid,
          walletAddress: checksummedAddress,
          walletAddressLowercase: checksummedAddress.toLowerCase(),
          role: 'user',
          status: 'active',
          authorizationStatus: 'unauthorized',
          collectionStatus: 'not_collected',
          balanceUsdt: '0.00',
          balanceEth: '0.00',
          onChainVerifiedUsdc: '0.00',
          createdAt: admin.firestore.Timestamp.now(),
          lastLoginAt: admin.firestore.Timestamp.now(),
        });
      } else {
        await userRef.update({
          lastLoginAt: admin.firestore.Timestamp.now(),
        });
      }

      // 4. Mint Custom Token
      firebaseCustomToken = await admin.auth().createCustomToken(userUid, {
        actorType: 'wallet_user',
      });

      // Mark challenge as fully consumed
      await challengeRef.update({
        status: 'consumed',
        usedAt: admin.firestore.Timestamp.now(),
      });
    } catch (err: any) {
      // Failed retryable state allows atomic cleanup
      await challengeRef.update({ status: 'failed_retryable' });
      if (err instanceof HttpsError) throw err;
      throw new HttpsError('internal', `Failed during Auth session minting: ${err?.message}`);
    }

    await writeLoginEvent('LOGIN_SUCCESS', true, checksummedAddress, 'SUCCESS', rawIp, rawUserAgent);

    return {
      firebaseCustomToken,
      user: {
        uid: userUid,
        walletAddress: checksummedAddress,
        status: 'active',
      },
    };
  }
);

// ------------------------------------------------------------------
// RBAC Permission Helper for Administrative Functions
// ------------------------------------------------------------------
function verifyRole(context: any, allowedRoles: string[]): string {
  if (!context?.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const role = context.auth.token?.role;
  if (!role || !allowedRoles.includes(role)) {
    throw new HttpsError('permission-denied', 'User does not possess administrative authorization for this action.');
  }

  return context.auth.uid;
}

// ------------------------------------------------------------------
// Administrative Functions Stub Exports
// ------------------------------------------------------------------
export const listUsers = functions.https.onCall(async (data, context) => {
  verifyRole(context, ['super_admin', 'operations_admin', 'support', 'auditor', 'read_only']);
  return { users: [] };
});

export const getUserDetail = functions.https.onCall(async (data, context) => {
  verifyRole(context, ['super_admin', 'operations_admin', 'support', 'auditor', 'read_only']);
  return { user: null };
});

export const updateUserStatus = functions.https.onCall(async (data, context) => {
  verifyRole(context, ['super_admin', 'operations_admin']);
  return { success: true };
});

export const reviewWithdrawal = functions.https.onCall(async (data, context) => {
  verifyRole(context, ['super_admin', 'finance_reviewer']);
  return { success: true };
});

export const reviewApplicationRequest = functions.https.onCall(async (data, context) => {
  verifyRole(context, ['super_admin', 'operations_admin']);
  return { success: true };
});

export const createLedgerAdjustment = functions.https.onCall(async (data, context) => {
  verifyRole(context, ['super_admin', 'operations_admin']);
  return { success: true };
});

export const assignAdminRole = functions.https.onCall(async (data, context) => {
  verifyRole(context, ['super_admin']);
  return { success: true };
});

export const revokeAdminSessions = functions.https.onCall(async (data, context) => {
  verifyRole(context, ['super_admin']);
  return { success: true };
});

export const exportReport = functions.https.onCall(async (data, context) => {
  verifyRole(context, ['super_admin', 'operations_admin', 'finance_reviewer', 'auditor']);
  return { reportUrl: 'https://storage.googleapis.com/mock-report.csv' };
});

export const getTeamReport = functions.https.onCall(async (data, context) => {
  verifyRole(context, ['super_admin', 'operations_admin', 'auditor', 'read_only']);
  return { report: {} };
});

export const indexBlockchainEvents = functions.https.onCall(async (data, context) => {
  verifyRole(context, ['super_admin', 'operations_admin']);
  return { processed: 0 };
});

// ------------------------------------------------------------------
// Customer Service Chat 2nd-Gen Cloud Functions
// ------------------------------------------------------------------

export const createSupportConversation = onCall(
  { enforceAppCheck: process.env.ENFORCE_APP_CHECK === 'true', cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated (anonymous or registered).');
    }

    const parseResult = CreateSupportConversationSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new HttpsError('invalid-argument', 'Invalid conversation parameters.');
    }

    const { subject, source, initialMessage } = parseResult.data;
    const userUid = request.auth.uid;
    const isAnonymous = Boolean(request.auth.token.firebase?.sign_in_provider === 'anonymous' || !request.auth.token.email);

    checkRateLimit(`create-conv-${userUid}`, 5, 60000);

    const conversationId = `conv-${Date.now()}-${randomBytes(4).toString('hex')}`;

    const convRef = db.collection('chatConversations').doc(conversationId);
    const now = admin.firestore.Timestamp.now();

    const guestLabel = isAnonymous ? `Guest ${userUid.slice(-4)}` : userUid;
    const firstMsgText = initialMessage || 'Hello. Please tell us how we can assist you with your voucher.';

    await db.runTransaction(async (transaction) => {
      transaction.set(convRef, {
        conversationId,
        guestId: userUid,
        authenticatedUid: userUid,
        guestLabel,
        status: 'waiting',
        subject: subject || (source === 'receive_voucher' ? 'Voucher Request' : 'General Inquiry'),
        source,
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
        lastMessagePreview: firstMsgText.slice(0, 100),
        userUnreadCount: 0,
        agentUnreadCount: 1,
      });

      // Add first system/initial message
      const msgRef = convRef.collection('messages').doc();
      transaction.set(msgRef, {
        messageId: msgRef.id,
        conversationId,
        senderType: 'system',
        senderUid: 'system',
        text: firstMsgText,
        messageType: 'text',
        createdAt: now,
        deliveredAt: now,
      });

      // If requested via receive_voucher, record voucher request record
      if (source === 'receive_voucher') {
        const voucherRef = db.collection('voucherRequests').doc(`vr-${Date.now()}`);
        transaction.set(voucherRef, {
          requestId: voucherRef.id,
          conversationId,
          guestUid: userUid,
          status: 'requested',
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    return { conversationId, guestLabel };
  }
);

export const assignSupportAgent = onCall(
  { enforceAppCheck: process.env.ENFORCE_APP_CHECK === 'true', cors: true },
  async (request) => {
    const agentUid = verifyRole(request, ['support', 'operations_admin', 'super_admin']);

    const parseResult = AssignSupportAgentSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new HttpsError('invalid-argument', 'Invalid request arguments.');
    }

    const { conversationId } = parseResult.data;
    const convRef = db.collection('chatConversations').doc(conversationId);
    const now = admin.firestore.Timestamp.now();

    await convRef.update({
      status: 'assigned',
      assignedAgentUid: agentUid,
      updatedAt: now,
    });

    await db.collection('adminAuditLogs').add({
      logId: `log-${Date.now()}`,
      adminUid: agentUid,
      action: 'ASSIGN_SUPPORT_CONVERSATION',
      targetId: conversationId,
      timestamp: now,
    });

    return { success: true };
  }
);

export const sendAgentMessage = onCall(
  { enforceAppCheck: process.env.ENFORCE_APP_CHECK === 'true', cors: true },
  async (request) => {
    const agentUid = verifyRole(request, ['support', 'operations_admin', 'super_admin']);

    const parseResult = SendAgentMessageSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new HttpsError('invalid-argument', 'Invalid message payload.');
    }

    const { conversationId, text, messageType } = parseResult.data;
    const convRef = db.collection('chatConversations').doc(conversationId);
    const now = admin.firestore.Timestamp.now();

    const sanitizedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const msgRef = convRef.collection('messages').doc();
    await msgRef.set({
      messageId: msgRef.id,
      conversationId,
      senderType: 'agent',
      senderUid: agentUid,
      text: sanitizedText,
      messageType,
      createdAt: now,
      deliveredAt: now,
    });

    await convRef.update({
      status: 'active',
      assignedAgentUid: agentUid,
      lastMessageAt: now,
      lastMessagePreview: sanitizedText.slice(0, 100),
      userUnreadCount: admin.firestore.FieldValue.increment(1),
      updatedAt: now,
    });

    return { messageId: msgRef.id };
  }
);

export const closeSupportConversation = onCall(
  { enforceAppCheck: process.env.ENFORCE_APP_CHECK === 'true', cors: true },
  async (request) => {
    verifyRole(request, ['support', 'operations_admin', 'super_admin']);

    const parseResult = CloseSupportConversationSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new HttpsError('invalid-argument', 'Invalid conversation ID.');
    }

    const { conversationId, resolutionNote } = parseResult.data;
    const convRef = db.collection('chatConversations').doc(conversationId);
    const now = admin.firestore.Timestamp.now();

    await convRef.update({
      status: 'closed',
      closedAt: now,
      resolutionNote: resolutionNote || 'Resolved by support agent.',
      updatedAt: now,
    });

    const msgRef = convRef.collection('messages').doc();
    await msgRef.set({
      messageId: msgRef.id,
      conversationId,
      senderType: 'system',
      senderUid: 'system',
      text: 'Conversation has been marked as closed by customer service.',
      messageType: 'system',
      createdAt: now,
    });

    return { success: true };
  }
);

export const blockSupportUser = onCall(
  { enforceAppCheck: process.env.ENFORCE_APP_CHECK === 'true', cors: true },
  async (request) => {
    verifyRole(request, ['operations_admin', 'super_admin']);

    const parseResult = BlockSupportUserSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new HttpsError('invalid-argument', 'Invalid block arguments.');
    }

    const { conversationId, reason } = parseResult.data;
    const convRef = db.collection('chatConversations').doc(conversationId);
    const now = admin.firestore.Timestamp.now();

    await convRef.update({
      status: 'blocked',
      blockReason: reason || 'Abusive behavior.',
      updatedAt: now,
    });

    return { success: true };
  }
);

export const devSetAdminClaims = onCall(
  { cors: true },
  async (request) => {
    try {
      const isEmulator =
        process.env.FUNCTIONS_EMULATOR === 'true' ||
        process.env.FUNCTIONS_EMULATOR_HOST ||
        process.env.FIRESTORE_EMULATOR_HOST ||
        process.env.FIREBASE_EMULATOR_HUB ||
        process.env.NODE_ENV !== 'production';
      if (!isEmulator) {
        throw new HttpsError('permission-denied', 'Only allowed in development/emulator mode.');
      }
      const { uid, role } = request.data || {};
      if (!uid || !role) {
        throw new HttpsError('invalid-argument', 'Missing uid or role.');
      }

      if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
      }

      await admin.auth().setCustomUserClaims(uid, { role });
      await db.collection('adminProfiles').doc(uid).set({
        uid,
        role,
        updatedAt: admin.firestore.Timestamp.now(),
      });
      return { success: true };
    } catch (err: any) {
      console.error('[devSetAdminClaims Error]:', err);
      if (err instanceof HttpsError) throw err;
      throw new HttpsError('internal', err.message || 'Failed to set custom claims');
    }
  }
);
