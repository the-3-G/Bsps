# Security Model & Access Control Architecture

This document describes the security boundaries, Role-Based Access Control (RBAC) permissions matrix, Web3 signature validation rules, and prohibition guidelines across the BSPC workspace.

---

## 1. Zero-Trust Architecture & Database Boundaries

1. **Firestore Default Deny-All**: All read and write access is denied by default (`match /{document=**} { allow read, write: if false; }`).
2. **Owner-Scoped User Document Access**: Users can only read their own profile documents (`request.auth.uid == uid`). Direct updates by users to sensitive fields (`role`, `status`, `balanceUsdt`, `balanceEth`, `onChainVerifiedUsdc`, `collectionStatus`) are explicitly denied by rule logic.
3. **Immutable Collections**: Direct client write access to financial ledger entries (`ledgerEntries`), administrative audit logs (`adminAuditLogs`), login events (`loginEvents`), and wallet challenges (`walletChallenges`) is strictly denied (`allow write: if false;`). Writes are executed exclusively by server-side Cloud Functions using the Firebase Admin SDK.
4. **UID Namespacing & Custom Claims**:
   - Wallet users use the deterministic UID format `evm_<lowercase-address-without-0x>` and custom claim `{ actorType: "wallet_user" }`.
   - Administrators use stable administrative UIDs `admin_<id>` and role custom claims (`{ role: "super_admin" }`).
   - Wallet authentication **never** grants administrator access, and `setCustomUserClaims` for wallet logins will **never** assign or overwrite administrator roles.
5. **Static Admin Middleware Disclaimer**: The Next.js client middleware in `apps/admin` provides UX route navigation guards only. Privilege enforcement is 100% server-side via custom claims verification in Cloud Functions and Firestore Security Rules.

---

## 2. Web3 EIP-4361 Signature & Nonce Security Controls

1. **EIP-4361 Standard Message**: Messages follow EIP-4361 / EIP-191 standard formatting. Statements state:
   *“Sign in to BSPC. This request authenticates your wallet only. It does not initiate a transaction, transfer assets, or grant token approval.”*
2. **Cryptographic Nonce Entropy**: Challenge nonces are generated on the server with 128-bit cryptographic entropy (`crypto.randomBytes(16)`). Plain nonces are never stored; only SHA-256 hashes (`nonceHash`) are saved in Firestore.
3. **Atomic Challenge Consumption**: `verifyWalletSignature` consumes challenges inside Firestore transactions (`status: 'consumed'`, `usedAt: Timestamp.now()`), preventing concurrent replay attempts.
4. **EIP-55 Address Checksumming**: Addresses are normalized using `viem` `getAddress()`. Signature verification recovers addresses via `viem` `verifyMessage()`.
5. **Sepolia Network Scoping**: Chain ID is strictly checked to Sepolia (`11155111`). Non-Sepolia sign-in requests are rejected (`UNSUPPORTED_CHAIN`).

---

## 3. Firebase Authentication Mechanic

- **Email/Password Provider**: Enabled ONLY for administrator authentication (`admin_<uid>`).
- **Custom Token Minting**: Wallet sign-in uses `admin.auth().createCustomToken(uid)` and client `signInWithCustomToken()`. There is **no separate Custom Token provider toggle** in the Firebase Sign-in method console.
