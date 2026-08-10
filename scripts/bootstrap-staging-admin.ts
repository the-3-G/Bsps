import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Local Admin Bootstrap Script for Staging / Spark UAT Mode
 *
 * Safe Execution Instructions:
 * 1. Obtain your staging service-account JSON key file from Firebase Console -> Project Settings -> Service Accounts.
 * 2. Store it outside your repository or specify path via environment variable:
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json npx ts-node scripts/bootstrap-staging-admin.ts <UID_OR_EMAIL> [ROLE]
 * 3. NEVER commit service-account JSON files to Git or publish them anywhere.
 */

async function bootstrapStagingAdmin() {
  const targetInput = process.argv[2] || process.env.STAGING_ADMIN_UID_OR_EMAIL;
  const role = process.argv[3] || process.env.STAGING_ADMIN_ROLE || 'super_admin';
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.SERVICE_ACCOUNT_KEY_PATH;

  if (!targetInput) {
    console.error('CRITICAL ERROR: Missing target Admin UID or Email parameter.');
    console.log('\nUsage:');
    console.log('  GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json npx ts-node scripts/bootstrap-staging-admin.ts <UID_OR_EMAIL> [super_admin|operations_admin|support]\n');
    process.exit(1);
  }

  // Initialize Admin SDK with explicit credential or local ADC
  if (!admin.apps.length) {
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      const saKey = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(saKey),
        projectId: saKey.project_id || 'bspc-be4f8',
      });
      console.log(`[Spark UAT Bootstrap] Initialized with service account: ${path.basename(serviceAccountPath)}`);
    } else {
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bspc-be4f8',
      });
      console.log('[Spark UAT Bootstrap] Initialized with Application Default Credentials.');
    }
  }

  const auth = admin.auth();
  const db = admin.firestore();

  let targetUser: admin.auth.UserRecord;

  if (targetInput.includes('@')) {
    try {
      targetUser = await auth.getUserByEmail(targetInput);
    } catch (e) {
      console.error(`Could not find Firebase Auth user by email "${targetInput}".`);
      process.exit(1);
    }
  } else {
    try {
      targetUser = await auth.getUser(targetInput);
    } catch (e) {
      console.error(`Could not find Firebase Auth user by UID "${targetInput}".`);
      process.exit(1);
    }
  }

  const uid = targetUser.uid;
  const email = targetUser.email || 'admin@bspc.io';

  console.log(`\n[Spark UAT Admin Bootstrap] Processing Target:`);
  console.log(`  - Target UID:   ${uid}`);
  console.log(`  - Target Email: ${email}`);
  console.log(`  - Assigned Role:${role}`);
  console.log(`  - Actor Type:   administrator`);

  // 1. Set Auth Custom Claims
  await auth.setCustomUserClaims(uid, {
    role,
    actorType: 'administrator',
  });
  console.log(`✓ Firebase Auth custom claims set: { role: "${role}", actorType: "administrator" }`);

  // 2. Create adminProfile document
  const now = admin.firestore.Timestamp.now();
  await db.collection('adminProfiles').doc(uid).set(
    {
      uid,
      email,
      role,
      actorType: 'administrator',
      updatedAt: now,
      createdAt: now,
    },
    { merge: true }
  );
  console.log(`✓ Firestore document created: adminProfiles/${uid}`);

  // 3. Record Immutable Audit Event
  await db.collection('adminAuditLogs').add({
    action: 'spark_uat_admin_bootstrap',
    actorUid: uid,
    actorType: 'administrator',
    targetUid: uid,
    details: {
      email,
      role,
      environment: 'spark_uat',
      note: 'Spark UAT administrator claims bootstrap executed locally',
    },
    timestamp: now,
  });
  console.log(`✓ Audit log entry created: adminAuditLogs`);

  console.log(`\n🎉 SPARK UAT ADMIN BOOTSTRAP COMPLETE SUCCESS!`);
  console.log(`The admin user can now log into the staging console with full verified custom claim role: "${role}".\n`);
}

bootstrapStagingAdmin().catch((err) => {
  console.error('BOOTSTRAP FAILURE ERROR:', err);
  process.exit(1);
});
