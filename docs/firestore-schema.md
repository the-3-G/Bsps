# Firestore Collections Schema & Data Model

This document provides the authoritative schema specification for Cloud Firestore collections in project `bspc-be4f8`.

---

## Key Data Model Updates (Phase 6)

1. **`walletChallenges/{challengeId}`**: Stored timestamps (`issuedAt`, `expiresAt`, `usedAt`, `createdAt`) use Firestore `Timestamp` objects. Stores `nonceHash` (SHA-256), `message` (EIP-4361 string), `domain`, `uri`, `status` (`'pending' | 'consumed' | 'expired' | 'revoked'`). Client read & write are strictly denied (`allow read, write: if false;`).
2. **`loginEvents/{eventId}`**: Audit log of security authentication events (`eventType`: `'CHALLENGE_CREATED'`, `'LOGIN_SUCCESS'`, `'INVALID_SIGNATURE'`, `'UNSUPPORTED_CHAIN'`). Client writes are strictly denied (`allow create: if false;`).
3. **`users/{uid}`**: User UID format for Web3 wallet users is `evm_<lowercase-address-without-0x>`. Custom claim set is `{ actorType: "wallet_user" }`. `createdAt` is preserved across logins.

---

## Collection Definitions

### `walletChallenges/{challengeId}`
- **Purpose**: Server-managed challenge nonces for EIP-4361 wallet sign-in.
- **Access Control**: Client read: DENIED (`if false`); Client write: DENIED (`if false`); Server-only.
- **Fields**:
  - `challengeId`: `string` [Immutable]
  - `walletAddress`: `string` (EIP-55 checksummed)
  - `walletAddressLowercase`: `string`
  - `chainId`: `number` (Sepolia `11155111`)
  - `nonceHash`: `string` (SHA-256 hash of plaintext nonce)
  - `message`: `string` (Full EIP-4361 formatted string)
  - `domain`: `string` (`bspc.io`)
  - `uri`: `string` (`https://bspc.io`)
  - `issuedAt`: `Timestamp`
  - `expiresAt`: `Timestamp` (300 seconds TTL)
  - `usedAt`: `Timestamp | null`
  - `status`: `'pending' | 'consumed' | 'expired' | 'revoked'`
  - `requestIpHash`: `string` (SHA-256 hash of IP)
  - `userAgentHash`: `string` (SHA-256 hash of user agent)
  - `createdAt`: `Timestamp`

### `loginEvents/{eventId}`
- **Purpose**: Audit log of login events and security alerts.
- **Access Control**: Client read: Owner or Admin; Client write: DENIED (`if false`); Server-only.
- **Fields**:
  - `eventId`: `string` [Immutable]
  - `eventType`: `string`
  - `success`: `boolean`
  - `walletAddress`: `string`
  - `reasonCode`: `string`
  - `ipHash`: `string`
  - `userAgentSummary`: `string`
  - `createdAt`: `Timestamp`
