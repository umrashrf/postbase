import { randomUUID } from 'crypto';
import { runQuery } from './db.js';

/* ------------------------------------------------------------------ */
/*  Firestore-like Helpers                                             */
/* ------------------------------------------------------------------ */

export const Timestamp = {
    now: () => ({ _type: 'timestamp', iso: new Date().toISOString() }),
    fromDate: (d) => ({ _type: 'timestamp', iso: d.toISOString() }),
};

export const FieldValue = {
    increment: (by = 1) => ({ _op: 'increment', by }),
    serverTimestamp: () => ({ _op: 'serverTimestamp' }),
};

export const FieldPath = (path) => ({ _fieldPath: path });
export const documentId = (id) => ({ _documentId: id });

/* ------------------------------------------------------------------ */
/*  Postbase Admin Client (Firestore-like for Postgres JSONB)          */
/* ------------------------------------------------------------------ */

export function makePostbaseAdminClient({ pool }) {
    const ALLOWED_OPS = new Set([
        '==',
        '!=',
        '<',
        '<=',
        '>',
        '>=',
        'LIKE',
        'ILIKE',
        'IN',
        'array-contains', // only supports strings "large" in ["red", "blue", "large"]
    ]);

    // === WHERE builder ===
    function buildWhere(filters = []) {
        const whereClauses = [];
        const params = [];
        let idx = 1;

        for (const f of filters) {
            const { field, op, value } = f;
            const sqlOp = op === '==' ? '=' : op;

            // Detect parent/document references
            if (value && typeof value === 'object' && value.collectionName && value.id) {
                const path = value.path || `${value.collectionName}/${value.id}`;
                params.push(path);
                whereClauses.push(`data->'${field}'->>'path' ${sqlOp} $${idx++}`);
                continue;
            }

            // IN operator
            if (op === 'IN') {
                if (!Array.isArray(value) || value.length === 0) throw new Error('IN requires non-empty array');
                const placeholders = value.map(() => `$${idx++}`);
                params.push(...value);
                whereClauses.push(`data->>'${field}' IN (${placeholders.join(',')})`);
                continue;
            }

            // array-contains
            if (op === 'array-contains') {
                if (typeof value === 'object') {
                    const path = value.path || `${value.collectionName}/${value.id}`;
                    params.push(path);
                    whereClauses.push(`data->'${field}'->>'path' ${sqlOp} $${idx++}`);
                } else {
                    params.push(value);
                    whereClauses.push(`(data->'${field}') ? $${idx++}`);
                }
                continue;
            }

            // LIKE / ILIKE
            if (op === 'LIKE' || op === 'ILIKE') {
                params.push(value);
                whereClauses.push(`data->>'${field}' ${op} $${idx++}`);
                continue;
            }

            // Default primitive comparison
            params.push(value);
            whereClauses.push(`data->>'${field}' ${sqlOp} $${idx++}`);
        }

        return {
            whereSql: whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '',
            params,
        };
    }

    // === ORDER builder ===
    function buildOrder(order = []) {
        if (!order.length) return '';
        const parts = order.map(({ field, dir }) =>
            `data->>'${field}' ${dir?.toLowerCase() === 'desc' ? 'DESC' : 'ASC'}`
        );
        return parts.length ? `ORDER BY ${parts.join(', ')}` : '';
    }

    // === Apply Firestore-like FieldValue logic ===
    function applyFieldValues(target, updates) {
        const now = new Date().toISOString();
        const result = { ...target };

        for (const [key, val] of Object.entries(updates)) {
            if (val && typeof val === 'object') {
                if (val._op === 'increment') {
                    const prev = Number(result[key] || 0);
                    result[key] = prev + val.by;
                } else if (val._op === 'serverTimestamp') {
                    result[key] = now;
                } else if (val._type === 'timestamp') {
                    result[key] = val.iso;
                } else {
                    result[key] = val;
                }
            } else {
                result[key] = val;
            }
        }

        return result;
    }

    class AdminDocumentSnapshot {
        constructor(id, data, ref) {
            this.id = id;
            this._data = data;
            this.ref = ref;
        }

        exists() {
            return !!this._data;
        }

        data() {
            return this._data;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Document Reference                                                 */
    /* ------------------------------------------------------------------ */
    class DocumentRef {
        constructor(table, id, parentPath = null) {
            this.table = table;
            this.id = id;
            this.parentPath = parentPath; // e.g. "users/u1"
        }

        /** Build full document path (for chaining use only) */
        get fullPath() {
            const base = this.parentPath ? `${this.parentPath}/${this.table}` : this.table;
            return `${base}/${this.id}`;
        }

        /** Allow chaining subcollections under this document */
        collection(subName) {
            return new CollectionRef(subName, this.fullPath);
        }

        async get(client = pool) {
            const sql = `SELECT id, data FROM "${this.table}" WHERE id=$1 LIMIT 1`;
            const result = await runQuery(client, sql, [this.id]);

            if (!result.rowCount) {
                return new AdminDocumentSnapshot(this.id, null, new DocumentRef(this.table, this.id, this.parentPath));
            }

            const row = result.rows[0];
            return new AdminDocumentSnapshot(row.id, row.data, new DocumentRef(this.table, row.id, this.parentPath));
        }

        async set(data, opts = {}, client = pool) {
            const existing = await this.get(client);
            const base = existing.exists() ? existing.data() : {};
            const finalData = opts.merge
                ? applyFieldValues(base, data)
                : applyFieldValues({}, data);

            const sql = `
            INSERT INTO "${this.table}" (id, data)
            VALUES ($1, $2)
            ON CONFLICT (id)
            DO UPDATE SET data = EXCLUDED.data, updated_at = now() at time zone 'UTC'
            RETURNING id, data`;
            const result = await runQuery(client, sql, [this.id, finalData]);
            const row = result.rows[0];
            return new AdminDocumentSnapshot(row.id, row.data, new DocumentRef(this.table, row.id, this.parentPath));
        }

        async update(partial, client = pool) {
            const existing = await this.get(client);
            if (!existing) return null;
            const merged = applyFieldValues(existing, partial);
            return await this.set(merged, { merge: true }, client);
        }

        async delete(client = pool) {
            const sql = `DELETE FROM "${this.table}" WHERE id=$1 RETURNING id`;
            const result = await runQuery(client, sql, [this.id]);
            return result.rowCount ? result.rows[0].id : null;
        }
    }

    class AdminQuerySnapshot {
        constructor(docs) {
            this.docs = docs; // array of AdminDocumentSnapshot
        }

        forEach(fn) {
            this.docs.forEach(fn);
        }

        get empty() {
            return this.docs.length === 0;
        }

        get size() {
            return this.docs.length;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Collection Reference                                               */
    /* ------------------------------------------------------------------ */
    class CollectionRef {
        constructor(table, parentPath = null) {
            this.table = table;
            this.parentPath = parentPath; // e.g. "users/u1"
            this._filters = [];
            this._order = [];
            this._limit = null;
            this._offset = null;
        }

        /** Build full collection path (for chaining use only) */
        get fullPath() {
            return this.parentPath ? `${this.parentPath}/${this.table}` : this.table;
        }

        /** Return a DocumentRef in this collection */
        doc(id) {
            return new DocumentRef(this.table, id, this.parentPath);
        }

        /** Allow chaining subcollections under this collection */
        collection(subName) {
            return new CollectionRef(subName, this.fullPath);
        }

        where(field, op, value) {
            this._filters.push({ field, op, value });
            return this;
        }

        orderBy(field, dir = 'asc') {
            this._order.push({ field, dir });
            return this;
        }

        limit(n) {
            this._limit = n;
            return this;
        }

        offset(n) {
            this._offset = n;
            return this;
        }

        async add(data, client = pool) {
            const id = randomUUID();
            const prepared = applyFieldValues({}, data);
            const sql = `
            INSERT INTO "${this.table}" (id, data)
            VALUES ($1, $2)
            RETURNING id, data`;
            const result = await runQuery(client, sql, [id, prepared]);
            const row = result.rows[0];
            return new AdminDocumentSnapshot(row.id, row.data, new DocumentRef(this.table, row.id, this.parentPath));
        }

        async getDocs(client = pool) {
            const { whereSql, params } = buildWhere(this._filters);
            const orderSql = buildOrder(this._order);
            const limitSql = this._limit ? `LIMIT ${Number(this._limit)}` : '';
            const offsetSql = this._offset ? `OFFSET ${Number(this._offset)}` : '';

            const sql = `
            SELECT id, data, created_at, updated_at
            FROM "${this.table}"
            ${whereSql} ${orderSql} ${limitSql} ${offsetSql}`;
            const result = await runQuery(client, sql, params);
            return result.rows.map(r => new AdminDocumentSnapshot(r.id, r.data));
        }

        async get(client = pool) {
            const docs = await this.getDocs(client);
            return new AdminQuerySnapshot(docs);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Transaction Support (Firestore-style)                              */
    /* ------------------------------------------------------------------ */
    async function runTransaction(fn, client = pool) {
        try {
            await client.query('BEGIN');
            const operations = [];

            const tx = {
                async get(ref) {
                    return await ref.get(client);
                },
                set(ref, data, opts = {}) {
                    operations.push(async () => {
                        await ref.set(data, opts, client);
                    });
                },
                update(ref, data) {
                    operations.push(async () => {
                        await ref.update(data, client);
                    });
                },
                delete(ref) {
                    operations.push(async () => {
                        await ref.delete(client);
                    });
                },
            };

            await fn(tx); // Run user transaction function
            for (const op of operations) await op(); // Execute all queued writes

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Public API                                                         */
    /* ------------------------------------------------------------------ */
    return {
        collection(name) {
            return new CollectionRef(name);
        },
        runTransaction,
        FieldValue,
        Timestamp,
        FieldPath,
        documentId,

        // need that for websockets
        buildWhere,
        buildOrder,
    };
}
