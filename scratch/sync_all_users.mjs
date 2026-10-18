import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

// Known aliases mapping for historical accuracy
const KNOWN_ALIASES = {
  '149534751f4f85af01ce291fd2be194c8950441d': 'J Warren',
  '16dbdb5a6ab9ca0e6a4236721ec4eea290b94765': 'Argalw Addis',
  '6a8185cd5e524055ea4df59ef29f112133f9db71': 'BOB',
  '7c4359a0cbacf70d61e5937aca1ca36bb5b3d7ed': 'Mine',
};

async function main() {
  const isApply = process.argv.includes('--apply');
  console.log(`=== SYNC ALL USERS (Mode: ${isApply ? 'APPLY' : 'DRY RUN'}) ===\n`);

  const snap = await getDocs(collection(db, 'users'));
  console.log(`Found ${snap.size} total user documents in Firestore.`);

  // Group by clean 40-char wallet hex
  const byWallet = {};
  snap.forEach((d) => {
    const data = d.data();
    let clean = d.id.toLowerCase().replace(/^evm_/, '').replace(/^0x/, '');
    if (clean.length !== 40 && data.walletAddress) {
      clean = data.walletAddress.toLowerCase().replace(/^0x/, '');
    }
    if (clean.length !== 40 && data.walletAddressLowercase) {
      clean = data.walletAddressLowercase.toLowerCase().replace(/^0x/, '');
    }
    if (clean.length === 40) {
      if (!byWallet[clean]) byWallet[clean] = [];
      byWallet[clean].push({ id: d.id, data });
    }
  });

  const walletKeys = Object.keys(byWallet);
  console.log(`Identified ${walletKeys.length} unique wallet addresses.\n`);

  let updatedCount = 0;

  for (const clean of walletKeys) {
    const docEntries = byWallet[clean];
    const docIds = docEntries.map((e) => e.id);

    // Merge strategy
    let clientAlias = KNOWN_ALIASES[clean] || '';
    let username = `User_${clean.slice(-4).toUpperCase()}`;
    let adminNote = '';
    let customNote = '';
    let authorizationStatus = 'unauthorized';
    let status = 'active';
    let collectionStatus = 'active';
    let vipName = 'Iron';
    let vipLevel = 1;
    let walletBalanceUsdc = 0;
    let balanceUsdt = '';
    let totalOutputEth = 0;
    let exchangeableEth = 0;
    let interestBalanceUsdc = 0;
    let withdrawableInterestUsdc = 0;
    let totalWithdrawableUsdc = 0;
    let ethRate = 2515;
    let walletAddress = `0x${clean}`;

    const exchangeRecordsMap = new Map();
    const withdrawalRecordsMap = new Map();
    const interestRecordsMap = new Map();

    for (const { data } of docEntries) {
      if (data.walletAddress && data.walletAddress.startsWith('0x') && data.walletAddress.length === 42) {
        walletAddress = data.walletAddress;
      }
      if (data.clientAlias && !clientAlias) clientAlias = data.clientAlias;
      if (data.alias && !clientAlias) clientAlias = data.alias;
      if (data.username && !data.username.startsWith('User_')) username = data.username;
      if (data.adminNote) adminNote = data.adminNote;
      if (data.customNote) customNote = data.customNote;

      // Status: if ANY doc is authorized, keep authorized!
      if (data.authorizationStatus === 'authorized') {
        authorizationStatus = 'authorized';
      } else if (data.authorizationStatus === 'authorized_pending' && authorizationStatus !== 'authorized') {
        authorizationStatus = 'authorized_pending';
      }

      // If user has deposited funds or earned output on the platform, they are an authorized active client
      if (walletBalanceUsdc > 0 || totalOutputEth > 0 || exchangeableEth > 0) {
        authorizationStatus = 'authorized';
      }

      if (data.status) status = data.status;
      if (data.collectionStatus) collectionStatus = data.collectionStatus;
      if (data.vipName) vipName = data.vipName;
      if (typeof data.vipLevel === 'number' && data.vipLevel > 0) vipLevel = data.vipLevel;

      // Numeric balances - pick highest/defined
      if (typeof data.walletBalanceUsdc === 'number' && data.walletBalanceUsdc > walletBalanceUsdc) {
        walletBalanceUsdc = data.walletBalanceUsdc;
      }
      if (data.balanceUsdt) {
        const parsed = parseFloat(String(data.balanceUsdt).replace(/[^\d.]/g, ''));
        if (!isNaN(parsed) && parsed > walletBalanceUsdc) {
          walletBalanceUsdc = parsed;
        }
      }

      if (typeof data.totalOutputEth === 'number' && data.totalOutputEth > totalOutputEth) {
        totalOutputEth = data.totalOutputEth;
      }
      if (typeof data.exchangeableEth === 'number' && data.exchangeableEth > exchangeableEth) {
        exchangeableEth = data.exchangeableEth;
      }
      if (typeof data.interestBalanceUsdc === 'number' && data.interestBalanceUsdc > interestBalanceUsdc) {
        interestBalanceUsdc = data.interestBalanceUsdc;
      }
      if (typeof data.withdrawableInterestUsdc === 'number' && data.withdrawableInterestUsdc > withdrawableInterestUsdc) {
        withdrawableInterestUsdc = data.withdrawableInterestUsdc;
      }
      if (typeof data.totalWithdrawableUsdc === 'number' && data.totalWithdrawableUsdc > totalWithdrawableUsdc) {
        totalWithdrawableUsdc = data.totalWithdrawableUsdc;
      }
      if (typeof data.ethRate === 'number' && data.ethRate > 0) {
        ethRate = data.ethRate;
      }

      // Records
      if (Array.isArray(data.exchangeRecords)) {
        for (const r of data.exchangeRecords) {
          if (r && (r.id || r.timestamp)) {
            const key = r.id || `ex-${r.timestamp}`;
            exchangeRecordsMap.set(key, r);
          }
        }
      }
      if (Array.isArray(data.withdrawalRecords)) {
        for (const r of data.withdrawalRecords) {
          if (r && (r.id || r.timestamp)) {
            const key = r.id || `wd-${r.timestamp}`;
            withdrawalRecordsMap.set(key, r);
          }
        }
      }
      if (Array.isArray(data.interestRecords)) {
        for (const r of data.interestRecords) {
          if (r && (r.id || r.timestamp)) {
            const key = r.id || `int-${r.timestamp}`;
            interestRecordsMap.set(key, r);
          }
        }
      }
    }

    // If user has deposited funds or earned output on the platform, they are an authorized active client
    if (walletBalanceUsdc > 0 || totalOutputEth > 0 || exchangeableEth > 0) {
      authorizationStatus = 'authorized';
    }

    // Default totalWithdrawableUsdc calculation if not set
    if (totalWithdrawableUsdc <= 0 && (walletBalanceUsdc > 0 || interestBalanceUsdc > 0 || exchangeableEth > 0)) {
      totalWithdrawableUsdc = walletBalanceUsdc + interestBalanceUsdc + (exchangeableEth * ethRate);
    }

    // Balance string
    if (walletBalanceUsdc > 0) {
      balanceUsdt = `${walletBalanceUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
    }

    const unifiedData = {
      walletAddress,
      walletAddressLowercase: `0x${clean}`,
      authorizationStatus,
      status,
      collectionStatus,
      vipName,
      vipLevel,
      ethRate,
      updatedAt: serverTimestamp(),
    };

    if (clientAlias) unifiedData.clientAlias = clientAlias;
    if (username) unifiedData.username = username;
    if (adminNote) unifiedData.adminNote = adminNote;
    if (customNote) unifiedData.customNote = customNote;
    if (walletBalanceUsdc > 0) {
      unifiedData.walletBalanceUsdc = walletBalanceUsdc;
      unifiedData.balanceUsdt = balanceUsdt;
    }
    if (totalOutputEth > 0) unifiedData.totalOutputEth = totalOutputEth;
    if (exchangeableEth > 0) unifiedData.exchangeableEth = exchangeableEth;
    if (interestBalanceUsdc > 0) {
      unifiedData.interestBalanceUsdc = interestBalanceUsdc;
      unifiedData.withdrawableInterestUsdc = interestBalanceUsdc;
    }
    if (totalWithdrawableUsdc > 0) unifiedData.totalWithdrawableUsdc = totalWithdrawableUsdc;

    if (exchangeRecordsMap.size > 0) unifiedData.exchangeRecords = Array.from(exchangeRecordsMap.values());
    if (withdrawalRecordsMap.size > 0) unifiedData.withdrawalRecords = Array.from(withdrawalRecordsMap.values());
    if (interestRecordsMap.size > 0) unifiedData.interestRecords = Array.from(interestRecordsMap.values());

    const targetDocIds = [
      `evm_${clean}`,
      `0x${clean}`,
      clean,
    ];

    console.log(`[Wallet 0x${clean}] Docs: [${docIds.join(', ')}] -> Syncing to [${targetDocIds.join(', ')}]`);
    console.log(`   Alias: "${clientAlias || 'N/A'}" | Auth: "${authorizationStatus}" | WalletUSDC: ${walletBalanceUsdc} | OutputETH: ${totalOutputEth} | ExchETH: ${exchangeableEth} | WithdrawableUSDC: ${totalWithdrawableUsdc}`);

    if (isApply) {
      for (const targetId of targetDocIds) {
        const docRef = doc(db, 'users', targetId);
        await setDoc(docRef, { ...unifiedData, uid: targetId }, { merge: true });
      }
      updatedCount++;
    }
  }

  console.log(`\n=== COMPLETED ${isApply ? `APPLIED TO ${updatedCount} WALLETS` : 'DRY RUN'} ===`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error during sync:', err);
  process.exit(1);
});
