import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';

// Declare window augmentation for emulator connection guard
declare global {
  interface Window {
    __FIREBASE_EMULATORS_CONNECTED__?: boolean;
  }
}

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const REQUIRED_CLIENT_ENV_VARS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

/**
 * Validates required Firebase client environment variables.
 * Throws an explicit development error listing all missing keys if any are unconfigured.
 */
export function validateFirebaseConfig(): FirebaseClientConfig {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  const missing: string[] = [];
  if (!apiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!authDomain) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!storageBucket) missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!messagingSenderId) missing.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!appId) missing.push('NEXT_PUBLIC_FIREBASE_APP_ID');

  if (missing.length > 0) {
    throw new Error(
      `CRITICAL FIREBASE CONFIGURATION ERROR: Missing required environment variables: ${missing.join(', ')}. ` +
      'Please ensure all NEXT_PUBLIC_FIREBASE_* environment variables are set in your .env.local file.'
    );
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedFirestore: Firestore | null = null;
let cachedFunctions: Functions | null = null;

/**
 * Initializes or returns the singleton FirebaseApp instance.
 * Protects against duplicate initializations using getApps().
 */
export function getFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;

  if (getApps().length > 0) {
    cachedApp = getApp();
    return cachedApp;
  }

  const config = validateFirebaseConfig();
  cachedApp = initializeApp(config);
  return cachedApp;
}

/**
 * Connects Firebase Client SDKs to local emulator suite if configured.
 * Safely executes ONLY in browser context and ONLY ONCE per browser session.
 */
function setupEmulators(auth: Auth, db: Firestore, functions: Functions) {
  if (typeof window === 'undefined') return;
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS !== 'true') return;
  if (window.__FIREBASE_EMULATORS_CONNECTED__) return;

  window.__FIREBASE_EMULATORS_CONNECTED__ = true;

  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  } catch (err) {
    console.warn('[Firebase] Emulator connection warning:', err);
  }
}

/**
 * Returns singleton Auth instance with optional emulator connection.
 */
export function getFirebaseAuth(): Auth {
  if (!cachedAuth) {
    const app = getFirebaseApp();
    cachedAuth = getAuth(app);
    setupEmulators(cachedAuth, getFirebaseFirestore(), getFirebaseFunctions());
  }
  return cachedAuth;
}

/**
 * Returns singleton Firestore instance with optional emulator connection.
 */
export function getFirebaseFirestore(): Firestore {
  if (!cachedFirestore) {
    const app = getFirebaseApp();
    cachedFirestore = getFirestore(app);
  }
  return cachedFirestore;
}

/**
 * Returns singleton Functions instance with optional emulator connection.
 */
export function getFirebaseFunctions(): Functions {
  if (!cachedFunctions) {
    const app = getFirebaseApp();
    cachedFunctions = getFunctions(app);
  }
  return cachedFunctions;
}

/**
 * Legacy schema mapping helper preserved for backwards compatibility.
 */
export const firebaseConfigSchema = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Shared Firestore data converter helper.
 */
export function getFirestoreConverter<T extends object>(): FirestoreDataConverter<T> {
  return {
    toFirestore(modelObject: T): DocumentData {
      return modelObject as DocumentData;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      const data = snapshot.data();
      return {
        id: snapshot.id,
        ...data,
      } as unknown as T;
    },
  };
}
