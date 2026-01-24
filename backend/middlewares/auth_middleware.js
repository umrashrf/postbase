// server/middleware/auth.js
import { createPool } from '../lib/postbase/db.js';
import { authMiddleware } from '../lib/postbase/middlewares/auth.js';

// Initialize DB pool using env variables
const pool = createPool({
    connectionString: process.env.DATABASE_URL
});

export const authenticate = authMiddleware(pool);
