import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

admin.initializeApp();
const db = admin.firestore();

// Helper to verify role claims
function verifyRole(context: functions.https.CallableContext, allowedRoles: string[]) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }
  const role = context.auth.token.role as string;
  if (!allowedRoles.includes(role)) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized role.');
  }
  return context.auth.uid;
}

// Helper to write audit logs
async function writeAuditLog(
  actorUid: string,
  role: string,
  action: string,
  targetType: string,
  targetId: string,
  reason: string
) {
  const logRef = db.collection('adminAuditLogs').doc();
  await logRef.set({
    logId: logRef.id,
    actorUid,
    actorRole: role,
    action,
    targetType,
    targetId,
    reason,
    ipHash: '',
    createdAt: new Date().toISOString(),
  });
}

// 1. listUsers
export const listUsers = functions.https.onCall(async (data, context) => {
  verifyRole(context, ['super_admin', 'operations_admin', 'support', 'read_only']);
  
  const querySnapshot = await db.collection('users').limit(100).get();
  const users: Record<string, unknown>[] = [];
  querySnapshot.forEach((doc) => {
    users.push({ uid: doc.id, ...doc.data() });
  });

  return { success: true, users };
});

// 2. getUserDetail
const GetUserDetailSchema = z.object({
  uid: z.string(),
});
export const getUserDetail = functions.https.onCall(async (data, context) => {
  verifyRole(context, ['super_admin', 'operations_admin', 'support', 'read_only']);
  const parsed = GetUserDetailSchema.safeParse(data);
  if (!parsed.success) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid request arguments.');
  }

  const userDoc = await db.collection('users').doc(parsed.data.uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found.');
  }

  return { success: true, user: { uid: userDoc.id, ...userDoc.data() } };
});

// 3. updateUserStatus
const UpdateUserStatusSchema = z.object({
  uid: z.string(),
  status: z.enum(['active', 'suspended']),
  reason: z.string(),
});
export const updateUserStatus = functions.https.onCall(async (data, context) => {
  const actorUid = verifyRole(context, ['super_admin', 'operations_admin']);
  const parsed = UpdateUserStatusSchema.safeParse(data);
  if (!parsed.success) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid request arguments.');
  }

  const { uid, status, reason } = parsed.data;
  const userRef = db.collection('users').doc(uid);

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new Error('User does not exist.');
    }
    transaction.update(userRef, { status, updatedAt: new Date().toISOString() });
  });

  await writeAuditLog(actorUid, context.auth!.token.role as string, 'UPDATE_USER_STATUS', 'users', uid, reason);
  return { success: true };
});

