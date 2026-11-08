import { NextRequest } from 'next/server';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { Role } from '@/server/models/role.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.USERS_VIEW);
    await connectDB();

    const roles = await Role.find().lean();
    return ApiResponse.success(roles);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
