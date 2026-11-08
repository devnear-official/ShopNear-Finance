import { describe, it, expect } from 'vitest';
import { ApiResponse } from '@/server/utils/api-response';
import { ValidationError, ForbiddenError } from '@/server/errors/app-error';
import { z } from 'zod';

describe('server/utils/api-response envelope', () => {
  it('formats success response with envelope structure', async () => {
    const res = ApiResponse.success({ id: 1, name: 'ShopNear' }, 'Fetched successfully', {
      page: 1,
      limit: 20,
      total: 100,
    });

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe('Fetched successfully');
    expect(json.data).toEqual({ id: 1, name: 'ShopNear' });
    expect(json.meta).toEqual({ page: 1, limit: 20, total: 100 });
  });

  it('handles AppError properly with custom status code and code enum', async () => {
    const forbidden = new ForbiddenError('Access Denied');
    const res = ApiResponse.handle(forbidden);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.code).toBe('FORBIDDEN');
    expect(json.message).toBe('Access Denied');
  });

  it('handles ZodError properly by returning field-level errors', async () => {
    const testSchema = z.object({
      amount: z.number().positive('Must be greater than 0'),
      name: z.string().min(3, 'At least 3 characters'),
    });

    const parsed = testSchema.safeParse({ amount: -10, name: 'a' });
    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      const res = ApiResponse.handle(parsed.error);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.code).toBe('VALIDATION_ERROR');
      expect(json.errors?.amount).toBeDefined();
      expect(json.errors?.name).toBeDefined();
    }
  });
});
