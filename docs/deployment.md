# Deployment & Operations Guide

This document specifies deployment procedures, service account permissions, App Check staging options, and environment boundaries for project `bspc-be4f8`.

---

## 1. Firebase Authentication & GCP IAM Requirements

1. **Authentication Initialization**: Initialize Firebase Authentication in `bspc-be4f8`.
2. **Administrator Sign-In**: Enable **Email/Password** authentication provider for admin accounts (`admin_<uid>`).
3. **Custom Tokens**: Custom token authentication requires no console provider toggle. Client authenticates via `signInWithCustomToken()`.
4. **IAM Service Account Permissions**: Ensure the Cloud Functions service account has `Service Account Token Creator` (`roles/iam.serviceAccountTokenCreator`) permission in GCP Console to allow `admin.auth().createCustomToken()` blob signing.

---

## 2. App Check Configuration & Staging Progression

| Environment | Status | App Check Configuration | Enforcement Mode |
| :--- | :--- | :--- | :--- |
| **Local / Emulator** | **Implemented** | `ENFORCE_APP_CHECK=false` | Disabled |
| **Staging** | **Planned** | Web Provider (reCAPTCHA v3 / Debug Token) | Monitoring Mode (Metrics observed) |
| **Production Target** | **Planned** | `enforceAppCheck: true` | Enforced (`reject` invalid requests) |

---

## 3. Environment Variable Boundaries

- Client `.env.local` files contains ONLY public configuration (`NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_CHAIN_ID=11155111`).
- Server environment variables (`functions/.env`) control backend thresholds (`REQUIRED_CONFIRMATIONS=6`, `INDEXER_START_BLOCK=5000000`, `ENFORCE_APP_CHECK`).
- No private key, database secret, or service account credential is ever committed or exposed via `NEXT_PUBLIC_`.
