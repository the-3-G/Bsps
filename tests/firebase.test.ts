import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateFirebaseConfig } from '../packages/firebase/src/index';

describe('Firebase Environment Variable Validation', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('validates and returns config when all required variables are set', () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'AIzaTestKey';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'bspc-be4f8';
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'bspc-be4f8.firebasestorage.app';
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '133746398244';
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:133746398244:web:03c0b077d035a470b0f4b1';

    const config = validateFirebaseConfig();
    expect(config.projectId).toBe('bspc-be4f8');
    expect(config.apiKey).toBe('AIzaTestKey');
    expect(config.authDomain).toBe('test.firebaseapp.com');
  });

  it('throws explicit error when required environment variables are missing', () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    expect(() => validateFirebaseConfig()).toThrow('CRITICAL FIREBASE CONFIGURATION ERROR');
  });
});
