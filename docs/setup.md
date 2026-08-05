# Setup & Local Installation

This document provides Windows-compatible setup instructions for starting services in both mock and Firebase modes.

## Prerequisites
- Node.js: `v18.0.0` or higher (verified with `v24.18.0`)
- pnpm: `v11.20.0`
- Firebase CLI: `npm install -g firebase-tools`

## Installation
Run from the root of the repository:
```cmd
npx pnpm install
npx pnpm approve-builds protobufjs
```

---

## Environment Configuration

Create `.env.local` inside `apps/admin/` and `apps/dapp/`.

### Client Environment Variables
```env
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_RPC_URL=https://cloudflare-eth.com
NEXT_PUBLIC_EXPLORER_URL=https://etherscan.io
NEXT_PUBLIC_USDC_ADDRESS=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
NEXT_PUBLIC_USDC_DECIMALS=6
```

---

## Service Startup Instructions

### 1. Mock Mode (Development Default)
No running emulators are required.
- **Admin Dashboard Port 3000**:
  ```cmd
  npx pnpm dev:admin
  ```
- **User DApp Port 3001**:
  ```cmd
  npx pnpm dev
  ```

### 2. Firebase Mode
1. Set `NEXT_PUBLIC_USE_MOCK_DATA=false` inside your `.env.local` files.
2. Select active firebase project:
   ```cmd
   firebase use bspc-mock
   ```
3. Start local Firebase Emulators suite:
   ```cmd
   firebase emulators:start --only auth,firestore,functions
   ```
4. Build administrative Cloud Functions:
   ```cmd
   cd functions
   npx pnpm run build
   ```
5. Start dev portals in separate terminals.
