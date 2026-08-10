# SPARK UAT MODE — SECURITY & ARCHITECTURE LIMITATIONS

## Overview

This environment operates in **ZERO-COST SPARK UAT MODE** (`NEXT_PUBLIC_SPARK_UAT_MODE=true`) on Firebase project `bspc-be4f8`.

Because the project is deployed on the free Firebase Spark plan without billing enabled, backend Cloud Functions are **not deployed**. All application functionality in this environment relies strictly on client-side Web3 logic, Firebase Authentication, and Firestore Security Rules.

---

## Enabled Functionality in Spark UAT Mode

| Feature | Status | Implementation Details |
|---|---|---|
| Public DApp Hosting | **ENABLED** | Static build hosted on Firebase Hosting (`bspc-dapp-staging.web.app`) |
| Admin Console Hosting | **ENABLED** | Static build hosted on Firebase Hosting (`bspc-admin-staging.web.app`) |
| Anonymous Guest Auth | **ENABLED** | `signInAnonymously()` for public customer service session |
| Admin Custom Claims Auth | **ENABLED** | Server-side custom claims (`request.auth.token.role`) set via local CLI script |
| Real-time Customer Service | **ENABLED** | Firestore-based chat with strict security rules enforcing guest/agent boundaries |
| Admin Queue & Assignment | **ENABLED** | Support admins (`super_admin`, `operations_admin`, `support`) can self-assign and reply |
| Sepolia Blockchain Read | **ENABLED** | Sepolia RPC connection for network reference (`11155111`) |

---

## Disabled Functions-Dependent Features

The following features require server-side execution via Firebase Cloud Functions or smart contract deployment and are **STRICTLY DISABLED** in Spark UAT Mode:

1. **Cloud Function Callables**:
   - Server-side EIP-4361 wallet challenge creation & verification custom tokens (`createWalletChallenge`, `verifyWalletSignature`)
   - Server-side admin claim self-assignment (`devSetAdminClaims` - strictly disabled outside local emulators)
   - Server-side automated balance adjustments and ledger mutations
   - Automated export jobs requiring backend compute

2. **Mainnet & Financial Transactions**:
   - Ethereum Mainnet (Chain ID 1) transactions
   - On-chain token approvals (`approve`)
   - On-chain USDT / USDC deposit and withdrawal execution
   - Real yield distribution and balance mutations

When an admin or user attempts to invoke these features, the UI displays `"Not available in UAT"` rather than failing silently.

---

## Security Boundary Architecture

In Spark UAT Mode, **Firestore Security Rules** serve as the sole security enforcement boundary:

- **Anonymous Guests**: Can only create `waiting` conversations for their own `request.auth.uid`. Guests can only write `text` messages with `senderType: 'guest'`. Guests cannot impersonate agents/system senders, set `assignedAgentUid`, or alter status.
- **Support Admins**: Authorized strictly via `request.auth.token.role` in verified custom claims (`super_admin`, `operations_admin`, `support`). Mutable Firestore profile fields (`adminProfiles`) are **never** used alone for authorization.
- **Admin Claim Bootstrap**: Executed strictly on developer machines via `scripts/bootstrap-staging-admin.ts` using local service account credentials. Credentials are never committed to Git or exposed to hosting bundles.

---

## Blaze Upgrade & Production Transition Path

When the project is upgraded to the Firebase Blaze (Pay-as-you-Go) plan:
1. Deployed Cloud Functions will be built and deployed via `npx firebase deploy --only functions --project bspc-be4f8`.
2. Set `NEXT_PUBLIC_SPARK_UAT_MODE=false`.
3. Client components will automatically use server callables (`createSupportConversation`, `sendAgentMessage`, `assignSupportAgent`, `closeSupportConversation`, `blockSupportUser`) for all workflows.
