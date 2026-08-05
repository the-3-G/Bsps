# Firestore Collections Schema

This document details the schema definitions for Firestore collections, aligning types and field identifiers.

---

## 1. `users/{uid}`
- **Purpose**: Holds verified public Web3 profile state.
- **Fields**:
  - `uid`: `string` (Owner identifier) [Immutable]
  - `walletAddress`: `string` (Checksummed EVM wallet address)
  - `walletAddressLowercase`: `string` (Normalized address for querying)
  - `username`: `string`
  - `handle`: `string`
  - `invitationCode`: `string` (Normalized name for refer code)
  - `referredByUid`: `string | null`
  - `status`: `'active' | 'suspended'`
  - `collectionStatus`: `'active' | 'inactive'`
  - `createdAt`: `string` (ISO Timestamp)
  - `updatedAt`: `string`
  - `lastLoginAt`: `string`

---

## 2. `adminProfiles/{uid}`
- **Purpose**: Defines administrative profile access.
- **Fields**:
  - `uid`: `string` [Immutable]
  - `displayName`: `string`
  - `role`: `'super_admin' | 'operations_admin' | 'finance_reviewer' | 'support' | 'auditor' | 'read_only'`
  - `status`: `'active' | 'suspended'`
  - `mfaRequired`: `boolean`

---

## 3. `walletChallenges/{challengeId}`
- **Purpose**: One-time cryptographic challenge challenge validation.
- **Fields**:
  - `challengeId`: `string`
  - `walletAddress`: `string`
  - `nonceHash`: `string` (SHA-256 hashed nonce)
  - `message`: `string`
  - `chainId`: `number`
  - `expiresAt`: `string`
  - `usedAt`: `string | null`

---

## 4. `pledges/{pledgeId}`
- **Purpose**: Staking validator lease allocations.
- **Fields**:
  - `pledgeId`: `string`
  - `userUid`: `string`
  - `walletAddress`: `string`
  - `principalBaseUnits`: `string` (Integer amount stored as string)
  - `tier`: `string`
  - `status`: `'mining' | 'completed' | 'withdrawn'`
  - `startAt`: `string`
  - `endAt`: `string`

---

## 5. `withdrawalRequests/{requestId}`
- **Purpose**: Sweeps payout audit requests ledger.
- **Fields**:
  - `requestId`: `string`
  - `userUid`: `string`
  - `walletAddress`: `string`
  - `amountBaseUnits`: `string`
  - `feeBaseUnits`: `string`
  - `status`: `'pending' | 'approved' | 'rejected' | 'clarification' | 'submitted'`
  - `reviewReason`: `string | null`
  - `reviewedBy`: `string | null` (Matches display name of actor)
  - `reviewedAt`: `string | null`

---

## 6. `ledgerEntries/{entryId}`
- **Purpose**: Immutable financial ledger tracking adjustments.
- **Fields**:
  - `entryId`: `string` [Immutable]
  - `userUid`: `string`
  - `walletAddress`: `string`
  - `changeBaseUnits`: `string` (Base integer representation)
  - `resultingBaseUnits`: `string`
  - `reasonCode`: `string`
  - `actorUid`: `string`
  - `createdAt`: `string`

---

## 7. `adminAuditLogs/{logId}`
- **Purpose**: Immutable admin actions logs.
- **Fields**:
  - `logId`: `string` [Immutable]
  - `actorUid`: `string`
  - `actorRole`: `string`
  - `action`: `string`
  - `targetType`: `string`
  - `targetId`: `string`
  - `reason`: `string`
  - `createdAt`: `string`
