/**
 * Plain JS version of bootstrap-staging-admin for environments without ts-node.
 * Run with: node scripts/bootstrap-staging-admin.js <EMAIL_OR_UID> [ROLE]
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON.
 */

const admin = require('firebase-admin');
const fs = require('fs');

async function bootstrapStagingAdmin() {
  const targetInput = process.argv[2];
  const role = process.argv[3] || 'super_admin';
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!targetInput) {
    console.error('ERROR: Missing target UID or Email.\nUsage: node scripts/bootstrap-staging-admin.js <EMAIL_OR_UID> [ROLE]');
    process.exit(1);
  }

  if (!admin.apps.length) {
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      const saKey = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({ credential: admin.credential.cert(saKey), projectId: saKey.project_id });
      console.log(`[Bootstrap] Initialized with service account key.`);
    } else {
      admin.initializeApp({ projectId: 'bspc-be4f8' });
      console.log('[Bootstrap] Initialized with Application Default Credentials.');
    }
  }

  const auth = admin.auth();
  const db = admin.firestore();

  let targetUser;
  if (targetInput.includes('@')) {
    targetUser = await auth.getUserByEmail(targetInput);
  } else {
    targetUser = await auth.getUser(targetInput);
  }

  const uid = targetUser.uid;
  const email = targetUser.email || targetInput;

  console.log(`\n[Bootstrap] Target: ${email} (${uid})`);
  console.log(`[Bootstrap] Assigning role: ${role}`);

  // 1. Set custom claims
  await auth.setCustomUserClaims(uid, { role, actorType: 'administrator' });
  console.log(`✓ Custom claims set: { role: "${role}", actorType: "administrator" }`);

  // 2. Create/merge adminProfile document
  const now = admin.firestore.Timestamp.now();
  await db.collection('adminProfiles').doc(uid).set(
    { uid, email, role, actorType: 'administrator', updatedAt: now, createdAt: now },
    { merge: true }
  );
  console.log(`✓ Firestore adminProfiles/${uid} created/updated.`);

  // 3. Audit log
  await db.collection('adminAuditLogs').add({
    action: 'spark_uat_admin_bootstrap',
    actorUid: uid, actorType: 'administrator', targetUid: uid,
    details: { email, role, environment: 'spark_uat', note: 'Admin bootstrap via JS script' },
    timestamp: now,
  });
  console.log(`✓ Audit log written.`);

  console.log(`\n🎉 BOOTSTRAP COMPLETE! "${email}" is now a "${role}" on staging.`);
  console.log(`Sign out and back in on the Admin Console to get a refreshed token with the new claims.\n`);
}

bootstrapStagingAdmin().catch((err) => {
  console.error('BOOTSTRAP FAILED:', err.message || err);
  process.exit(1);
});
