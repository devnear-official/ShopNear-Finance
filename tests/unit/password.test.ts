import { describe, it, expect } from 'vitest';
import { validatePasswordStrength, hashPassword, verifyPassword } from '@/server/auth/password';

describe('server/auth/password', () => {
  it('validates password length correctly (min 10 chars)', () => {
    expect(validatePasswordStrength('short').valid).toBe(false);
    expect(validatePasswordStrength('123456789').valid).toBe(false);
    expect(validatePasswordStrength('1234567890').valid).toBe(true);
    expect(validatePasswordStrength('ShopNear#2026!').valid).toBe(true);
  });

  it('hashes and verifies passwords correctly with bcrypt', async () => {
    const raw = 'ShopNear#2026!';
    const hash = await hashPassword(raw);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(raw);

    const matches = await verifyPassword(raw, hash);
    expect(matches).toBe(true);

    const wrong = await verifyPassword('WrongPassword123!', hash);
    expect(wrong).toBe(false);
  });
});
