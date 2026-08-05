# BSPC Validation Admin & User DApp Monorepo

Authorized functional reconstruction of the cryptocurrency administration dashboard and mobile-first user DApp.

## Technical Stack
- React 19, Next.js 16, TypeScript (Strict Mode)
- Firebase Auth, Firestore, Cloud Functions, and Local Emulators
- Tailwind CSS

---

## Route Inventory

### Apps Admin Portal
- `/login`: Admin authentication panel.
- `/admin/console`: Overview login audits (permission-masked IPs).
- `/admin/users`: Search, suspension actions, downline hierarchy query.
- `/admin/pledges`: Staking tier allocations.
- `/admin/options-orders`: BTC options log with simulation badges.
- `/admin/tax-collection`: platform charge assessments logs.
- `/admin/withdrawals`: Authorized sweep reviews.
- `/admin/security`: MFA state, active session revocation.

### Apps User DApp
- `/`: Warning gate page.
- `/connect`: Nonce signed challenge verification page.
- `/dashboard`: Net balances, security notices.
- `/assets`: Token holdings (USDC, ETH).
- `/withdraw`: Available balance payout sweeps request.

---

## Role Permissions Matrix

- `super_admin`: Full permission.
- `operations_admin`: Manage users and applications.
- `finance_reviewer`: Audit ledgers and approve withdrawals.
- `support`: Read-only queries, cannot approve payouts.
- `auditor`: Access security event logs.
- `read_only`: View only, zero mutation permission.

---

## Environment Configuration

Create `.env.local` inside `apps/admin/` and `apps/dapp/`:
```env
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_RPC_URL=https://cloudflare-eth.com
NEXT_PUBLIC_EXPLORER_URL=https://etherscan.io
NEXT_PUBLIC_USDC_ADDRESS=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
NEXT_PUBLIC_USDC_DECIMALS=6
```

---

## Workspace Build & Start Commands

1. **Install Dependencies**:
   ```bash
   npx pnpm install
   ```
2. **Start Dev Servers**:
   ```bash
   npx pnpm dev:admin
   # Active on http://localhost:3000
   ```
3. **Compile Code Verification**:
   ```bash
   npx tsc --noEmit
   ```
4. **Workspace Linter Verification**:
   ```bash
   npx pnpm lint
   ```
