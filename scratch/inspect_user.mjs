import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyA4j2To1oFlDmFiBiluPlkWSA_0DV2mWEo',
  authDomain: 'bspc-be4f8.firebaseapp.com',
  projectId: 'bspc-be4f8',
  storageBucket: 'bspc-be4f8.firebasestorage.app',
  messagingSenderId: '133746398244',
  appId: '1:133746398244:web:03c0b077d035a470b0f4b1',
};

// Check if there's .env.local
import fs from 'fs';
if (fs.existsSync('./apps/admin/.env.local')) {
  const content = fs.readFileSync('./apps/admin/.env.local', 'utf8');
  content.split('\n').forEach(line => {
    const [k, ...v] = line.trim().split('=');
    if (k && v.length) process.env[k] = v.join('=');
  });
}
if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  firebaseConfig.apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  console.log('Querying Firestore without auth...');
  const snap = await getDocs(collection(db, 'users'));
  console.log('Total users:', snap.size);
  const found = [];
  snap.forEach(d => {
    const data = d.data();
    if (d.id.toLowerCase().includes('1495') || (data.walletAddress && data.walletAddress.toLowerCase().includes('1495'))) {
      found.push({ id: d.id, ...data });
    }
  });

  console.log('Matching users:', JSON.stringify(found, null, 2));
  for (const u of found) {
    console.log(`=== DOC ${u.id} ===`);
    console.log(u);
  }
}

main().catch(console.error);
