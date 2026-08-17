import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA4j2To1oFlDmFiBiluPlkWSA_0DV2mWEo",
  authDomain: "bspc-be4f8.firebaseapp.com",
  projectId: "bspc-be4f8",
  storageBucket: "bspc-be4f8.firebasestorage.app",
  messagingSenderId: "133746398244",
  appId: "1:133746398244:web:03c0b077d035a470b0f4b1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  try {
    await signInWithEmailAndPassword(auth, 'admin@bspc.io', 'Admin123!');
    console.log('Logged in successfully');

    const usersSnap = await getDocs(collection(db, 'users'));
    console.log('Users count:', usersSnap.size);
    usersSnap.forEach(doc => {
      console.log('User:', doc.id, doc.data().username, doc.data().walletAddress);
    });

    const loginSnap = await getDocs(collection(db, 'loginEvents'));
    console.log('LoginEvents count:', loginSnap.size);
    loginSnap.forEach(doc => {
      console.log('LoginEvent:', doc.id, doc.data().walletAddress);
    });
  } catch (err) {
    console.error('Error fetching:', err);
  }
}

run();
