// server/middleware/auth.js
import { pool } from '../lib/postbase/db.js';
import { authMiddleware } from '../lib/postbase/middlewares/auth.js';

export const authenticate = authMiddleware(pool);
