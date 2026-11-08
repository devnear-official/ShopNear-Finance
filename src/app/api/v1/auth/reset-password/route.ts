import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ApiResponse } from '@/server/utils/api-response';
import { resetPasswordSchema } from '@/features/auth/schemas';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const validated = resetPasswordSchema.parse(json);

    const result = await AuthService.resetPassword(validated.token, validated.password);
    return ApiResponse.success(result, result.message);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
