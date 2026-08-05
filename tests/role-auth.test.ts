import { describe, it, expect } from 'vitest';

/**
 * Role Authorization Logic Tests
 *
 * These tests exercise the role-checking logic used in Cloud Functions
 * without requiring a running Firebase emulator. We extract and test
 * the pure logic of the verifyRole helper in isolation.
 */

// Mirror of the verifyRole logic from functions/src/index.ts
// extracted for pure unit testing
type MockCallableContext = {
  auth?: {
    uid: string;
    token: { role?: string };
  };
};

function verifyRole(context: MockCallableContext, allowedRoles: string[]): string {
  if (!context.auth) {
    throw Object.assign(new Error('User must be authenticated.'), { code: 'unauthenticated' });
  }
  const role = context.auth.token.role;
  if (!role || !allowedRoles.includes(role)) {
    throw Object.assign(new Error('Unauthorized role.'), { code: 'permission-denied' });
  }
  return context.auth.uid;
}

// ─── Authentication Guard ────────────────────────────────────────────────────

describe('verifyRole — authentication guard', () => {
  it('throws unauthenticated when context.auth is missing', () => {
    const ctx: MockCallableContext = {};
    expect(() => verifyRole(ctx, ['super_admin'])).toThrow('User must be authenticated.');
  });

  it('returns the uid for a matching role', () => {
    const ctx: MockCallableContext = {
      auth: { uid: 'admin-001', token: { role: 'super_admin' } },
    };
    expect(verifyRole(ctx, ['super_admin', 'finance_reviewer'])).toBe('admin-001');
  });
});

// ─── Role Permission Matrix ──────────────────────────────────────────────────

describe('verifyRole — role permission matrix', () => {
  const makeCtx = (role: string): MockCallableContext => ({
    auth: { uid: 'test-uid', token: { role } },
  });

  // updateUserStatus: allowed roles
  const updateUserStatusRoles = ['super_admin', 'operations_admin'];
  const updateUserStatusBlockedRoles = ['finance_reviewer', 'support', 'auditor', 'read_only'];

  it.each(updateUserStatusRoles)('%s CAN call updateUserStatus', (role) => {
    expect(() => verifyRole(makeCtx(role), updateUserStatusRoles)).not.toThrow();
  });

  it.each(updateUserStatusBlockedRoles)('%s is BLOCKED from updateUserStatus', (role) => {
    expect(() => verifyRole(makeCtx(role), updateUserStatusRoles)).toThrow('Unauthorized role.');
  });

  // reviewWithdrawal: allowed roles
  const reviewWithdrawalRoles = ['super_admin', 'finance_reviewer'];
  const reviewWithdrawalBlocked = ['operations_admin', 'support', 'auditor', 'read_only'];

  it.each(reviewWithdrawalRoles)('%s CAN call reviewWithdrawal', (role) => {
    expect(() => verifyRole(makeCtx(role), reviewWithdrawalRoles)).not.toThrow();
  });

  it.each(reviewWithdrawalBlocked)('%s is BLOCKED from reviewWithdrawal', (role) => {
    expect(() => verifyRole(makeCtx(role), reviewWithdrawalRoles)).toThrow('Unauthorized role.');
  });

  // assignAdminRole: super_admin only
  it('super_admin CAN call assignAdminRole', () => {
    expect(() => verifyRole(makeCtx('super_admin'), ['super_admin'])).not.toThrow();
  });

  it.each(['operations_admin', 'finance_reviewer', 'support', 'auditor', 'read_only'])(
    '%s is BLOCKED from assignAdminRole',
    (role) => {
      expect(() => verifyRole(makeCtx(role), ['super_admin'])).toThrow('Unauthorized role.');
    }
  );

  it('throws permission-denied when role claim is missing', () => {
    const ctx: MockCallableContext = {
      auth: { uid: 'test-uid', token: {} },
    };
    expect(() => verifyRole(ctx, ['super_admin'])).toThrow('Unauthorized role.');
  });
});
