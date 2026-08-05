import { z } from 'zod';

export const EthereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, { message: 'Invalid Ethereum address format' });

export const TxHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, { message: 'Invalid transaction hash format' });

export const ChainIdSchema = z.number().int().positive();

export const AdminWalletConfigInputSchema = z.object({
  address: EthereumAddressSchema,
  name: z.string().min(1, 'Name is required').max(100),
  isActive: z.boolean().default(true),
});

export const SignatureAuthSchema = z.object({
  address: EthereumAddressSchema,
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, { message: 'Invalid signature format' }),
  nonce: z.string().min(1),
});
