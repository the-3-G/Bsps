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

export const CreateWalletChallengeSchema = z.object({
  walletAddress: EthereumAddressSchema,
  chainId: ChainIdSchema,
});

export const VerifyWalletSignatureSchema = z.object({
  challengeId: z.string().min(1, 'Challenge ID is required'),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, { message: 'Invalid signature format' }),
});

export const CreateSupportConversationSchema = z.object({
  subject: z.string().max(200).optional(),
  source: z.enum(['receive_voucher', 'floating_chat', 'side_menu', 'general_support']).default('general_support'),
  initialMessage: z.string().max(2000).optional(),
});

export const AssignSupportAgentSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
});

export const SendAgentMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  text: z.string().min(1, 'Message cannot be empty').max(2000),
  messageType: z.enum(['text', 'image', 'file', 'system']).default('text'),
});

export const CloseSupportConversationSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  resolutionNote: z.string().max(1000).optional(),
});

export const BlockSupportUserSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  reason: z.string().max(500).optional(),
});

