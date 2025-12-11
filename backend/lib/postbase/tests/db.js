import { Pool } from 'pg';

export const pool = new Pool({
    connectionString: process.env.TEST_DB_URL,
});

export async function resetDb() {
    await pool.query(`TRUNCATE rtdb_nodes`);
}
