import { SignJWT, jwtVerify } from 'jose';

export const ACCESS_TOKEN_COOKIE = 'sn_access_token';
export const REFRESH_TOKEN_COOKIE = 'sn_refresh_token';

export const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
export const REFRESH_TOKEN_EXPIRY_DAYS = 7; // 7 days

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || 'shopnear_finance_super_secure_access_secret_key_2026_at_least_32_chars'
);

const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'shopnear_finance_super_secure_refresh_secret_key_2026_at_least_32_chars'
);

export interface JWTPayloadData {
  sub: string;
  email: string;
  name: string;
  role: string;
  roleId: string;
  investorId?: string | null;
  sessionId?: string;
  [key: string]: unknown;
}

export async function signAccessToken(payload: JWTPayloadData): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(payload: { sub: string; sessionId: string }): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_EXPIRY_DAYS}d`)
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JWTPayloadData | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload as unknown as JWTPayloadData;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string; sessionId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload as unknown as { sub: string; sessionId: string };
  } catch {
    return null;
  }
}
