import { Pool } from 'pg';

export const pool = new Pool({
    connectionString: process.env.TEST_DB_URL,
});

export async function resetDb() {
    // export TEST_DB_URL="postgresql://postgres:yoursecretpassword@127.0.0.1:5432/postbase"
    await pool.query(`TRUNCATE rtdb_nodes`);
}
