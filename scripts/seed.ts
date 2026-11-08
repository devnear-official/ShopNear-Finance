import mongoose from 'mongoose';
import { connectDB } from '../src/server/db/connect';
import { Role } from '../src/server/models/role.model';
import { User } from '../src/server/models/user.model';
import { FinancialAccount } from '../src/server/models/financial-account.model';
import { Investor } from '../src/server/models/investor.model';
import { DEFAULT_ROLES } from '../src/server/auth/permissions';
import { hashPassword } from '../src/server/auth/password';
import { seedChartOfAccounts } from '../src/server/db/seed-coa';
import { AccountService } from '../src/server/services/account.service';
import { InvestorService } from '../src/server/services/investor.service';
import { toPaisa } from '../src/lib/money';

async function seed() {
  console.log('🌱 Starting ShopNear Finance comprehensive seed (Phases 1 - 4)...');
  await connectDB();

  // 1. Seed Roles & Permissions
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
      { upsert: true, returnDocument: 'after' }
    );
    roleDocs[key] = role._id;
  }

  // 2. Seed Chart of Accounts
  console.log('📚 Seeding official Chart of Accounts...');
  await seedChartOfAccounts();

  // 3. Seed Users
  console.log('👤 Seeding demo users...');
  const defaultPassword = 'ShopNear#2026!';
  const passwordHash = await hashPassword(defaultPassword);

  const usersToSeed = [
    { name: 'Business Owner', email: 'owner@shopnear.test', phone: '+8801700000001', roleKey: 'owner' },
    { name: 'Super Admin', email: 'superadmin@shopnear.test', phone: '+8801700000002', roleKey: 'super_admin' },
    { name: 'Business Admin', email: 'admin@shopnear.test', phone: '+8801700000003', roleKey: 'admin' },
    { name: 'Chief Accountant', email: 'accountant@shopnear.test', phone: '+8801700000004', roleKey: 'accountant' },
    { name: 'Store Manager', email: 'manager@shopnear.test', phone: '+8801700000005', roleKey: 'manager' },
    { name: 'Tariqul Islam (Investor)', email: 'investor@shopnear.test', phone: '+8801700000006', roleKey: 'investor' },
  ];

  const userDocs: Record<string, any> = {};
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
      { upsert: true, returnDocument: 'after' }
    );
    userDocs[u.roleKey] = user;
  }

  // 4. Seed Financial Accounts (Cash, Bank, bKash)
  console.log('🏦 Seeding financial accounts & opening balances...');
  let cashAcc: any = await FinancialAccount.findOne({ type: 'cash' });
  if (!cashAcc) {
    cashAcc = await AccountService.createAccount({
      name: 'Cash in Hand (Main Till)',
      type: 'cash',
      openingBalance: toPaisa(50000), // ৳50,000 opening
      userId: userDocs.owner._id.toString(),
    });
  }

  let bankAcc: any = await FinancialAccount.findOne({ type: 'bank' });
  if (!bankAcc) {
    bankAcc = await AccountService.createAccount({
      name: 'City Bank Ltd. Current',
      type: 'bank',
      bankName: 'City Bank Ltd.',
      accountNumber: '1502448201001',
      branchName: 'Gulshan Branch',
      openingBalance: toPaisa(250000), // ৳2,50,000 opening
      userId: userDocs.owner._id.toString(),
    });
  }

  let bkashAcc: any = await FinancialAccount.findOne({ type: 'mobile_banking' });
  if (!bkashAcc) {
    bkashAcc = await AccountService.createAccount({
      name: 'bKash Merchant Wallet',
      type: 'mobile_banking',
      provider: 'bKash',
      accountNumber: '01711223344',
      openingBalance: toPaisa(35000), // ৳35,000 opening
      userId: userDocs.owner._id.toString(),
    });
  }

  // 5. Seed Investors & Capital Movements
  console.log('🤝 Seeding investors & capital ledger...');
  let investor1: any = await Investor.findOne({ phone: '+8801700000006' });
  if (!investor1) {
    investor1 = await InvestorService.createInvestor({
      fullName: 'Tariqul Islam',
      phone: '+8801700000006',
      email: 'investor@shopnear.test',
      investmentType: 'equity',
      profitSharePercentage: 20,
      notes: 'Founding investor with 20% equity profit share agreement.',
      userId: userDocs.owner._id.toString(),
    });

    if (investor1 && bankAcc) {
      // Link investor user to investor profile
      await User.findByIdAndUpdate(userDocs.investor._id, { investorId: investor1._id });

      // Record Initial Investment of ৳5,00,000 into Bank
      await InvestorService.recordInvestment({
        investorId: investor1._id.toString(),
        amount: toPaisa(500000),
        financialAccountId: bankAcc._id.toString(),
        notes: 'Initial capital contribution via Cheque #98210',
        userId: userDocs.owner._id.toString(),
      });

      // Record Partial Withdrawal of ৳50,000
      await InvestorService.recordWithdrawal({
        investorId: investor1._id.toString(),
        amount: toPaisa(50000),
        financialAccountId: bankAcc._id.toString(),
        notes: 'Quarterly capital withdrawal payout',
        userId: userDocs.owner._id.toString(),
      });
    }
  }

  console.log('\n======================================================');
  console.log('✅ Phases 1 - 4 Seed Completed Successfully!');
  console.log('======================================================');
  console.log('Demo Credentials:');
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
