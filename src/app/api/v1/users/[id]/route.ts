import { NextRequest } from 'next/server';
import { requirePermission, getCurrentUser } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { User } from '@/server/models/user.model';
import { Role } from '@/server/models/role.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { AuditService } from '@/server/services/audit.service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.USERS_EDIT);
    const currentUser = await getCurrentUser();
    const { id } = await params;
    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return ApiResponse.error('User not found', 404, 'NOT_FOUND');
    }

    const json = await req.json();
    const before = user.toObject();

    if (json.status && ['active', 'suspended'].includes(json.status)) {
      user.status = json.status;
    }

    if (json.roleKey) {
      const role = await Role.findOne({ key: json.roleKey });
      if (role) {
        user.roleId = role._id;
      }
    }

    if (json.name) user.name = json.name;
    if (json.phone !== undefined) user.phone = json.phone;

    await user.save();

    await AuditService.log({
      actorId: currentUser?.id,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: user._id.toString(),
      before: before as any,
      after: user.toObject() as any,
    });

    const updated = await User.findById(id)
      .populate('roleId', 'name key permissions')
      .select('-passwordHash')
      .lean();

    return ApiResponse.success(updated, 'User updated successfully');
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
