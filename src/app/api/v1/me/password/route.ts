import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/server/auth/guards';
import { User } from '@/server/models/user.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { verifyPassword, hashPassword } from '@/server/auth/password';
import { AuditService } from '@/server/services/audit.service';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return ApiResponse.error('Unauthorized', 401, 'UNAUTHORIZED');

    const json = await req.json();
    const data = changePasswordSchema.parse(json);

    await connectDB();
    const doc = await User.findById(user.id);
    if (!doc) return ApiResponse.error('User not found', 404, 'NOT_FOUND');

    const isValid = await verifyPassword(data.currentPassword, doc.passwordHash);
    if (!isValid) {
      return ApiResponse.error('Incorrect current password', 400, 'BAD_REQUEST');
    }

    doc.passwordHash = await hashPassword(data.newPassword);
    await doc.save();

    await AuditService.log({
      actorId: user.id,
      action: 'CHANGE_PASSWORD',
      entityType: 'User',
      entityId: user.id,
    });

    return ApiResponse.success(null, 'Password updated successfully');
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
