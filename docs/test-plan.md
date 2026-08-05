# Test Plan

This document describes all test suites, their current implementation status, and verified results.

## Test Framework

| Tool | Version | Purpose |
| :--- | :--- | :--- |
| **Vitest** | `^4.1.10` | Unit tests for pure logic in workspace packages and test helpers |
| Firebase Emulator Suite | Firebase CLI | Integration/rules testing (Planned) |
| Playwright | Not yet installed | E2E browser tests (Planned) |

**Test command:**
```cmd
npx vitest run
```

---

## Test Files

| File | Suites | Tests | Status |
| :--- | :--- | :--- | :--- |
| [`tests/web3.test.ts`](../tests/web3.test.ts) | 3 | 13 | ✅ **All pass** |
| [`tests/role-auth.test.ts`](../tests/role-auth.test.ts) | 2 | 21 | ✅ **All pass** |
| [`tests/wallet-auth.test.ts`](../tests/wallet-auth.test.ts) | 4 | 8 | ✅ **All pass** |
| [`tests/indexer.test.ts`](../tests/indexer.test.ts) | 4 | 14 | ✅ **All pass** |

**Total: 4 test files, 54 tests — 54 passed, 0 failed.**

---

## Security Scenario Coverage

| Scenario | Covered by | Status |
| :--- | :--- | :--- |
| Unauthenticated user blocked | `role-auth.test.ts` — authentication guard | ✅ Verified |
| `support` blocked from withdrawal approval | `role-auth.test.ts` — role permission matrix | ✅ Verified |
| `auditor` blocked from user status mutation | `role-auth.test.ts` — role permission matrix | ✅ Verified |
| `finance_reviewer` blocked from `assignAdminRole` | `role-auth.test.ts` — role permission matrix | ✅ Verified |
| Missing role claim blocked | `role-auth.test.ts` | ✅ Verified |
| Expired nonce rejection | `wallet-auth.test.ts` — Nonce expiry enforcement | ✅ Verified |
| Reused nonce rejection | `wallet-auth.test.ts` — Nonce replay prevention | ✅ Verified |
| Wrong domain rejection (phishing prevention) | `wallet-auth.test.ts` — Signature domain binding | ✅ Verified |
| Wrong chain ID rejection (cross-chain replay) | `wallet-auth.test.ts` — Signature chain ID binding | ✅ Verified |
| Duplicate blockchain event deduplication | `indexer.test.ts` — Deduplication key generation | ✅ Verified |
| Wrong token contract rejection | `indexer.test.ts` — Transfer log validation | ✅ Verified |
| Wrong recipient address rejection | `indexer.test.ts` — Transfer log validation | ✅ Verified |
| Unconfirmed transaction not marked confirmed | `indexer.test.ts` — Confirmation count threshold | ✅ Verified |
| Malformed transaction hash rejection | `indexer.test.ts` — Transaction hash validation | ✅ Verified |
| Malformed wallet address rejection | `web3.test.ts` — sanitizeAndChecksumAddress | ✅ Verified |
| Invalid EIP-55 mixed-case address rejection | `web3.test.ts` — viem strict mode | ✅ Verified |
| Direct ledger write from client | Firestore security rules | ⚠️ Planned — emulator test needed |
| Direct audit-log write from client | Firestore security rules | ⚠️ Planned — emulator test needed |
| App Check rejection | Firebase App Check integration | ⚠️ Planned |
| Expired admin session | Middleware test | ⚠️ Planned |

---

## Planned Additions (Not Yet Implemented)

| Suite | Requires | Priority |
| :--- | :--- | :--- |
| Firestore Security Rules tests | Firebase Local Emulator Suite + `@firebase/rules-unit-testing` | High |
| Cloud Function integration tests | Firebase Local Emulator Suite + `firebase-functions-test` | High |
| Playwright admin E2E tests | Playwright + running admin dev server | Medium |
| Playwright DApp E2E tests | Playwright + running DApp dev server | Medium |
| Accessibility tests | Playwright + axe-playwright | Low |
