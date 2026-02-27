import { Pool } from "pg"

// Singleton pool — reused across hot-reloads in dev
const globalForPg = globalThis as unknown as { _pgPool?: Pool }

function createPool() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set at runtime")
  }

  return new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("neon.tech")
      ? { rejectUnauthorized: false }
      : false,
  })
}

const pool = globalForPg._pgPool ?? createPool()

if (process.env.NODE_ENV !== "production") {
  globalForPg._pgPool = pool
}

// Tagged-template sql helper
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