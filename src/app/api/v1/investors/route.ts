import { NextRequest } from 'next/server';
import { InvestorService } from '@/server/services/investor.service';
import { Investor } from '@/server/models/investor.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { requireAuth, requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { withTransaction } from '@/server/db/withTransaction';
import { z } from 'zod';

const createInvestorSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(6, 'Valid phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  nidRef: z.string().optional(),
  investmentType: z.enum(['equity', 'fixed_return', 'profit_share']).default('equity'),
  profitSharePercentage: z.number().min(0).max(100).default(0),
  lossBearing: z.boolean().default(true),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    // If investor user, restrict to own profile only
    if (user.role === 'investor') {
      if (!user.investorId) {
        return ApiResponse.success([]);
      }
      const own = await Investor.findById(user.investorId).lean();
      if (!own) return ApiResponse.success([]);
      const capital = await InvestorService.getInvestorCapitalBalance(own._id.toString());
      return ApiResponse.success([{ ...own, currentCapital: capital }]);
    }

    await requirePermission(PERMISSIONS.INVESTORS_VIEW_ALL);

    const investors = await Investor.find().sort({ createdAt: -1 }).lean();
    const enriched = await Promise.all(
      investors.map(async (inv) => {
        const capital = await InvestorService.getInvestorCapitalBalance(inv._id.toString());
        return {
          ...inv,
          currentCapital: capital,
        };
      })
    );

    return ApiResponse.success(enriched);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.INVESTORS_CREATE);
    const body = await req.json();
    const validated = createInvestorSchema.parse(body);

    const investor = await withTransaction(async (session) => {
      return await InvestorService.createInvestor(
        {
          ...validated,
          userId: user.id,
        },
        session
      );
    });

    return ApiResponse.created(investor, `Investor ${investor.fullName} (${investor.investorCode}) registered successfully.`);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
