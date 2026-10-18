import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
  const walletAddress = '0x149534751f4f85Af01ce291FD2be194c8950441d';
  const cleanAddr = '149534751f4f85af01ce291fd2be194c8950441d';
  const ethAmount = 10.9721413;
  const ethRate = 2515;
  const usdcFromEth = 27594.9353;
  const walletBalanceUsdc = 57980;
  const totalWithdrawableUsdc = 85574.9353;

  const now = new Date();
  const timeStr = now.toString();

  const exchangeRecords = [
    {
      id: `ex-${cleanAddr}-1`,
      type: 'exchange',
      time: timeStr,
      timestamp: Date.now(),
      quantity: `${ethAmount} ETH`,
      ethAmount: ethAmount,
      usdcAmount: usdcFromEth,
      rate: ethRate,
      status: 'Success',
    }
  ];

  const withdrawalRecords = [
    {
      id: `wd-${cleanAddr}-1`,
      type: 'withdraw',
      time: timeStr,
      timestamp: Date.now(),
      quantity: `${totalWithdrawableUsdc.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} USDC`,
      amountUsdc: totalWithdrawableUsdc,
      status: 'Pending',
    }
  ];

  const interestRecords = [
    {
      id: `int-${cleanAddr}-1`,
      type: 'interest',
      time: timeStr,
      timestamp: Date.now(),
      quantity: `${ethAmount} ETH`,
      status: 'Success',
    }
  ];

  const userData = {
    walletAddress: walletAddress,
    walletAddressLowercase: walletAddress.toLowerCase(),
    clientAlias: 'J Warren',
    username: 'User_441D',
    adminNote: 'Authorized client',
    customNote: 'Authorized client',
    authorizationStatus: 'authorized',
    status: 'active',
    collectionStatus: 'active',
    vipName: 'Tier A',
    vipLevel: 1,
    balanceUsdt: '57,980.00 USDT',
    collectedAmount: '57980 USDC',
    walletBalanceUsdc: walletBalanceUsdc,
    totalOutputEth: ethAmount,
    exchangeableEth: 0,
    interestBalanceUsdc: usdcFromEth,
    withdrawableInterestUsdc: usdcFromEth,
    totalWithdrawableUsdc: totalWithdrawableUsdc,
    ethRate: ethRate,
    exchangeRecords: exchangeRecords,
    withdrawalRecords: withdrawalRecords,
    interestRecords: interestRecords,
    updatedAt: serverTimestamp(),
  };

  const userIds = [
    '0x149534751f4f85af01ce291fd2be194c8950441d',
    '149534751f4f85af01ce291fd2be194c8950441d',
    'evm_149534751f4f85af01ce291fd2be194c8950441d',
  ];

  console.log('Updating user documents...');
  for (const uid of userIds) {
    await setDoc(doc(db, 'users', uid), userData, { merge: true });
    console.log(`Updated user doc: ${uid}`);
  }

  // Create withdrawal request in withdrawalRequests collection
  console.log('Creating withdrawal request...');
  const wdRef = await addDoc(collection(db, 'withdrawalRequests'), {
    userUid: 'evm_149534751f4f85af01ce291fd2be194c8950441d',
    walletAddress: walletAddress,
    userShortId: '441D',
    destinationAddress: walletAddress,
    chainId: 1,
    tokenAddress: 'USDC',
    amountBaseUnits: totalWithdrawableUsdc.toString(),
    amountUsdc: totalWithdrawableUsdc,
    feeBaseUnits: '0',
    type: 'interest_withdrawal',
    message: `Id 441D is withdrawing: ${totalWithdrawableUsdc} USDC`,
    status: 'pending',
    submittedAt: now.toISOString(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log(`Created withdrawal request doc: ${wdRef.id}`);

  console.log('Done!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error executing script:', err);
  process.exit(1);
});
