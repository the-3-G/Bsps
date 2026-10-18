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
  const usdcFromEth = ethAmount * ethRate; // 27,594.9353 USDC
  const totalWithdrawable = walletBalanceUsdc + usdcFromEth; // 85,574.9353 USDC

  console.log(`Wallet balance USDC: ${walletBalanceUsdc}`);
  console.log(`ETH converted: ${ethAmount} ETH × ${ethRate} = ${usdcFromEth.toFixed(4)} USDC`);
  console.log(`Total withdrawable: ${totalWithdrawable.toFixed(4)} USDC`);

  const fixData = {
    walletBalanceUsdc: walletBalanceUsdc,
    exchangeableEth: 0,                        // Already fully converted
    interestBalanceUsdc: usdcFromEth,           // 27,594.9353 USDC from ETH conversion
    withdrawableInterestUsdc: usdcFromEth,
    totalWithdrawableUsdc: totalWithdrawable,   // 85,574.9353 USDC
    totalOutputEth: ethAmount,
    ethRate: ethRate,
    updatedAt: serverTimestamp(),
  };

  const userIds = [
    'evm_149534751f4f85af01ce291fd2be194c8950441d',
    '0x149534751f4f85af01ce291fd2be194c8950441d',
    '149534751f4f85af01ce291fd2be194c8950441d',
  ];

  for (const uid of userIds) {
    await setDoc(doc(db, 'users', uid), fixData, { merge: true });
    console.log(`✓ Fixed: ${uid}`);
  }

  console.log(`\nDone! Total withdrawable set to: ${totalWithdrawable.toFixed(4)} USDC`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
