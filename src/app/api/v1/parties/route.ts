import { NextRequest } from 'next/server';
import { Party } from '@/server/models/party.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { requireAuth } from '@/server/auth/guards';
import { z } from 'zod';

const partySchema = z.object({
  name: z.string().min(2),
  type: z.enum(['customer', 'supplier']),
  phone: z.string().min(6),
  email: z.string().optional(),
  address: z.string().optional(),
  openingBalance: z.number().int().default(0),
});

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const filter: Record<string, unknown> = {};
    if (type) filter.type = type;

    let parties = await Party.find(filter).sort({ name: 1 }).lean();

    // Auto-seed sample customer & supplier if empty
    if (parties.length === 0) {
      await Party.insertMany([
        { name: 'Apex Retail Stores', type: 'customer', phone: '+8801711000111', address: 'Dhaka', openingBalance: 0, status: 'active' },
        { name: 'Bengal Fabrics Ltd.', type: 'supplier', phone: '+8801811000222', address: 'Narayanganj', openingBalance: 0, status: 'active' },
      ]);
      parties = await Party.find(filter).sort({ name: 1 }).lean();
    }

    return ApiResponse.success(parties);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    await connectDB();
    const body = await req.json();
    const validated = partySchema.parse(body);

    const party = await Party.create(validated);
    return ApiResponse.created(party, `${validated.type === 'customer' ? 'Customer' : 'Supplier'} created.`);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
