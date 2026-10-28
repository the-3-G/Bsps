import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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
  const uids = [
    'evm_149534751f4f85af01ce291fd2be194c8950441d',
    '0x149534751f4f85af01ce291fd2be194c8950441d',
    '149534751f4f85af01ce291fd2be194c8950441d',
  ];

  for (const uid of uids) {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const d = snap.data();
      console.log(`\n=== ${uid} ===`);
      console.log(`  walletBalanceUsdc:       ${d.walletBalanceUsdc}`);
      console.log(`  exchangeableEth:         ${d.exchangeableEth}`);
      console.log(`  interestBalanceUsdc:     ${d.interestBalanceUsdc}`);
      console.log(`  withdrawableInterestUsdc:${d.withdrawableInterestUsdc}`);
      console.log(`  totalWithdrawableUsdc:   ${d.totalWithdrawableUsdc}`);
      console.log(`  totalOutputEth:          ${d.totalOutputEth}`);
      console.log(`  ethRate:                 ${d.ethRate}`);
      console.log(`  balanceUsdt:             ${d.balanceUsdt}`);
    } else {
      console.log(`\n=== ${uid} === NOT FOUND`);
    }
  }

  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
