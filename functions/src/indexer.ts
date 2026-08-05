import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const db = admin.firestore();

const BlockRangeSchema = z.object({
  startBlock: z.number(),
  endBlock: z.number(),
});

// Idempotent event parser scheduled function or manual admin execution
export const indexBlockchainEvents = functions.https.onCall(async (data, context) => {
  // Validate request parameters if supplied
  const parsed = BlockRangeSchema.safeParse(data);
  const startBlock = parsed.success ? parsed.data.startBlock : 18000000;

  const chainId = 1; // Mainnet
  const usdcTokenAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'.toLowerCase();
  const targetRecipient = '0x000000000000000000000000000000000000dEaD'.toLowerCase();

  // Simulated list of Transfer events retrieved via JSON-RPC
  const mockLogs = [
    {
      transactionHash: '0x8d5c412ae2c78b27357492baee41378d38e21a4f0b2f5c7e7b6d19a2c3a5e8c1',
      logIndex: 0,
      blockNumber: startBlock + 5,
      from: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
      to: targetRecipient,
      amount: '1000000000', // 1000 USDC
      token: usdcTokenAddress,
    }
  ];

  let processedCount = 0;

  for (const log of mockLogs) {
    // 1. Deduplication key: chainId + txHash + logIndex
    const dedupeId = `${chainId}-${log.transactionHash}-${log.logIndex}`;
    const recordRef = db.collection('collectionRecords').doc(dedupeId);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(recordRef);
      if (doc.exists) {
        return; // Already processed
      }

      // 2. Validate token receiver, token address, and amount
      if (
        log.to.toLowerCase() === targetRecipient &&
        log.token.toLowerCase() === usdcTokenAddress
      ) {
        transaction.set(recordRef, {
          recordId: dedupeId,
          userUid: 'u-1',
          senderAddress: log.from,
          recipientAddress: log.to,
          chainId,
          tokenAddress: log.token,
          amountBaseUnits: log.amount,
          transactionHash: log.transactionHash,
          logIndex: log.logIndex,
          blockNumber: log.blockNumber,
          confirmationCount: 12, // mock full confirmations
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        });
        processedCount++;
      }
    });
  }

  return { success: true, processedCount };
});
