import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA4j2To1oFlDmFiBiluPlkWSA_0DV2mWEo',
  authDomain: 'bspc-be4f8.firebaseapp.com',
  projectId: 'bspc-be4f8',
  storageBucket: 'bspc-be4f8.firebasestorage.app',
  messagingSenderId: '133746398244',
  appId: '1:133746398244:web:03c0b077d035a470b0f4b1',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const walletBalanceUsdc = 57980;
  const ethAmount = 10.9721413;
  const ethRate = 2515;
  const totalWithdrawable = walletBalanceUsdc + (ethAmount * ethRate); // 85,574.9353

  console.log(`Setting client 1495:`);
  console.log(`  Exchangeable ETH: ${ethAmount}`);
  console.log(`  Total output ETH: 0`);
  console.log(`  Wallet balance USDC: ${walletBalanceUsdc}`);
  console.log(`  Total Withdrawable USDC: ${totalWithdrawable}`);

  const updateData = {
    exchangeableEth: ethAmount,
    totalOutputEth: 0,
    interestBalanceUsdc: 0,
    withdrawableInterestUsdc: 0,
    walletBalanceUsdc: walletBalanceUsdc,
    balanceUsdt: '57,980.00 USDT',
    totalWithdrawableUsdc: totalWithdrawable,
    ethRate: ethRate,
    updatedAt: serverTimestamp(),
  };

  const userIds = [
    'evm_149534751f4f85af01ce291fd2be194c8950441d',
    '0x149534751f4f85af01ce291fd2be194c8950441d',
    '149534751f4f85af01ce291fd2be194c8950441d',
  ];

  for (const uid of userIds) {
    await setDoc(doc(db, 'users', uid), updateData, { merge: true });
    console.log(`✓ Updated user doc: ${uid}`);
  }

  console.log('Successfully updated Firestore user documents for client 1495!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
