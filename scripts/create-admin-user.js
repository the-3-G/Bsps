/**
 * Creates a Firebase Auth user (email/password) AND sets super_admin custom claims.
 * Run with NODE_PATH set to functions/node_modules.
 *
 * Usage:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\sa.json"
 *   $env:NODE_PATH="C:\...\functions\node_modules"
 *   node scripts/create-admin-user.js <email> <password> [role]
 */

const admin = require('firebase-admin');
const fs = require('fs');

async function createAdminUser() {
  const email = process.argv[2];
  const password = process.argv[3];
  const role = process.argv[4] || 'super_admin';
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin-user.js <email> <password> [role]');
    process.exit(1);
  }

  if (!admin.apps.length) {
    const saKey = JSON.parse(fs.readFileSync(saPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(saKey), projectId: saKey.project_id });
    console.log('[Bootstrap] Firebase Admin SDK initialized.');
  }

  const auth = admin.auth();
  const db = admin.firestore();

  // Create user or get existing
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`[Bootstrap] Existing user found: ${userRecord.uid}`);
  } catch {
    userRecord = await auth.createUser({ email, password, emailVerified: true });
    console.log(`[Bootstrap] New user created: ${userRecord.uid}`);
  }

  const uid = userRecord.uid;

  // Set custom claims
  await auth.setCustomUserClaims(uid, { role, actorType: 'administrator' });
  console.log(`✓ Custom claims set: { role: "${role}", actorType: "administrator" }`);

  // Create adminProfile
  const now = admin.firestore.Timestamp.now();
  await db.collection('adminProfiles').doc(uid).set(
    { uid, email, role, actorType: 'administrator', updatedAt: now, createdAt: now },
    { merge: true }
  );
  console.log(`✓ adminProfiles/${uid} created.`);

  // Audit log
  await db.collection('adminAuditLogs').add({
    action: 'admin_user_created',
    actorUid: uid, actorType: 'administrator', targetUid: uid,
    details: { email, role, note: 'Admin user created via create-admin-user.js' },
    timestamp: now,
  });
  console.log(`✓ Audit log written.`);

  console.log(`\n🎉 Done! Sign in at https://bspc-admin-staging.web.app/login with:`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: (the password you provided)`);
  console.log(`   Role:     ${role}\n`);
}

createAdminUser().catch((err) => {
  console.error('FAILED:', err.message || err);
  process.exit(1);
});
