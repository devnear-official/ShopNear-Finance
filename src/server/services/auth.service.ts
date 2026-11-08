import { connectDB } from '../db/connect';
import { User } from '../models/user.model';
import { Role } from '../models/role.model';
import { verifyPassword, hashPassword } from '../auth/password';
import { createSession, revokeSession, revokeAllUserSessions } from '../auth/session';
import { AuditService } from './audit.service';
import { ValidationError, UnauthorizedError, NotFoundError } from '../errors/app-error';
import { SignJWT, jwtVerify } from 'jose';

const RESET_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || 'shopnear_finance_super_secure_access_secret_key_2026_at_least_32_chars'
);

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export interface LoginParams {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
}

export class AuthService {
  /**
   * Authenticate a user with email and password
   */
  static async login(params: LoginParams) {
    await connectDB();

    const email = params.email.trim().toLowerCase();
    const user = await User.findOne({ email }).populate('roleId');

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60));
      throw new UnauthorizedError(
        `Account is temporarily locked due to too many failed attempts. Try again in ${waitMinutes} minute(s).`
      );
    }

    if (user.status !== 'active') {
      throw new UnauthorizedError('Your account has been suspended. Please contact your administrator.');
    }

    const isMatch = await verifyPassword(params.password, user.passwordHash);
    if (!isMatch) {
      user.failedLoginCount = (user.failedLoginCount || 0) + 1;
      if (user.failedLoginCount >= MAX_FAILED_ATTEMPTS) {
        const lockoutDate = new Date();
        lockoutDate.setMinutes(lockoutDate.getMinutes() + LOCKOUT_MINUTES);
        user.lockedUntil = lockoutDate;
      }
      await user.save();

      throw new UnauthorizedError(
        user.lockedUntil
          ? `Account locked due to 5 consecutive failed attempts. Locked for ${LOCKOUT_MINUTES} minutes.`
          : 'Invalid email or password'
      );
    }

    // Reset lockout counters on success
    user.failedLoginCount = 0;
    user.lockedUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    const roleDoc = user.roleId as unknown as { _id: { toString(): string }; key: string; name: string; permissions: string[] };

    const payload = {
      email: user.email,
      name: user.name,
      role: roleDoc.key,
      roleId: roleDoc._id.toString(),
      investorId: user.investorId ? user.investorId.toString() : null,
    };

    const sessionInfo = await createSession(user._id.toString(), payload, {
      ip: params.ip,
      userAgent: params.userAgent,
    });

    await AuditService.log({
      actorId: user._id.toString(),
      actorRole: roleDoc.key,
      action: 'AUTH_LOGIN',
      entityType: 'User',
      entityId: user._id.toString(),
      ip: params.ip,
      userAgent: params.userAgent,
      after: { email: user.email, lastLoginAt: user.lastLoginAt },
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: roleDoc.key,
        roleName: roleDoc.name,
        permissions: roleDoc.permissions || [],
        investorId: payload.investorId,
        avatar: user.avatar,
      },
      ...sessionInfo,
    };
  }

  /**
   * Log out and revoke active session
   */
  static async logout(sessionId?: string, userId?: string) {
    if (sessionId) {
      await revokeSession(sessionId);
    }
    if (userId) {
      await AuditService.log({
        actorId: userId,
        action: 'AUTH_LOGOUT',
        entityType: 'Session',
        entityId: sessionId,
      });
    }
  }

  /**
   * Request password reset token
   */
  static async requestPasswordReset(email: string) {
    await connectDB();
    const user = await User.findOne({ email: email.trim().toLowerCase(), status: 'active' });

    if (!user) {
      // Return safe message without exposing whether user exists
      return { message: 'If this email is registered, a password reset link has been generated.' };
    }

    // 1-hour signed single-use token
    const token = await new SignJWT({ sub: user._id.toString(), email: user.email, type: 'pwd_reset' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(RESET_SECRET);

    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    console.log('\n========================================');
    console.log(`[PASSWORD RESET LINK for ${user.email}]:`);
    console.log(resetUrl);
    console.log('========================================\n');

    return { message: 'Password reset link has been dispatched.', resetUrl };
  }

  /**
   * Reset password with valid token
   */
  static async resetPassword(token: string, newPassword: string) {
    await connectDB();

    let payload: { sub?: string; type?: string };
    try {
      const verified = await jwtVerify(token, RESET_SECRET);
      payload = verified.payload as { sub?: string; type?: string };
    } catch {
      throw new ValidationError('Invalid or expired password reset link.');
    }

    if (!payload.sub || payload.type !== 'pwd_reset') {
      throw new ValidationError('Invalid reset token.');
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    user.passwordHash = await hashPassword(newPassword);
    user.failedLoginCount = 0;
    user.lockedUntil = undefined;
    await user.save();

    // Revoke all sessions on password change
    await revokeAllUserSessions(user._id.toString());

    await AuditService.log({
      actorId: user._id.toString(),
      action: 'AUTH_PASSWORD_RESET',
      entityType: 'User',
      entityId: user._id.toString(),
    });

    return { success: true, message: 'Password has been reset successfully. Please log in with your new password.' };
  }
}
