import pg from 'pg';
import { config } from '../config.js';

// DATE columns come back as 'YYYY-MM-DD' strings, matching what the site sends.
pg.types.setTypeParser(1082, (value) => value);

export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 });

export function query(text, params) {
  return pool.query(text, params);
}

/** Runs `work(client)` inside a transaction; rolls back on any error. */
export async function tx(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
