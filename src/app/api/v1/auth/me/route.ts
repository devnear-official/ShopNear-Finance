import { ApiResponse } from '@/server/utils/api-response';
import { requireAuth } from '@/server/auth/guards';

export async function GET() {
  try {
    const user = await requireAuth();
    return ApiResponse.success({ user });
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