// 4. reviewWithdrawal
const ReviewWithdrawalSchema = z.object({
  requestId: z.string(),
  status: z.enum(['approved', 'rejected', 'clarification']),
  reason: z.string(),
});
export const reviewWithdrawal = functions.https.onCall(async (data, context) => {
  const actorUid = verifyRole(context, ['super_admin', 'finance_reviewer']);
  const parsed = ReviewWithdrawalSchema.safeParse(data);
  if (!parsed.success) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid request arguments.');
  }

  const { requestId, status, reason } = parsed.data;
  const requestRef = db.collection('withdrawalRequests').doc(requestId);

  await db.runTransaction(async (transaction) => {
    const requestDoc = await transaction.get(requestRef);
    if (!requestDoc.exists) {
      throw new Error('Withdrawal request does not exist.');
    }
    transaction.update(requestRef, {
      status,
      reviewReason: reason,
      reviewedBy: actorUid,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  await writeAuditLog(actorUid, context.auth!.token.role as string, `REVIEW_WITHDRAWAL_${status.toUpperCase()}`, 'withdrawalRequests', requestId, reason);
  return { success: true };
});

// 5. reviewApplicationRequest
const ReviewApplicationSchema = z.object({
  requestId: z.string(),
  status: z.enum(['approved', 'rejected']),
  reason: z.string(),
});
export const reviewApplicationRequest = functions.https.onCall(async (data, context) => {
  const actorUid = verifyRole(context, ['super_admin', 'operations_admin']);
  const parsed = ReviewApplicationSchema.safeParse(data);
  if (!parsed.success) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid request arguments.');
  }

  const { requestId, status, reason } = parsed.data;
  const requestRef = db.collection('applicationRequests').doc(requestId);

  await db.runTransaction(async (transaction) => {
    const requestDoc = await transaction.get(requestRef);
    if (!requestDoc.exists) {
      throw new Error('Request does not exist.');
    }
    transaction.update(requestRef, {
      status,
      reviewReason: reason,
      reviewedBy: actorUid,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  await writeAuditLog(actorUid, context.auth!.token.role as string, `REVIEW_APPLICATION_${status.toUpperCase()}`, 'applicationRequests', requestId, reason);
  return { success: true };
});

// 6. createLedgerAdjustment
const LedgerAdjustmentSchema = z.object({
  userUid: z.string(),
  walletAddress: z.string(),
  assetId: z.string(),
  changeBaseUnits: z.string(),
  reason: z.string(),
});
export const createLedgerAdjustment = functions.https.onCall(async (data, context) => {
  const actorUid = verifyRole(context, ['super_admin', 'finance_reviewer']);
  const parsed = LedgerAdjustmentSchema.safeParse(data);
  if (!parsed.success) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid request arguments.');
  }

  const { userUid, walletAddress, assetId, changeBaseUnits, reason } = parsed.data;
  const entryRef = db.collection('ledgerEntries').doc();

  await entryRef.set({
    entryId: entryRef.id,
    userUid,
    walletAddress,
    assetId,
    previousBaseUnits: '0',
    changeBaseUnits,
    resultingBaseUnits: changeBaseUnits,
    reasonCode: 'MANUAL_ADJUSTMENT',
    relatedEntityType: 'adminAdjustment',
    relatedEntityId: entryRef.id,
    source: 'manual admin correction',
    actorUid,
    createdAt: new Date().toISOString(),
  });

  await writeAuditLog(actorUid, context.auth!.token.role as string, 'CREATE_LEDGER_ADJUSTMENT', 'ledgerEntries', entryRef.id, reason);
  return { success: true, entryId: entryRef.id };
});

// 7. assignAdminRole
const AssignRoleSchema = z.object({
  uid: z.string(),
  role: z.enum(['super_admin', 'operations_admin', 'finance_reviewer', 'support', 'auditor', 'read_only']),
});
export const assignAdminRole = functions.https.onCall(async (data, context) => {
  const actorUid = verifyRole(context, ['super_admin']);
  const parsed = AssignRoleSchema.safeParse(data);
  if (!parsed.success) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid request arguments.');
  }

  const { uid, role } = parsed.data;
  await admin.auth().setCustomUserClaims(uid, { role });

  // Update profile record in database
  const profileRef = db.collection('adminProfiles').doc(uid);
  await profileRef.set({
    uid,
    role,
    status: 'active',
    mfaRequired: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  await writeAuditLog(actorUid, 'super_admin', 'ASSIGN_ROLE', 'adminProfiles', uid, `Assigned role: ${role}`);
  return { success: true };
});

// 8. revokeAdminSessions
const RevokeSchema = z.object({
  uid: z.string(),
});
export const revokeAdminSessions = functions.https.onCall(async (data, context) => {
  const actorUid = verifyRole(context, ['super_admin']);
  const parsed = RevokeSchema.safeParse(data);
  if (!parsed.success) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid request arguments.');
  }

  const { uid } = parsed.data;
  await admin.auth().revokeRefreshTokens(uid);

  await writeAuditLog(actorUid, 'super_admin', 'REVOKE_SESSIONS', 'users', uid, 'Revoked sessions refresh tokens');
  return { success: true };
});

// 9. exportReport
export const exportReport = functions.https.onRequest(async (req, res) => {
  res.status(200).send('id,timestamp,amount\n1,2026-08-05T00:00:00Z,100.00');
});

// 10. getTeamReport
const GetTeamSchema = z.object({
  leaderUid: z.string(),
});
export const getTeamReport = functions.https.onCall(async (data, context) => {
  verifyRole(context, ['super_admin', 'operations_admin', 'read_only']);
  const parsed = GetTeamSchema.safeParse(data);
  if (!parsed.success) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid request arguments.');
  }

  const edgesSnapshot = await db.collection('referralEdges')
    .where('parentUid', '==', parsed.data.leaderUid)
    .get();

  const descendants: string[] = [];
  edgesSnapshot.forEach((doc) => {
    descendants.push(doc.data().childUid);
  });

  return { success: true, descendantsCount: descendants.length, descendants };
});

export { indexBlockchainEvents } from './indexer';
