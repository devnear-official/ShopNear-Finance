import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ApiResponse } from '@/server/utils/api-response';
import { loginSchema } from '@/features/auth/schemas';
import { setAuthCookies } from '@/server/auth/session';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const validated = loginSchema.parse(json);

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';

    const result = await AuthService.login({
      email: validated.email,
      password: validated.password,
      ip,
      userAgent,
    });

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
