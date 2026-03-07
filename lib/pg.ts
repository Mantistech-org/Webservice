import { Pool, PoolClient } from 'pg'

const connectionString = process.env.SUPABASE_DB_URL

export const pgEnabled = !!connectionString

let _pool: Pool | null = null

function getPool(): Pool {
  if (!pgEnabled) {
    throw new Error('[pg] getPool called but SUPABASE_DB_URL is not set')
  }
  if (!_pool) {
    _pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    })
    // Without this handler, idle client errors become uncaught exceptions and crash the process.
    _pool.on('error', (err) => {
      console.error('[pg] Idle client error:', err)
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

export async function transaction(fn: (client: PoolClient) => Promise<void>): Promise<void> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    await fn(client)
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
