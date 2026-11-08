import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 10) {
    return { valid: false, message: 'Password must be at least 10 characters long' };
  }
  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  const check = validatePasswordStrength(password);
  if (!check.valid) {
    throw new Error(check.message);
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
