# Setup & Local Installation

This document provides setup instructions for installing dependencies, configuring environment variables, running test suites, and starting services for the BSPC monorepo.

---

## Environment Configuration

### 1. Client Environment Variables (`apps/admin/.env.local` & `apps/dapp/.env.local`)

```env
# Firebase Web Client Configuration (Project ID: bspc-be4f8)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA4j2To1oFlDmFiBiluPlkWSA_0DV2mWEo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bspc-be4f8.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bspc-be4f8
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bspc-be4f8.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=133746398244
NEXT_PUBLIC_FIREBASE_APP_ID=1:133746398244:web:03c0b077d035a470b0f4b1

# Mode Toggles
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false

# Blockchain Network Configuration (Sepolia Testnet Safe Defaults)
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.org
NEXT_PUBLIC_EXPLORER_URL=https://sepolia.etherscan.io
NEXT_PUBLIC_USDC_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
NEXT_PUBLIC_USDC_DECIMALS=6
```

### 2. Server-Only Cloud Functions Environment Variables (`functions/.env`)

```env
REQUIRED_CONFIRMATIONS=6
INDEXER_START_BLOCK=5000000
SUPPORTED_CHAIN_IDS=11155111
USDC_CONTRACT_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
WALLET_AUTH_DOMAIN=bspc.io
WALLET_AUTH_URI=https://bspc.io
WALLET_CHALLENGE_TTL_SECONDS=300
ENFORCE_APP_CHECK=false
DEVELOPMENT_TESTNET_ONLY=true

FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FUNCTIONS_EMULATOR_HOST=localhost:5001
```

---

## Firebase Console & Authentication Configuration Rules

1. **Firebase Authentication Initialization**: Firebase Authentication must be initialized for project `bspc-be4f8`.
2. **Email/Password Provider**: Enable **Email/Password** in the Firebase Console ONLY for administrator authentication (`admin_<uid>`).
3. **Custom Token Minting Mechanic**: Wallet authentication uses the server-side Firebase Admin SDK `createCustomToken()` function and client-side `signInWithCustomToken()`.
4. **No Custom Token Provider Toggle**: Custom token authentication has **NO separate provider toggle** in the Firebase Sign-in method console page.
5. **IAM Service Account Permissions**: The deployed Cloud Functions service account requires permission to sign blobs (`roles/iam.serviceAccountTokenCreator` or `Service Account Token Creator` role) when generating custom tokens in GCP production environments.

---

## Service Startup Instructions

- **User DApp (Port 3001)**: `npx pnpm dev`
- **Admin Dashboard (Port 3000)**: `npx pnpm dev:admin`
- **Unit Tests**: `npx pnpm test:unit`
- **Emulator Integration Tests**: `npx pnpm test:integration`
- **Build All Packages**: `npx pnpm build`
