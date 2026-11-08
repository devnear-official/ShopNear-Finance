import { cookies } from 'next/headers';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  verifyAccessToken,
  verifyRefreshToken,
  rotateSession,
  setAuthCookies,
  clearAuthCookies,
} from './session';
import { can, canAny, PermissionKey, UserAuthContext } from './permissions';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';
import { User } from '../models/user.model';
import { Role } from '../models/role.model';
import { connectDB } from '../db/connect';

export interface AuthenticatedUser extends UserAuthContext {
  name: string;
  email: string;
  roleId: string;
  sessionId?: string;
}

/**
 * Gets the current authenticated user from request cookies.
 * Automatically tries to refresh the access token if expired using the refresh token.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      // Fetch fresh permissions
      await connectDB();
      const role = await Role.findById(payload.roleId).lean();
      return {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        roleId: payload.roleId,
        permissions: role?.permissions || [],
        investorId: payload.investorId,
        sessionId: payload.sessionId,
      };
    }
  }

  // If access token is missing or expired, attempt refresh
  if (refreshToken) {
    const decodedRefresh = await verifyRefreshToken(refreshToken);
    if (decodedRefresh) {
      await connectDB();
      const user = await User.findById(decodedRefresh.sub).populate('roleId').lean();

      if (user && user.status === 'active') {
        const role = user.roleId as unknown as { _id: { toString(): string }; key: string; permissions: string[] };
        const userPayload = {
          email: user.email,
          name: user.name,
          role: role.key,
          roleId: role._id.toString(),
          investorId: user.investorId ? user.investorId.toString() : null,
        };

        const tokens = await rotateSession(refreshToken, userPayload);
        if (tokens) {
          await setAuthCookies(tokens.accessToken, tokens.refreshToken);
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: role.key,
            roleId: role._id.toString(),
            permissions: role.permissions || [],
            investorId: userPayload.investorId,
            sessionId: decodedRefresh.sessionId,
          };
        }
      }
    }
    // Refresh failed or revoked
    await clearAuthCookies();
  }

  return null;
}

/**
 * Enforces that a valid user session is present.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError('Please log in to continue.');
  }
  return user;
}

/**
 * Enforces that the user has a specific permission.
 */
export async function requirePermission(permission: PermissionKey | string): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (!can(user, permission)) {
    throw new ForbiddenError(`You do not have the required permission: "${permission}"`);
  }
  return user;
}

/**
 * Enforces that the user has ANY of the specified permissions.
 */
export async function requireAnyPermission(permissions: (PermissionKey | string)[]): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (!canAny(user, permissions)) {
    throw new ForbiddenError('You do not have permission to perform this action');
  }
  return user;
}
