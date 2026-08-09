import * as admin from 'firebase-admin';

/**
 * Server-Side Admin Bootstrap Script for Staging / Production
 *
 * Usage:
 *   npx ts-node scripts/bootstrap-admin.ts <UID> <ROLE> [EMAIL]
 * Or via env:
 *   STAGING_ADMIN_UID=xxx STAGING_ADMIN_ROLE=super_admin STAGING_ADMIN_EMAIL=admin@bspc.io npx ts-node scripts/bootstrap-admin.ts
 */

async function bootstrapAdmin() {
  const uid = process.argv[2] || process.env.STAGING_ADMIN_UID;
  const role = process.argv[3] || process.env.STAGING_ADMIN_ROLE || 'super_admin';
  const email = process.argv[4] || process.env.STAGING_ADMIN_EMAIL || 'admin@bspc.io';

  if (!uid) {
    console.error('ERROR: Missing Admin UID parameter.');
    console.log('Usage: npx ts-node scripts/bootstrap-admin.ts <UID> [ROLE] [EMAIL]');
    process.exit(1);
  }

  // Initialize Admin SDK if not already initialized
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const db = admin.firestore();

  console.log(`[Bootstrap] Bootstrapping Admin User:`);
  console.log(`  - UID:   ${uid}`);
  console.log(`  - Role:  ${role}`);
  console.log(`  - Email: ${email}`);

  // 1. Assign custom claim
  await admin.auth().setCustomUserClaims(uid, { role });
  console.log(`✓ Auth custom claim { role: "${role}" } assigned.`);

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
  console.log(`✓ Firestore document adminProfiles/${uid} created.`);

  // 3. Write adminAuditLog bootstrap event
  await db.collection('adminAuditLogs').add({
    action: 'bootstrap_super_admin',
    actorUid: uid,
    actorType: 'administrator',
    targetUid: uid,
    details: {
      email,
      role,
      environment: 'staging',
      note: 'Initial staging administrator bootstrap',
    },
    timestamp: now,
  });
  console.log(`✓ Immutable audit record written to adminAuditLogs.`);
  console.log(`\n🎉 STAGING ADMIN BOOTSTRAP COMPLETE!`);
}

bootstrapAdmin().catch((err) => {
  console.error('CRITICAL BOOTSTRAP ERROR:', err);
  process.exit(1);
});
