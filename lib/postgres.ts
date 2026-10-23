import type { PoolConfig } from "pg";

/** Bound network handshakes, pool waits and queries so SSR can reach an error boundary. */
export function databaseConfig(
  connectionString = process.env.DATABASE_URL,
): PoolConfig {
  return {
    connectionString,
    connectionTimeoutMillis: 5_000,
    query_timeout: 10_000,
    statement_timeout: 10_000,
    idleTimeoutMillis: 30_000,
    max: 10,
    keepAlive: true,
  };
}
