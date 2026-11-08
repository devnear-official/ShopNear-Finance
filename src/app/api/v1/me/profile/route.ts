import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/server/auth/guards';
import { User } from '@/server/models/user.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { AuditService } from '@/server/services/audit.service';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return ApiResponse.error('Unauthorized', 401, 'UNAUTHORIZED');

    await connectDB();
    const doc = await User.findById(user.id)
      .populate('roleId', 'name key permissions')
      .select('-passwordHash')
      .lean();

    return ApiResponse.success(doc);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return ApiResponse.error('Unauthorized', 401, 'UNAUTHORIZED');

    const json = await req.json();
    const data = updateProfileSchema.parse(json);

    await connectDB();
    const doc = await User.findById(user.id);
    if (!doc) return ApiResponse.error('User not found', 404, 'NOT_FOUND');

    const before = doc.toObject();
    if (data.name) doc.name = data.name;
    if (data.phone !== undefined) doc.phone = data.phone;

    await doc.save();

    await AuditService.log({
      actorId: user.id,
      action: 'UPDATE_OWN_PROFILE',
      entityType: 'User',
      entityId: user.id,
      before: before as any,
      after: doc.toObject() as any,
    });

    const updated = await User.findById(user.id)
      .populate('roleId', 'name key')
      .select('-passwordHash')
      .lean();

    return ApiResponse.success(updated, 'Profile updated successfully');
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
