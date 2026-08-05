# Production Deployment

This document guides the administrator through deploying frontend assets and privileged Cloud Functions.

## Environments Setup

| Environment Target | Firebase Project ID | Custom Domain | Active Mode |
| :--- | :--- | :--- | :--- |
| **Staging** | `bspc-staging` | `staging.bspc.io` | Testnet |
| **Production** | `bspc-production` | `admin.bspc.io` | Mainnet |

---

## Deployment Checklist

### 1. Security Safeguard: `DEVELOPMENT_TESTNET_ONLY`
Ensure that the `DEVELOPMENT_TESTNET_ONLY` flag is set to `true` inside your environment secrets. This safeguard restricts ledger modifications and withdrawal sweeps to testnet chain ID contracts.

### 2. Environment Variables Configuration
Set the following keys inside Google Cloud Secret Manager for Firebase Functions:
- `RPC_URL`: Mainnet JSON-RPC node provider.
- `USDC_CONTRACT_ADDRESS`: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`.

### 3. Deploying Cloud Functions
Run from the root of the project:
```cmd
firebase use bspc-production
firebase deploy --only functions
```

### 4. Deploying Firestore Rules & Indexes
```cmd
firebase deploy --only firestore
```

### 5. Frontend Production Builds
```cmd
npx pnpm build
```
Deploy the output bundle to your chosen static host (e.g. Firebase Hosting or Vercel).
