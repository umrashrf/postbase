// server/middleware/auth.js
import { pool } from "../app.js"
import { authMiddleware } from '../lib/postbase/middlewares/auth.js';

export const authenticate = authMiddleware(pool);
