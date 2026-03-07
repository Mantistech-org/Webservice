import { Pool } from 'pg'

const connectionString = process.env.SUPABASE_DB_URL

export const pgEnabled = !!connectionString

let _pool: Pool | null = null

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    })
  }
  return _pool
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await getPool().query(sql, params)
  return result.rows as T[]
}
