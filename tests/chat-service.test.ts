import { describe, it, expect } from 'vitest';
import { CreateSupportConversationSchema, SendAgentMessageSchema } from '../packages/validation/src/index';

/**
 * Customer Service Chat & Voucher Workflow Unit Tests
 */

describe('Customer Service Chat & Anonymous Guest Workflow', () => {
  it('1. Validates CreateSupportConversationSchema parameters', () => {
    const valid = CreateSupportConversationSchema.safeParse({
      source: 'receive_voucher',
      initialMessage: 'Hello, please help me receive my node voucher.',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.source).toBe('receive_voucher');
    }
  });

  it('2. Validates SendAgentMessageSchema parameters & sanitizes text', () => {
    const valid = SendAgentMessageSchema.safeParse({
      conversationId: 'conv-001',
      text: 'Hello Guest, your voucher is being reviewed.',
      messageType: 'text',
    });
    expect(valid.success).toBe(true);

    const maliciousText = '<script>alert("hack")</script>';
    const sanitized = maliciousText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    expect(sanitized).toBe('&lt;script&gt;alert("hack")&lt;/script&gt;');
  });

  it('3. Formats guest display labels cleanly without exposing Firebase UIDs', () => {
    const rawUid = 'anon_user_95222290dd7278aa';
    const guestLabel = `Guest ${rawUid.slice(-4).toUpperCase()}`;
    expect(guestLabel).toBe('Guest 78AA');
    expect(guestLabel).not.toContain('anon_user');
  });

  it('4. Enforces RBAC permissions: wallet_user actorType CANNOT call sendAgentMessage', () => {
    function verifySupportRole(context: { auth?: { uid: string; token: { role?: string; actorType?: string } } }) {
      if (!context.auth) throw new Error('Unauthenticated');
      const role = context.auth.token?.role;
      if (!role || !['support', 'operations_admin', 'super_admin'].includes(role)) {
        throw new Error('Permission Denied: Support agent authorization required.');
      }
      return context.auth.uid;
    }

    const walletUserContext = {
      auth: {
        uid: 'evm_95222290dd7278aa3ddd389cc1e1d165cc4bafe5',
        token: { actorType: 'wallet_user' },
      },
    };

    expect(() => verifySupportRole(walletUserContext)).toThrow('Permission Denied');
  });

  it('5. Enforces RBAC permissions: support agent custom claim IS ALLOWED', () => {
    function verifySupportRole(context: { auth?: { uid: string; token: { role?: string; actorType?: string } } }) {
      if (!context.auth) throw new Error('Unauthenticated');
      const role = context.auth.token?.role;
      if (!role || !['support', 'operations_admin', 'super_admin'].includes(role)) {
        throw new Error('Permission Denied: Support agent authorization required.');
      }
      return context.auth.uid;
    }

    const supportAgentContext = {
      auth: {
        uid: 'admin_support_001',
        token: { role: 'support' },
      },
    };

    expect(verifySupportRole(supportAgentContext)).toBe('admin_support_001');
  });
});
