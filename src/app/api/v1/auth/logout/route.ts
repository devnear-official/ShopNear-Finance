import { AuthService } from '@/server/services/auth.service';
import { ApiResponse } from '@/server/utils/api-response';
import { clearAuthCookies } from '@/server/auth/session';
import { getCurrentUser } from '@/server/auth/guards';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user?.sessionId) {
      await AuthService.logout(user.sessionId, user.id);
    }
    await clearAuthCookies();
    return ApiResponse.success({ loggedOut: true }, 'Logged out successfully');
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
