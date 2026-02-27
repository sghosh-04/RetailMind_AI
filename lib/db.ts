import { Pool } from "pg"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

// Singleton pool — reused across hot-reloads in dev
const globalForPg = globalThis as unknown as { _pgPool?: Pool }
const pool =
  globalForPg._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Disable SSL for local postgres; Neon URLs already contain ?sslmode=require
    ssl: process.env.DATABASE_URL.includes("neon.tech")
      ? { rejectUnauthorized: false }
      : false,
  })
if (process.env.NODE_ENV !== "production") globalForPg._pgPool = pool

// Tagged-template sql helper — same interface as neon() from @neondatabase/serverless
export async function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<Record<string, unknown>[]> {
  let text = ""
  strings.forEach((str, i) => {
    text += str
    if (i < values.length) text += `$${i + 1}`
  })
  const result = await pool.query(text, values as unknown[])
  return result.rows
}

