// db.js
import { Pool } from 'pg';

export function createPool(opts = {}) {
    const pool = new Pool(opts);
    return pool;
}

export async function runQuery(pool, text, params = []) {
    const client = await pool.connect();
    try {
        const res = await client.query(text, params);
        return res;
    } finally {
        client.release();
    }
}
