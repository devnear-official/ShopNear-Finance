import { cookies } from 'next/headers';
import {
  REFRESH_TOKEN_COOKIE,
  verifyRefreshToken,
  rotateSession,
  setAuthCookies,
  clearAuthCookies,
} from '@/server/auth/session';
import { ApiResponse } from '@/server/utils/api-response';
import { UnauthorizedError } from '@/server/errors/app-error';
import { User } from '@/server/models/user.model';
import { connectDB } from '@/server/db/connect';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token missing');
    }

    const decoded = await verifyRefreshToken(refreshToken);
    if (!decoded) {
      await clearAuthCookies();
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    await connectDB();
    const user = await User.findById(decoded.sub).populate('roleId').lean();
    if (!user || user.status !== 'active') {
      await clearAuthCookies();
      throw new UnauthorizedError('User account is invalid or suspended');
    }

    const role = user.roleId as unknown as { _id: { toString(): string }; key: string; permissions: string[] };
    const userPayload = {
      email: user.email,
      name: user.name,
      role: role.key,
      roleId: role._id.toString(),
      investorId: user.investorId ? user.investorId.toString() : null,
    };

    const tokens = await rotateSession(refreshToken, userPayload);
    if (!tokens) {
      await clearAuthCookies();
      throw new UnauthorizedError('Session revoked or expired');
    }

    await setAuthCookies(tokens.accessToken, tokens.refreshToken);

    return ApiResponse.success(
      { accessToken: tokens.accessToken },
      'Token refreshed successfully'
    );
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
