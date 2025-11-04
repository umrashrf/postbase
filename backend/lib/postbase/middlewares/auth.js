// server/middleware/auth.js
import { runQuery } from '../db.js';

export function authMiddleware(pool) {
    return async function sessionAuth(req, res, next) {
        try {
            const header = req.get('authorization') || '';
            if (!header.startsWith('Bearer ')) {
                req.auth = null;
                return next();
            }
            const token = header.slice(7).trim();

            // Lookup session in database
            const sql = `
                SELECT s.*, u.id AS user_id, u.email, u.name
                FROM "session" s
                JOIN "user" u ON u.id = s."userId"
                WHERE s.token = $1
                LIMIT 1
            `;
            const result = await runQuery(pool, sql, [token]);
            if (!result.rowCount) {
                req.auth = null;
                return next();
            }

            const session = result.rows[0];
            const now = new Date();
            if (new Date(session.expires_at) < now) {
                req.auth = null; // expired
                return next();
            }

            // Attach verified auth info
            req.auth = {
                id: String(session.user_id),
                session_id: session.id,
                expires_at: session.expires_at,
                token,
            };

            req.user = {
                id: String(session.user_id),
                email: session.email,
                name: session.name,
            };

            next();
        } catch (err) {
            console.error('auth middleware error', err);
            req.auth = null;
            next();
        }
    };
}
