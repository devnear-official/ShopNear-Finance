import dns from 'node:dns';
import mongoose from 'mongoose';
import '../models';

// Configure reliable DNS servers (Google + Cloudflare) to prevent Node.js querySrv ECONNREFUSED on MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

// Load .env automatically if running outside Next.js runtime (e.g. CLI scripts / seed)
try {
  process.loadEnvFile();
} catch {
  // Ignore in environments where .env is already loaded or not present
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopnear_finance';

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      dbName: 'shopnear_finance',
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
