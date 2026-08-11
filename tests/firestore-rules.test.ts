import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Firestore Security Rules Emulator Unit Tests
 *
 * Connects to live Firestore Emulator (port 8080) using @firebase/rules-unit-testing
 * to verify all 15 security scenarios required by Phase 7.
 */

const PROJECT_ID = 'bspc-be4f8-test-rules';
let testEnv: RulesTestEnvironment;

const rulesPath = path.resolve(__dirname, '../firebase/firestore.rules');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

describe('Firestore Security Rules Emulator Tests', () => {
  beforeAll(async () => {
    if (!hasEmulator) return;

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: rulesContent,
        host: '127.0.0.1',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  it('1. Unauthenticated user cannot read user profile', async () => {
    if (!hasEmulator) {
      expect(rulesContent).toContain('allow read, write: if false;');
      return;
    }

    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthDb.collection('users').doc('evm_95222290dd7278aa3ddd389cc1e1d165cc4bafe5').get());
  });

  it('2. Authenticated wallet user can read their own profile document', async () => {
    if (!hasEmulator) return;

    const userUid = 'evm_95222290dd7278aa3ddd389cc1e1d165cc4bafe5';

    await testEnv.withSecurityRulesDisabled(async (adminContext: any) => {
      await adminContext.firestore().collection('users').doc(userUid).set({
        uid: userUid,
        walletAddress: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
        role: 'user',
        status: 'active',
      });
    });

    const userDb = testEnv.authenticatedContext(userUid, { actorType: 'wallet_user' }).firestore();
    await assertSucceeds(userDb.collection('users').doc(userUid).get());
  });

  it('3. Wallet user cannot read another user profile', async () => {
    if (!hasEmulator) return;

    const user1 = 'evm_user1';
    const user2 = 'evm_user2';

    await testEnv.withSecurityRulesDisabled(async (adminContext: any) => {
      await adminContext.firestore().collection('users').doc(user2).set({
        uid: user2,
        walletAddress: '0xUser2',
        role: 'user',
      });
    });

    const user1Db = testEnv.authenticatedContext(user1, { actorType: 'wallet_user' }).firestore();
    await assertFails(user1Db.collection('users').doc(user2).get());
  });

  it('4. Wallet user cannot modify walletAddress or status fields', async () => {
    if (!hasEmulator) return;

    const userUid = 'evm_95222290dd7278aa3ddd389cc1e1d165cc4bafe5';

    await testEnv.withSecurityRulesDisabled(async (adminContext: any) => {
      await adminContext.firestore().collection('users').doc(userUid).set({
        uid: userUid,
        walletAddress: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
        role: 'user',
        status: 'active',
        username: 'oldName',
      });
    });

    const userDb = testEnv.authenticatedContext(userUid, { actorType: 'wallet_user' }).firestore();

    // Allowed: update non-sensitive field 'username'
    await assertSucceeds(userDb.collection('users').doc(userUid).update({ username: 'newName' }));

    // Denied: modifying sensitive field 'status'
    await assertFails(userDb.collection('users').doc(userUid).update({ status: 'suspended' }));

    // Denied: modifying sensitive field 'walletAddress'
    await assertFails(userDb.collection('users').doc(userUid).update({ walletAddress: '0xAttacker' }));
  });

  it('5. Direct client creation of users document is denied', async () => {
    if (!hasEmulator) return;

    const userUid = 'evm_newuser';
    const userDb = testEnv.authenticatedContext(userUid, { actorType: 'wallet_user' }).firestore();

    await assertFails(userDb.collection('users').doc(userUid).set({
      uid: userUid,
      walletAddress: '0xNewUser',
      role: 'user',
    }));
  });

  it('6. Direct client access to walletChallenges is strictly denied', async () => {
    if (!hasEmulator) return;

    const userDb = testEnv.authenticatedContext('evm_user', { actorType: 'wallet_user' }).firestore();

    await assertFails(userDb.collection('walletChallenges').doc('c-001').get());
    await assertFails(userDb.collection('walletChallenges').doc('c-001').set({ status: 'consumed' }));
  });

  it('7. Direct client creation of ledgerEntries is strictly denied', async () => {
    if (!hasEmulator) return;

    const userDb = testEnv.authenticatedContext('evm_user', { actorType: 'wallet_user' }).firestore();

    await assertFails(userDb.collection('ledgerEntries').doc('l-001').set({
      userUid: 'evm_user',
      amount: '1000',
    }));
  });

  it('8. Direct client creation of adminAuditLogs is strictly denied', async () => {
    if (!hasEmulator) return;

    const userDb = testEnv.authenticatedContext('evm_user', { actorType: 'wallet_user' }).firestore();

    await assertFails(userDb.collection('adminAuditLogs').doc('log-001').set({
      action: 'TAMPER',
    }));
  });

  it('9. Direct client update of withdrawalRequests is strictly denied', async () => {
    if (!hasEmulator) return;

    const userUid = 'evm_user';

    await testEnv.withSecurityRulesDisabled(async (adminContext: any) => {
      await adminContext.firestore().collection('withdrawalRequests').doc('w-001').set({
        requestId: 'w-001',
        userUid,
        status: 'pending',
      });
    });

    const userDb = testEnv.authenticatedContext(userUid, { actorType: 'wallet_user' }).firestore();
    await assertFails(userDb.collection('withdrawalRequests').doc('w-001').update({ status: 'approved' }));
  });

  it('10. Auditor custom claim can read adminAuditLogs', async () => {
    if (!hasEmulator) return;

    await testEnv.withSecurityRulesDisabled(async (adminContext: any) => {
      await adminContext.firestore().collection('adminAuditLogs').doc('log-001').set({
        logId: 'log-001',
        action: 'UPDATE_STATUS',
      });
    });

    const auditorDb = testEnv.authenticatedContext('admin_auditor', { role: 'auditor' }).firestore();
    await assertSucceeds(auditorDb.collection('adminAuditLogs').doc('log-001').get());
  });

  it('11. Auditor cannot write or mutate adminAuditLogs', async () => {
    if (!hasEmulator) return;

    const auditorDb = testEnv.authenticatedContext('admin_auditor', { role: 'auditor' }).firestore();
    await assertFails(auditorDb.collection('adminAuditLogs').doc('log-002').set({ action: 'FORGE' }));
  });

  it('12. Super admin custom claim has full read access to adminProfiles', async () => {
    if (!hasEmulator) return;

    await testEnv.withSecurityRulesDisabled(async (adminContext: any) => {
      await adminContext.firestore().collection('adminProfiles').doc('admin_super').set({
        uid: 'admin_super',
        role: 'super_admin',
      });
    });

    const superAdminDb = testEnv.authenticatedContext('admin_super', { role: 'super_admin' }).firestore();
    await assertSucceeds(superAdminDb.collection('adminProfiles').doc('admin_super').get());
  });

  it('13. Missing custom claims are denied access', async () => {
    if (!hasEmulator) return;

    const noClaimDb = testEnv.authenticatedContext('evm_user', {}).firestore();
    await assertFails(noClaimDb.collection('adminProfiles').doc('admin_super').get());
  });

  it('14. Support role cannot mutate user profile or withdraw approval', async () => {
    if (!hasEmulator) return;

    const supportDb = testEnv.authenticatedContext('admin_support', { role: 'support' }).firestore();
    await assertFails(supportDb.collection('users').doc('evm_user').update({ role: 'admin' }));
  });

  it('15. Direct loginEvents creation is strictly denied to client users', async () => {
    if (!hasEmulator) return;

    const userDb = testEnv.authenticatedContext('evm_user', { actorType: 'wallet_user' }).firestore();
    await assertFails(userDb.collection('loginEvents').doc('log-001').set({ eventType: 'FORGED_LOGIN' }));
  });

  it('16. Spark UAT: Guest can create own waiting chat conversation', async () => {
    if (!hasEmulator) return;

    const guestUid = 'guest_user_123';
    const guestDb = testEnv.authenticatedContext(guestUid, {}).firestore();
    await assertSucceeds(guestDb.collection('chatConversations').doc('conv_spark_01').set({
      guestId: guestUid,
      authenticatedUid: guestUid,
      guestLabel: 'Guest 1234',
      status: 'waiting',
      assignedAgentUid: null,
      source: 'receive_voucher',
      subject: 'Voucher Request',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: new Date(),
      userUnreadCount: 0,
      agentUnreadCount: 0,
    }));
  });

  it('17. Spark UAT: Guest CANNOT create chat conversation for another UID', async () => {
    if (!hasEmulator) return;

    const guestDb = testEnv.authenticatedContext('guest_user_123', {}).firestore();
    await assertFails(guestDb.collection('chatConversations').doc('conv_spark_02').set({
      guestId: 'OTHER_VICTIM_UID',
      authenticatedUid: 'OTHER_VICTIM_UID',
      status: 'waiting',
      assignedAgentUid: null,
      source: 'receive_voucher',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: new Date(),
      userUnreadCount: 0,
      agentUnreadCount: 0,
    }));
  });

  it('18. Spark UAT: Guest CANNOT set assignedAgentUid or non-waiting status on creation', async () => {
    if (!hasEmulator) return;

    const guestUid = 'guest_user_123';
    const guestDb = testEnv.authenticatedContext(guestUid, {}).firestore();
    await assertFails(guestDb.collection('chatConversations').doc('conv_spark_03').set({
      guestId: guestUid,
      authenticatedUid: guestUid,
      status: 'assigned',
      assignedAgentUid: 'rogue_agent',
      source: 'receive_voucher',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: new Date(),
      userUnreadCount: 0,
      agentUnreadCount: 0,
    }));
  });

  it('19. Spark UAT: Guest CANNOT send message with senderType agent or system', async () => {
    if (!hasEmulator) return;

    const guestUid = 'guest_user_123';
    await testEnv.withSecurityRulesDisabled(async (adminContext: any) => {
      await adminContext.firestore().collection('chatConversations').doc('conv_spark_04').set({
        guestId: guestUid,
        authenticatedUid: guestUid,
        status: 'waiting',
      });
    });

    const guestDb = testEnv.authenticatedContext(guestUid, {}).firestore();
    await assertFails(guestDb.collection('chatConversations').doc('conv_spark_04').collection('messages').doc('msg_01').set({
      senderUid: guestUid,
      senderType: 'agent',
      messageType: 'text',
      text: 'Impersonated Agent Reply',
    }));
  });

  it('20. Spark UAT: Support role admin can assign conversation and send agent reply', async () => {
    if (!hasEmulator) return;

    const guestUid = 'guest_user_123';
    const supportUid = 'agent_support_99';
    await testEnv.withSecurityRulesDisabled(async (adminContext: any) => {
      await adminContext.firestore().collection('chatConversations').doc('conv_spark_05').set({
        guestId: guestUid,
        authenticatedUid: guestUid,
        status: 'waiting',
      });
    });

    const supportDb = testEnv.authenticatedContext(supportUid, { role: 'support' }).firestore();
    await assertSucceeds(supportDb.collection('chatConversations').doc('conv_spark_05').update({
      assignedAgentUid: supportUid,
      status: 'assigned',
    }));

    await assertSucceeds(supportDb.collection('chatConversations').doc('conv_spark_05').collection('messages').doc('msg_02').set({
      senderUid: supportUid,
      senderType: 'agent',
      messageType: 'text',
      text: 'Official Support Reply',
    }));
  });

  it('21. Spark UAT: Auditor or read_only role CANNOT send agent reply message', async () => {
    if (!hasEmulator) return;

    const guestUid = 'guest_user_123';
    await testEnv.withSecurityRulesDisabled(async (adminContext: any) => {
      await adminContext.firestore().collection('chatConversations').doc('conv_spark_06').set({
        guestId: guestUid,
        authenticatedUid: guestUid,
        status: 'waiting',
      });
    });

    const auditorDb = testEnv.authenticatedContext('auditor_user', { role: 'auditor' }).firestore();
    await assertFails(auditorDb.collection('chatConversations').doc('conv_spark_06').collection('messages').doc('msg_03').set({
      senderUid: 'auditor_user',
      senderType: 'agent',
      messageType: 'text',
      text: 'Unauthorized Agent Reply',
    }));
  });
});
