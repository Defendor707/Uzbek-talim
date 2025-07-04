import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced pool configuration with advanced optimization
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Increased pool size for better concurrency
  min: 2,  // Minimum connections to keep alive
  idleTimeoutMillis: 30000, // Reduced idle timeout
  connectionTimeoutMillis: 8000,
  maxUses: 10000, // Increased connection reuse
  allowExitOnIdle: false,
  statement_timeout: 30000, // 30 second query timeout
  query_timeout: 25000,     // 25 second query timeout
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Handle pool errors with retry logic instead of exit
pool.on('error', (err) => {
  console.error('Database pool error (non-fatal):', err.message);
  // Don't exit the process, let the pool handle reconnection
});

export const db = drizzle({ client: pool, schema });

// Database health check function
export async function checkDatabaseHealth() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
