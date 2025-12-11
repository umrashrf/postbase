import express from 'express';

/**
 * rtdb_nodes schema assumptions:
 * - path TEXT PRIMARY KEY
 * - parent_path TEXT
 * - key TEXT
 * - value JSONB
 * - version BIGINT
 * - updated_at TIMESTAMPTZ
 */

export function createRtdbRouter({ pool, notify }) {
    const router = express.Router();

    const clean = p => (p || '').replace(/^\/+|\/+$/g, '');

    const splitPath = path => {
        const parts = path.split('/');
        return {
            key: parts.at(-1),
            parent: parts.length > 1 ? parts.slice(0, -1).join('/') : null,
        };
    };

    // =====================================================
    // GET node
    // =====================================================
    router.get('/*', async (req, res) => {
        const path = clean(req.params[0]);

        const r = await pool.query(
            `SELECT value FROM rtdb_nodes WHERE path = $1`,
            [path]
        );

        if (!r.rowCount) return res.sendStatus(404);
        res.json(r.rows[0].value);
    });

    // =====================================================
    // SET (replace node)
    // =====================================================
    router.put('/*', async (req, res) => {
        const path = clean(req.params[0]);
        const value = req.body ?? {};

        const { key, parent } = splitPath(path);

        const q = `
            INSERT INTO rtdb_nodes (path, parent_path, key, value)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (path)
            DO UPDATE SET
              value = EXCLUDED.value,
              version = rtdb_nodes.version + 1,
              updated_at = now() at time zone 'UTC'
            RETURNING value
        `;

        const r = await pool.query(q, [path, parent, key, value]);

        await notify(path, value);
        res.json(r.rows[0].value);
    });

    // =====================================================
    // UPDATE (merge)
    // =====================================================
    router.patch('/*', async (req, res) => {
        const path = clean(req.params[0]);
        const patch = req.body ?? {};

        const cur = await pool.query(
            `SELECT value FROM rtdb_nodes WHERE path = $1`,
            [path]
        );
        if (!cur.rowCount) return res.sendStatus(404);

        const oldValue = cur.rows[0].value;
        const newValue = { ...oldValue, ...patch };

        if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
            return res.status(204).end();
        }

        await pool.query(
            `
            UPDATE rtdb_nodes
            SET value = $1,
                version = version + 1,
                updated_at = now() at time zone 'UTC'
            WHERE path = $2
            `,
            [newValue, path]
        );

        await notify(path, newValue, oldValue);
        res.json(newValue);
    });

    // =====================================================
    // DELETE node + subtree
    // =====================================================
    router.delete('/*', async (req, res) => {
        const path = clean(req.params[0]);

        await pool.query(
            `
            DELETE FROM rtdb_nodes
            WHERE path = $1 OR parent_path LIKE $2
            `,
            [path, `${path}/%`]
        );

        await notify(path, null);
        res.json({ ok: true });
    });

    // =====================================================
    // PUSH (generate child key)
    // =====================================================
    router.post('/*/push', async (req, res) => {
        const parent = clean(req.params[0]);
        const key = Math.random().toString(36).slice(2, 10);
        const path = `${parent}/${key}`;
        const value = req.body ?? {};

        await pool.query(
            `
            INSERT INTO rtdb_nodes (path, parent_path, key, value)
            VALUES ($1, $2, $3, $4)
            `,
            [path, parent, key, value]
        );

        await notify(path, value);
        res.status(201).json({ key, path });
    });

    return router;
}
