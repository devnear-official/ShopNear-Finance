import mongoose, { ClientSession } from 'mongoose';
import { connectDB } from './connect';

export interface TransactionOptions {
  maxRetries?: number;
}

/**
 * Executes a callback within a MongoDB transaction.
 * Automatically retries on TransientTransactionError and UnknownTransactionCommitResult.
 * Falls back gracefully in development if replica set is not configured.
 */
export async function withTransaction<T>(
  fn: (session?: ClientSession) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  await connectDB();

  const maxRetries = options.maxRetries ?? 3;
  let session: ClientSession | null = null;

  try {
    session = await mongoose.startSession();
  } catch (err: unknown) {
    const error = err as Error;
    // If transactions are not supported (e.g. standalone Mongo without replica set)
    if (error.message?.includes('Transactions are not supported') || error.message?.includes('replica set')) {
      console.warn('[withTransaction] MongoDB replica set not detected. Running without transaction in standalone mode.');
      return await fn(undefined);
    }
    throw error;
  }

  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      let result: T;
      await session.withTransaction(async () => {
        result = await fn(session!);
      });
      return result!;
    } catch (err: unknown) {
      const error = err as { hasErrorLabel?: (label: string) => boolean; message?: string };
      const isTransient =
        typeof error.hasErrorLabel === 'function' &&
        (error.hasErrorLabel('TransientTransactionError') ||
          error.hasErrorLabel('UnknownTransactionCommitResult'));

      if (isTransient && attempt < maxRetries) {
        console.warn(`[withTransaction] Transient transaction error on attempt ${attempt}. Retrying...`);
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, attempt * 100));
        continue;
      }

      // If standalone Mongo error happens inside withTransaction
      if (error.message?.includes('Transactions are not supported') || error.message?.includes('replica set')) {
        console.warn('[withTransaction] Transactions not supported by current MongoDB server. Running without transaction.');
        return await fn(undefined);
      }

      throw err;
    } finally {
      if (attempt >= maxRetries && session) {
        await session.endSession();
      }
    }
  }

  if (session) {
    await session.endSession();
  }
  throw new Error('[withTransaction] Transaction failed after maximum retries.');
}
