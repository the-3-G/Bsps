# Test Plan & Verification Strategy

This document details all unit, integration, emulator, and browser test suites, their implementation status, and verified execution results across the BSPC workspace.

---

## 1. Test Suite Architecture

```
├── tests/
│   ├── firebase.test.ts          # Unit: Shared Firebase Client Config & Env Validation
│   ├── web3.test.ts              # Unit: EVM Address Checksumming & EIP-4361 Builders
│   ├── role-auth.test.ts         # Unit: Role Permission Matrix & verifyRole Helper
│   ├── wallet-auth.test.ts       # Unit: Challenge Nonce & Expiry Validation
│   ├── wallet-challenge.test.ts  # Unit: EIP-191 Signature Verification & Claim Isolation
│   ├── admin-boundary.test.ts    # Unit: Admin Route & Cookie Privilege Tampering Guards
│   ├── indexer.test.ts           # Unit: Transfer Log Parsing & Deduplication
│   ├── firestore-rules.test.ts   # Emulator: Live Rules Unit Testing (@firebase/rules-unit-testing)
│   └── functions-integration.test.ts # Emulator: Live Callable Cloud Functions Integration Tests
```

---

## 2. Test Execution Commands

- **Unit Test Suite**: `npx pnpm test:unit`
- **Firestore Emulator Rules Suite**: `npx pnpm test:rules`
- **Cloud Functions Integration Suite**: `npx pnpm test:functions`
- **Full Emulator Integration Suite**: `npx pnpm test:integration`
- **Full Monorepo Verification**: `npx pnpm build && npx pnpm lint && npx pnpm test:integration`

---

## 3. Implementation Status Summary

| Test Category | Target Scope | Execution Context | Implementation Status |
| :--- | :--- | :--- | :--- |
| **Unit Tests** | Web3, Validation, Firebase Client, Roles | Local Vitest | **Implemented & Unit Tested** |
| **Firestore Security Rules** | 15 Security Scenarios | Firestore Emulator (`8080`) | **Implemented & Emulator Tested** |
| **Cloud Functions Integration** | Wallet Auth, Rate Limiting, Replay, Claims | Functions (`5001`) + Auth (`9099`) + Firestore (`8080`) | **Implemented & Emulator Tested** |
| **App Check Staging** | Context validation | Local vs Staging toggles | **Code Present / Console Staging Planned** |
| **Browser Integration** | Bitget Wallet & Injected Providers | Dev Server (`3001` & `3000`) | **Browser Tested** |
