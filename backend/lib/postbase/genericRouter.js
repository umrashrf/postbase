import express from 'express';

import { runQuery } from './db.js';
import { MetadataCache } from './metadataCache.js';
import { makeEvaluator } from './rulesEngine.js';

/**
 * Generic JSONB-based router.
 * Each table is assumed to have:
 *   id UUID PRIMARY KEY,
 *   data JSONB NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT now(),
 *   updated_at TIMESTAMPTZ DEFAULT now()
 *
 * Example: SELECT data FROM users;  -- JSON objects
 */
export function makeGenericRouter({ pool, rulesModule, authField = 'auth' }) {
    const router = express.Router();
    const meta = new MetadataCache(pool);
    const evaluator = makeEvaluator(rulesModule);

    const ALLOWED_OPS = new Set(['==', '!=', '<', '<=', '>', '>=', 'LIKE', 'ILIKE', 'IN']);

    function mapRequest(req) {
        return {
            auth: req[authField] || null,
            method: req.method,
            params: req.params,
            query: req.query,
            body: req.body,
            ip: req.ip,
        };
    }

    // WHERE builder — works with JSONB fields like data->>'name'
    function buildWhere(filters = []) {
        const whereClauses = [];
        const params = [];
        let idx = 1;
        for (const f of filters) {
            const { field, op, value } = f;
            if (!ALLOWED_OPS.has(op)) throw new Error(`Invalid operator: ${op}`);
            if (op === 'IN') {
                if (!Array.isArray(value) || value.length === 0)
                    throw new Error('IN requires non-empty array');
                const placeholders = value.map(() => `$${idx++}`);
                params.push(...value);
                whereClauses.push(`data->>'${field}' IN (${placeholders.join(',')})`);
            } else if (op === 'LIKE' || op === 'ILIKE') {
                params.push(value);
                whereClauses.push(`data->>'${field}' ${op} $${idx++}`);
            } else {
                params.push(value);
                whereClauses.push(`data->>'${field}' ${op} $${idx++}`);
            }
        }
        return { whereSql: whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '', params };
    }

    // ORDER BY builder — JSON field order
    function buildOrder(order = []) {
        if (!order || !order.length) return '';
        const parts = [];
        for (const o of order) {
            const { field, dir } = o;
            const d = (dir || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
            parts.push(`data->>'${field}' ${d}`);
        }
        return parts.length ? `ORDER BY ${parts.join(', ')}` : '';
    }

    // === QUERY / LIST ===
    router.post('/:table/query', async (req, res) => {
        const table = req.params.table;
        try {
            const request = mapRequest(req);
            const allowed = await evaluator.evaluate(table, 'read', request, null);
            if (!allowed) return res.status(403).json({ error: 'forbidden' });

            const { filters = [], order = [], limit = 100, offset = 0 } = req.body || {};

            let { whereSql, params } = buildWhere(filters);
            whereSql = whereSql.replace(/\=\=/g, '=');
            const orderSql = buildOrder(order);
            const limitSql = Number(limit) > 0 ? `LIMIT ${Number(limit)}` : '';
            const offsetSql = Number(offset) > 0 ? `OFFSET ${Number(offset)}` : '';

            const sql = `
                SELECT id, data, created_at, updated_at
                FROM "${table}"
                ${whereSql} ${orderSql} ${limitSql} ${offsetSql}`;
            const result = await runQuery(pool, sql, params);

            const out = [];
            for (const r of result.rows || []) {
                const resource = r.data;
                const ok = await evaluator.evaluate(table, 'read', request, resource);
                if (ok) out.push({ id: r.id, ...resource });
            }
            return res.json({ data: out });
        } catch (err) {
            console.error(err);
            res.status(400).json({ error: "Internal Error Occurred" });
        }
    });

    // === CREATE ===
    router.post('/:table', async (req, res) => {
        const table = req.params.table;
        try {
            const payload = req.body || {};
            const request = mapRequest(req);
            request.resource = payload;

            const allowed = await evaluator.evaluate(table, 'create', request, payload);
            if (!allowed) return res.status(403).json({ error: 'forbidden' });

            const sql = `
                INSERT INTO "${table}" (data)
                VALUES ($1)
                RETURNING id, data, created_at, updated_at`;
            const result = await runQuery(pool, sql, [payload]);
            const row = result.rows[0];
            res.status(201).json({ data: { id: row.id, ...row.data } });
        } catch (err) {
            console.error(err);
            res.status(400).json({ error: "Internal Error Occurred" });
        }
    });

    // === READ ===
    router.get('/:table/:id', async (req, res) => {
        const table = req.params.table;
        const id = req.params.id;
        try {
            const sql = `SELECT id, data, created_at, updated_at FROM "${table}" WHERE id = $1 LIMIT 1`;
            const result = await runQuery(pool, sql, [id]);
            if (!result.rowCount) return res.status(404).json({ error: 'not_found' });

            const row = result.rows[0];
            const request = mapRequest(req);
            const allowed = await evaluator.evaluate(table, 'read', request, row.data);
            if (!allowed) return res.status(403).json({ error: 'forbidden' });

            res.json({ data: { id: row.id, ...row.data } });
        } catch (err) {
            console.error(err);
            res.status(400).json({ error: "Internal Error Occurred" });
        }
    });

    // === PUT (replace) ===
    router.put('/:table/:id', async (req, res) => {
        const table = req.params.table;
        const id = req.params.id;
        try {
            const existing = await runQuery(pool, `SELECT data FROM "${table}" WHERE id=$1 LIMIT 1`, [id]);
            const payload = req.body || {};

            let current = payload;
            current.id = id; // for rules engine
            if (existing.rowCount) {
                current = existing.rows[0].data;
            }

            const request = mapRequest(req);
            request.resource = current;

            const allowed = await evaluator.evaluate(table, 'update', request, current);
            if (!allowed) return res.status(403).json({ error: 'forbidden' });

            let sql = `
                    UPDATE "${table}"
                    SET data = $1, updated_at = now()
                    WHERE id = $2
                    RETURNING id, data, created_at, updated_at`;

            if (!existing.rowCount) {
                sql = `
                    INSERT INTO "${table}" (data, id, created_at, updated_at)
                    VALUES ($1, $2, now(), now())
                    RETURNING id, data, created_at, updated_at`;
            }

            const result = await runQuery(pool, sql, [payload, id]);
            const row = result.rows[0];
            res.json({ data: { id: row.id, ...row.data } });
        } catch (err) {
            console.error(err);
            res.status(400).json({ error: "Internal Error Occurred" });
        }
    });

    // === PATCH (partial merge) ===
    router.patch('/:table/:id', async (req, res) => {
        const table = req.params.table;
        const id = req.params.id;
        try {
            const existing = await runQuery(pool, `SELECT data FROM "${table}" WHERE id=$1 LIMIT 1`, [id]);
            if (!existing.rowCount) return res.status(404).json({ error: 'not_found' });
            const current = existing.rows[0].data;

            const request = mapRequest(req);
            request.resource = current;
            const allowed = await evaluator.evaluate(table, 'update', request, current);
            if (!allowed) return res.status(403).json({ error: 'forbidden' });

            const payload = req.body || {};
            const merged = { ...current, ...payload };
            const sql = `
                UPDATE "${table}"
                SET data = $1, updated_at = now()
                WHERE id = $2
                RETURNING id, data, created_at, updated_at`;
            const result = await runQuery(pool, sql, [merged, id]);
            const row = result.rows[0];
            res.json({ data: { id: row.id, ...row.data } });
        } catch (err) {
            console.error(err);
            res.status(400).json({ error: "Internal Error Occurred" });
        }
    });

    // === DELETE ===
    router.delete('/:table/:id', async (req, res) => {
        const table = req.params.table;
        const id = req.params.id;
        try {
            const existing = await runQuery(pool, `SELECT data FROM "${table}" WHERE id=$1 LIMIT 1`, [id]);
            if (!existing.rowCount) return res.status(404).json({ error: 'not_found' });

            const current = existing.rows[0].data;
            const request = mapRequest(req);
            request.resource = current;
            const allowed = await evaluator.evaluate(table, 'delete', request, current);
            if (!allowed) return res.status(403).json({ error: 'forbidden' });

            const sql = `DELETE FROM "${table}" WHERE id=$1 RETURNING id`;
            const result = await runQuery(pool, sql, [id]);
            res.json({ data: { id: result.rows[0].id } });
        } catch (err) {
            console.error(err);
            res.status(400).json({ error: "Internal Error Occurred" });
        }
    });

    return router;
}
