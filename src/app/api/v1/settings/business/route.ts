import { NextRequest } from 'next/server';
import { requirePermission, getCurrentUser } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { SettingsService } from '@/server/services/settings.service';
import { ApiResponse } from '@/server/utils/api-response';

export async function GET() {
  try {
    const profile = await SettingsService.getBusinessProfile();
    return ApiResponse.success(profile);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.SETTINGS_MANAGE);
    const user = await getCurrentUser();
    if (!user) return ApiResponse.error('Unauthorized', 401, 'UNAUTHORIZED');

    const json = await req.json();
    const updated = await SettingsService.updateBusinessProfile(json, user.id);
    return ApiResponse.success(updated, 'Business profile updated successfully');
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
