import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// node-postgres works against any standard Postgres instance (local Docker,
// Neon, RDS, etc.) over a normal TCP connection — the right default for
// local development and for `db:migrate`/`seed`.
//
// NOTE: raw TCP sockets aren't available in the standard Cloudflare Workers
// runtime, so this driver will NOT work if you deploy `services/backend` to
// a Worker as-is. For that, either (a) put a Hyperdrive binding in front of
// this same Postgres instance (Hyperdrive gives Workers a TCP-over-HTTP
// tunnel and node-postgres works through it unchanged), or (b) swap this
// file back to a Workers-native HTTP driver (e.g. Neon's `neon-http`,
// pointed at an actual Neon database) if you're not using Hyperdrive.
export function createDb(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  return drizzle(pool, { schema });
}

export type Db = ReturnType<typeof createDb>;
