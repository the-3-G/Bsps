const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'bspc-be4f8' });

async function run() {
  try {
    const user = await admin.auth().createUser({
      email: 'admin@bspc.io',
      password: 'BspcAdmin123!',
      displayName: 'Super Admin'
    });
    console.log('Created user:', user.uid);
    await admin.auth().setCustomUserClaims(user.uid, { role: 'super_admin' });
    console.log('Set custom claims');
  } catch(e) {
    if (e.code === 'auth/email-already-exists') {
      const user = await admin.auth().getUserByEmail('admin@bspc.io');
      await admin.auth().updateUser(user.uid, { password: 'BspcAdmin123!' });
      await admin.auth().setCustomUserClaims(user.uid, { role: 'super_admin' });
      console.log('Updated user and set custom claims');
    } else {
      console.error(e);
    }
  }
}
run();
