# Security Model

This document describes the administrative and DApp security design boundaries of the BSPC workspace.

---

## 1. Zero-Trust Access Model
- **Firestore Access Rule Boundaries**: Default is strict deny-all. Reads are scoped to owner UID records. Direct client modifications to sensitive records (e.g. logs, balances) are completely denied.
- **Custom Claims Validation**: User roles (`super_admin`, `operations_admin`, `finance_reviewer`, `support`, `auditor`, `read_only`) are verified from Auth Custom Claim tokens rather than mutable Firestore profiles.

---

## 2. Wallet Signed-Message Authentication
1. User requests auth challenge, creating a cryptographically secure SHA-256 hashed nonce.
2. Sign-in message details target domain, nonce, timestamp, chain ID, and explicit warnings that signing does not initiate transactions or cost gas.
3. Signature verification recovers EVM address on the server side to issue Firebase Custom Login Tokens.
4. Nonces are single-use only and expire within 10 minutes.

---

## 3. Strict Safety Prohibitions
The application is strictly prohibited from requesting, collecting, caching, or writing:
- **Seed Phrases / Recovery Phrases**
- **Wallet Private Keys**
- **Wallet Software Passwords**
- **Hidden ERC-20 token approvals**
