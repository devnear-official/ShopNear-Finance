import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ApiResponse } from '@/server/utils/api-response';
import { loginSchema } from '@/features/auth/schemas';
import { setAuthCookies } from '@/server/auth/session';
import { rateLimiter, getClientIp, createRateLimitResponse } from '@/server/security/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const validated = loginSchema.parse(json);

    const ip = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || '';

    // Rate limit: 5 attempts per 15 minutes per IP + email
    const loginKey = `login:${ip}:${validated.email.toLowerCase()}`;
    const rlCheck = rateLimiter.check(loginKey, 5, 15 * 60 * 1000);

    if (!rlCheck.allowed) {
      return createRateLimitResponse(
        `Too many login attempts. Please try again in ${Math.ceil(rlCheck.retryAfterSec / 60)} minute(s).`,
        5,
        rlCheck.resetTime,
        rlCheck.retryAfterSec
      );
    }

    const result = await AuthService.login({
      email: validated.email,
      password: validated.password,
      ip,
      userAgent,
    });

    // Reset rate limiter on successful authentication
    rateLimiter.reset(loginKey);

    await setAuthCookies(result.accessToken, result.refreshToken);

    return ApiResponse.success(
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      'Logged in successfully'
    );
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
