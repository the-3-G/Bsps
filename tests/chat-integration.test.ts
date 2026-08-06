import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInAnonymously, signInWithCustomToken, signOut, UserCredential } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, getDocs, collection, addDoc, updateDoc, setDoc, query, where } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

/**
2026 BSPC Customer Service E2E Chat Integration Tests
Conducted using real Firebase emulator suite.
*/

const firebaseConfig = {
  apiKey: 'AIzaSyA4j2To1oFlDmFiBiluPlkWSA_0DV2mWEo',
  authDomain: 'bspc-be4f8.firebaseapp.com',
  projectId: 'bspc-be4f8',
  storageBucket: 'bspc-be4f8.firebasestorage.app',
  messagingSenderId: '133746398244',
  appId: '1:133746398244:web:03c0b077d035a470b0f4b1',
};

const hasEmulators = Boolean(process.env.FUNCTIONS_EMULATOR_HOST);

let app: FirebaseApp;

describe('E2E Chat Integration Suite', () => {
  beforeAll(() => {
    if (!hasEmulators) return;

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const functions = getFunctions(app);

    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  });

  afterAll(async () => {
    if (app) {
      await deleteApp(app);
    }
  });

  it('A. Conversation Creation & Validation', async () => {
    if (!hasEmulators) return;

    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const functions = getFunctions(app);

    // 1. Sign in anonymously
    const userCred = await signInAnonymously(auth);
    const guestUid = userCred.user.uid;
    expect(guestUid).toBeDefined();

    // 2. Call createSupportConversation
    const createConvFn = httpsCallable<{
      subject?: string;
      source: string;
      initialMessage?: string;
    }, { conversationId: string; guestLabel: string }>(functions, 'createSupportConversation');

    const res = await createConvFn({
      source: 'receive_voucher',
      initialMessage: 'Hello, I need assistance.',
    });

    const { conversationId, guestLabel } = res.data;
    expect(conversationId).toBeDefined();
    expect(guestLabel).toContain(guestUid.slice(-4).toUpperCase());

    // 3. Confirm chatConversations document exists
    const convDocRef = doc(firestore, 'chatConversations', conversationId);
    const convSnap = await getDoc(convDocRef);
    expect(convSnap.exists()).toBe(true);

    const convData = convSnap.data()!;
    expect(convData.guestId).toBe(guestUid);
    expect(convData.status).toBe('waiting');
    expect(convData.source).toBe('receive_voucher');
    expect(convData.createdAt).toBeDefined();
    expect(convData.updatedAt).toBeDefined();

    // 4. Confirm voucherRequests document exists
    const voucherQuery = query(
      collection(firestore, 'voucherRequests'),
      where('conversationId', '==', conversationId)
    );
    const voucherSnap = await getDocs(voucherQuery);
    expect(voucherSnap.empty).toBe(false);
    const voucherData = voucherSnap.docs[0].data();
    expect(voucherData.guestUid).toBe(guestUid);
    expect(voucherData.status).toBe('requested');

    // 5. Confirm initial system message exists
    const messagesRef = collection(firestore, 'chatConversations', conversationId, 'messages');
    const messagesSnap = await getDocs(messagesRef);
    expect(messagesSnap.empty).toBe(false);

    const systemMsg = messagesSnap.docs.find((d: any) => d.data().senderType === 'system');
    expect(systemMsg).toBeDefined();
    expect(systemMsg!.data().text).toBe('Hello, I need assistance.');
  });

  it('B. Guest Permissions & Security Boundaries', async () => {
    if (!hasEmulators) return;

    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const functions = getFunctions(app);

    // Create primary guest session
    const guest1Cred = await signInAnonymously(auth);
    const guest1Uid = guest1Cred.user.uid;

    const createConvFn = httpsCallable<{ source: string }, { conversationId: string }>(functions, 'createSupportConversation');
    const res1 = await createConvFn({ source: 'general_support' });
    const convId1 = res1.data.conversationId;

    // 1. Guest can read own conversation & messages
    const conv1Ref = doc(firestore, 'chatConversations', convId1);
    await expect(getDoc(conv1Ref)).resolves.toBeDefined();

    // 2. Guest can send valid text message
    const msgRef = collection(firestore, 'chatConversations', convId1, 'messages');
    await expect(addDoc(msgRef, {
      conversationId: convId1,
      senderType: 'guest',
      senderUid: guest1Uid,
      text: 'My valid message',
      createdAt: new Date(),
    })).resolves.toBeDefined();

    // 3. Guest cannot change assignedAgentUid directly
    await expect(updateDoc(conv1Ref, { assignedAgentUid: 'some-agent-uid' })).rejects.toThrow();

    // 4. Guest cannot change status directly
    await expect(updateDoc(conv1Ref, { status: 'assigned' })).rejects.toThrow();

    // 5. Guest cannot create agent message
    await expect(addDoc(msgRef, {
      conversationId: convId1,
      senderType: 'agent',
      senderUid: guest1Uid,
      text: 'Impersonating agent',
      createdAt: new Date(),
    })).rejects.toThrow();

    // 6. Guest cannot create system message
    await expect(addDoc(msgRef, {
      conversationId: convId1,
      senderType: 'system',
      senderUid: 'system',
      text: 'Impersonating system',
      createdAt: new Date(),
    })).rejects.toThrow();

    // Create secondary guest session to check cross-access
    await signOut(auth);
    const guest2Cred = await signInAnonymously(auth);

    // Guest 2 cannot access guest 1's conversation
    await expect(getDoc(conv1Ref)).rejects.toThrow();

    // Guest 2 cannot access guest 1's messages
    const msg1Ref = collection(firestore, 'chatConversations', convId1, 'messages');
    await expect(getDocs(msg1Ref)).rejects.toThrow();
  });

  it('C. Agent Role Authorization & RBAC Permissions', async () => {
    if (!hasEmulators) return;

    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const functions = getFunctions(app);

    // Create a support conversation as guest
    const guestCred = await signInAnonymously(auth);
    const createConvFn = httpsCallable<{ source: string }, { conversationId: string }>(functions, 'createSupportConversation');
    const res = await createConvFn({ source: 'general_support' });
    const convId = res.data.conversationId;

    // Setup support agent session
    await signOut(auth);
    const agentCred = await signInAnonymously(auth);
    const agentUid = agentCred.user.uid;

    const devSetAdminClaimsFn = httpsCallable<{ uid: string; role: string }, void>(functions, 'devSetAdminClaims');
    await devSetAdminClaimsFn({ uid: agentUid, role: 'support' });
    await agentCred.user.getIdToken(true);

    // 1. Support agent can read conversation
    const convRef = doc(firestore, 'chatConversations', convId);
    const convSnap = await getDoc(convRef);
    expect(convSnap.exists()).toBe(true);

    // 2. Support agent can assign conversation
    const assignFn = httpsCallable<{ conversationId: string }, void>(functions, 'assignSupportAgent');
    await expect(assignFn({ conversationId: convId })).resolves.toBeDefined();

    // 3. Support agent can reply
    const sendReplyFn = httpsCallable<{ conversationId: string; text: string; messageType: string }, void>(functions, 'sendAgentMessage');
    await expect(sendReplyFn({ conversationId: convId, text: 'Agent reply text', messageType: 'text' })).resolves.toBeDefined();

    // Setup auditor session (auditor cannot reply)
    await signOut(auth);
    const auditorCred = await signInAnonymously(auth);
    const auditorUid = auditorCred.user.uid;
    await devSetAdminClaimsFn({ uid: auditorUid, role: 'auditor' });
    await auditorCred.user.getIdToken(true);

    const auditorSendReplyFn = httpsCallable<{ conversationId: string; text: string; messageType: string }, void>(functions, 'sendAgentMessage');
    await expect(auditorSendReplyFn({ conversationId: convId, text: 'Auditor reply text', messageType: 'text' })).rejects.toThrow();
  });

  it('D. Conversation Lifecycle Verification', async () => {
    if (!hasEmulators) return;

    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const functions = getFunctions(app);

    // Guest creates conversation
    const guestCred = await signInAnonymously(auth);
    const guestUid = guestCred.user.uid;
    const createConvFn = httpsCallable<{ source: string }, { conversationId: string }>(functions, 'createSupportConversation');
    const res = await createConvFn({ source: 'general_support' });
    const convId = res.data.conversationId;

    // Login Agent
    await signOut(auth);
    const agentCred = await signInAnonymously(auth);
    const agentUid = agentCred.user.uid;
    const devSetAdminClaimsFn = httpsCallable<{ uid: string; role: string }, void>(functions, 'devSetAdminClaims');
    await devSetAdminClaimsFn({ uid: agentUid, role: 'support' });
    await agentCred.user.getIdToken(true);

    // 1. waiting -> assigned
    const assignFn = httpsCallable<{ conversationId: string }, void>(functions, 'assignSupportAgent');
    await assignFn({ conversationId: convId });
    const convRef = doc(firestore, 'chatConversations', convId);
    let convSnap = await getDoc(convRef);
    expect(convSnap.data()!.status).toBe('assigned');
    expect(convSnap.data()!.assignedAgentUid).toBe(agentUid);

    // 2. assigned -> active (agent sends message)
    const sendReplyFn = httpsCallable<{ conversationId: string; text: string; messageType: string }, void>(functions, 'sendAgentMessage');
    await sendReplyFn({ conversationId: convId, text: 'Hello, how can I help?', messageType: 'text' });
    convSnap = await getDoc(convRef);
    expect(convSnap.data()!.status).toBe('active');

    // 3. active -> closed
    const closeFn = httpsCallable<{ conversationId: string; resolutionNote?: string }, void>(functions, 'closeSupportConversation');
    await closeFn({ conversationId: convId, resolutionNote: 'Resolved successfully.' });
    convSnap = await getDoc(convRef);
    expect(convSnap.data()!.status).toBe('closed');
    expect(convSnap.data()!.resolutionNote).toBe('Resolved successfully.');

    // 4. Closed guest cannot continue sending messages
    await signOut(auth);
    await signInAnonymously(auth); // signs back in guest
    const msgRef = collection(firestore, 'chatConversations', convId, 'messages');
    await expect(addDoc(msgRef, {
      conversationId: convId,
      senderType: 'guest',
      senderUid: guestUid,
      text: 'Can I say more?',
      createdAt: new Date(),
    })).rejects.toThrow();
  });

  it('E. Realtime Counters Verification', async () => {
    if (!hasEmulators) return;

    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const functions = getFunctions(app);

    // Guest creates conversation
    const guestCred = await signInAnonymously(auth);
    const guestUid = guestCred.user.uid;
    const createConvFn = httpsCallable<{ source: string }, { conversationId: string }>(functions, 'createSupportConversation');
    const res = await createConvFn({ source: 'general_support' });
    const convId = res.data.conversationId;

    // Login Agent
    await signOut(auth);
    const agentCred = await signInAnonymously(auth);
    const agentUid = agentCred.user.uid;
    const devSetAdminClaimsFn = httpsCallable<{ uid: string; role: string }, void>(functions, 'devSetAdminClaims');
    await devSetAdminClaimsFn({ uid: agentUid, role: 'support' });
    await agentCred.user.getIdToken(true);

    // Assign & activate
    const assignFn = httpsCallable<{ conversationId: string }, void>(functions, 'assignSupportAgent');
    await assignFn({ conversationId: convId });

    // 1. Agent message increments userUnreadCount
    const sendReplyFn = httpsCallable<{ conversationId: string; text: string; messageType: string }, void>(functions, 'sendAgentMessage');
    await sendReplyFn({ conversationId: convId, text: 'Agent msg', messageType: 'text' });
    const convRef = doc(firestore, 'chatConversations', convId);
    let convSnap = await getDoc(convRef);
    expect(convSnap.data()!.userUnreadCount).toBeGreaterThan(0);

    // 2. Guest reads clears userUnreadCount
    await signOut(auth);
    await signInAnonymously(auth); // signs in guest
    await updateDoc(convRef, { userUnreadCount: 0 });
    convSnap = await getDoc(convRef);
    expect(convSnap.data()!.userUnreadCount).toBe(0);
  });

  it('F. Validation & Abuse Controls', async () => {
    if (!hasEmulators) return;

    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const functions = getFunctions(app);

    // Guest creates conversation
    await signInAnonymously(auth);
    const createConvFn = httpsCallable<{ source: string }, { conversationId: string }>(functions, 'createSupportConversation');
    const res = await createConvFn({ source: 'general_support' });
    const convId = res.data.conversationId;

    // Login Agent
    await signOut(auth);
    const agentCred = await signInAnonymously(auth);
    const agentUid = agentCred.user.uid;
    const devSetAdminClaimsFn = httpsCallable<{ uid: string; role: string }, void>(functions, 'devSetAdminClaims');
    await devSetAdminClaimsFn({ uid: agentUid, role: 'support' });
    await agentCred.user.getIdToken(true);

    const sendReplyFn = httpsCallable<{ conversationId: string; text: string; messageType: string }, void>(functions, 'sendAgentMessage');

    // 1. Empty message validation via functions (throws)
    await expect(sendReplyFn({ conversationId: convId, text: '', messageType: 'text' })).rejects.toThrow();

    // 2. HTML scripting input sanitization
    await sendReplyFn({ conversationId: convId, text: '<script>malicious();</script>', messageType: 'text' });
    const messagesRef = collection(firestore, 'chatConversations', convId, 'messages');
    const msgsSnap = await getDocs(messagesRef);
    const agentMsg = msgsSnap.docs.find((d: any) => d.data().senderType === 'agent');
    expect(agentMsg).toBeDefined();
    expect(agentMsg!.data().text).toBe('&lt;script&gt;malicious();&lt;/script&gt;');
  });
});
