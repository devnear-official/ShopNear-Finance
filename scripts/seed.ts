import mongoose from 'mongoose';
import { connectDB } from '../src/server/db/connect';
import { Role } from '../src/server/models/role.model';
import { User } from '../src/server/models/user.model';
import { DEFAULT_ROLES } from '../src/server/auth/permissions';
import { hashPassword } from '../src/server/auth/password';

async function seed() {
  console.log('🌱 Starting ShopNear Finance seed (Phase 1)...');
  await connectDB();

  // 1. Seed Roles
  console.log('📦 Seeding system roles & permissions...');
  const roleDocs: Record<string, mongoose.Types.ObjectId> = {};

  for (const [key, def] of Object.entries(DEFAULT_ROLES)) {
    const role = await Role.findOneAndUpdate(
      { key },
      {
        name: def.name,
        key: def.key,
        description: def.description,
        permissions: def.permissions,
        isSystem: true,
      },
      { upsert: true, new: true }
    );
    roleDocs[key] = role._id;
    console.log(`  ✓ Role: ${def.name} (${key}) - ${def.permissions.length} permissions`);
  }

  // 2. Seed Default Users
  console.log('\n👤 Seeding demo users...');
  const defaultPassword = 'ShopNear#2026!';
  const passwordHash = await hashPassword(defaultPassword);

  const usersToSeed = [
    {
      name: 'Business Owner',
      email: 'owner@shopnear.test',
      phone: '+8801700000001',
      roleKey: 'owner',
    },
    {
      name: 'Super Admin',
      email: 'superadmin@shopnear.test',
      phone: '+8801700000002',
      roleKey: 'super_admin',
    },
    {
      name: 'Business Admin',
      email: 'admin@shopnear.test',
      phone: '+8801700000003',
      roleKey: 'admin',
    },
    {
      name: 'Chief Accountant',
      email: 'accountant@shopnear.test',
      phone: '+8801700000004',
      roleKey: 'accountant',
    },
    {
      name: 'Store Manager',
      email: 'manager@shopnear.test',
      phone: '+8801700000005',
      roleKey: 'manager',
    },
    {
      name: 'Tariqul Islam (Investor)',
      email: 'investor@shopnear.test',
      phone: '+8801700000006',
      roleKey: 'investor',
    },
  ];

  for (const u of usersToSeed) {
    const user = await User.findOneAndUpdate(
      { email: u.email },
      {
        name: u.name,
        email: u.email,
        phone: u.phone,
        passwordHash,
        roleId: roleDocs[u.roleKey],
        status: 'active',
      },
      { upsert: true, new: true }
    );
    console.log(`  ✓ User: ${user.name} <${user.email}> [${u.roleKey}]`);
  }

  console.log('\n======================================================');
  console.log('✅ Phase 1 Seed Completed Successfully!');
  console.log('======================================================');
  console.log('Demo Credentials for all seeded users:');
  console.log('  Password: ShopNear#2026!');
  console.log('  - Owner:      owner@shopnear.test');
  console.log('  - Admin:      admin@shopnear.test');
  console.log('  - Accountant: accountant@shopnear.test');
  console.log('  - Manager:    manager@shopnear.test');
  console.log('  - Investor:   investor@shopnear.test');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
