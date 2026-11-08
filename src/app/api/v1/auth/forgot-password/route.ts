import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ApiResponse } from '@/server/utils/api-response';
import { forgotPasswordSchema } from '@/features/auth/schemas';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const validated = forgotPasswordSchema.parse(json);

    const result = await AuthService.requestPasswordReset(validated.email);
    return ApiResponse.success(result, result.message);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
