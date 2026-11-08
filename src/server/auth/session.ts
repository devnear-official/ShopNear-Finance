import crypto from 'crypto';
import { cookies } from 'next/headers';
import { Session } from '../models/session.model';
import { connectDB } from '../db/connect';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_EXPIRY_DAYS,
  JWTPayloadData,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './jwt';

export * from './jwt';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new user session with rotating refresh token and store in DB
 */
export async function createSession(
  userId: string,
  userPayload: Omit<JWTPayloadData, 'sub' | 'sessionId'>,
  meta?: { ip?: string; userAgent?: string }
): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
  await connectDB();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  // Generate temporary random token for DB record creation
  const tempToken = crypto.randomBytes(32).toString('hex');
  const sessionDoc = await Session.create({
    userId,
    refreshTokenHash: hashToken(tempToken),
    ip: meta?.ip || '',
    userAgent: meta?.userAgent || '',
    expiresAt,
  });

  const sessionId = sessionDoc._id.toString();

  // Create JWTs
  const accessToken = await signAccessToken({
    ...userPayload,
    sub: userId,
    sessionId,
  } as JWTPayloadData);

  const refreshToken = await signRefreshToken({
    sub: userId,
    sessionId,
  });

  // Store hashed real refresh token
  sessionDoc.refreshTokenHash = hashToken(refreshToken);
  await sessionDoc.save();

  return { accessToken, refreshToken, sessionId };
}

/**
 * Rotate refresh token: verify existing refresh token, verify DB session, issue new tokens
 */
export async function rotateSession(
  refreshToken: string,
  userPayload: Omit<JWTPayloadData, 'sub' | 'sessionId'>
): Promise<{ accessToken: string; refreshToken: string } | null> {
  await connectDB();

  const decoded = await verifyRefreshToken(refreshToken);
  if (!decoded) return null;

  const hashed = hashToken(refreshToken);
  const session = await Session.findOne({
    _id: decoded.sessionId,
    userId: decoded.sub,
    refreshTokenHash: hashed,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });

  if (!session) return null;

  // Generate new refresh token and access token
  const newRefreshToken = await signRefreshToken({
    sub: decoded.sub,
    sessionId: session._id.toString(),
  });

  const newAccessToken = await signAccessToken({
    ...userPayload,
    sub: decoded.sub,
    sessionId: session._id.toString(),
  } as JWTPayloadData);

  // Update session record with new hash and refreshed expiration
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  session.refreshTokenHash = hashToken(newRefreshToken);
  session.expiresAt = newExpiresAt;
  await session.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string): Promise<void> {
  await connectDB();
  await Session.findByIdAndUpdate(sessionId, { revokedAt: new Date() });
}

/**
 * Revoke all sessions for a user (e.g., password reset or "logout from all devices")
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await connectDB();
  await Session.updateMany({ userId, revokedAt: { $exists: false } }, { revokedAt: new Date() });
}

/**
 * Helper to set auth cookies in Next.js Server Actions or Route Handlers
 */
export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60, // 15 mins
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60, // 7 days
  });
}

/**
 * Helper to clear auth cookies on logout
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}
