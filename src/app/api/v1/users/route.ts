import { NextRequest } from 'next/server';
import { requirePermission, getCurrentUser } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { User } from '@/server/models/user.model';
import { Role } from '@/server/models/role.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { hashPassword } from '@/server/auth/password';
import { AuditService } from '@/server/services/audit.service';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleKey: z.string().min(1, 'Role is required'),
});

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.USERS_VIEW);
    await connectDB();

    const users = await User.find()
      .populate('roleId', 'name key permissions')
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(users);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.USERS_CREATE);
    const currentUser = await getCurrentUser();
    await connectDB();

    const json = await req.json();
    const data = createUserSchema.parse(json);

    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      return ApiResponse.error('A user with this email already exists', 409, 'CONFLICT');
    }

    const role = await Role.findOne({ key: data.roleKey });
    if (!role) {
      return ApiResponse.error('Invalid role selected', 400, 'BAD_REQUEST');
    }

    const passwordHash = await hashPassword(data.password);
    const newUser = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || '',
      passwordHash,
      roleId: role._id,
      status: 'active',
    });

    await AuditService.log({
      actorId: currentUser?.id,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: newUser._id.toString(),
      after: { name: newUser.name, email: newUser.email, role: role.key },
    });

    const populated = await User.findById(newUser._id)
      .populate('roleId', 'name key')
      .select('-passwordHash')
      .lean();

    return ApiResponse.created(populated, 'User created successfully');
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
