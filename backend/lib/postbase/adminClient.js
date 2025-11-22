import { randomUUID } from 'crypto';
import { runQuery } from './db.js';

/* ------------------------------------------------------------------ */
/*  Firestore-like Helpers                                             */
/* ------------------------------------------------------------------ */

export class Timestamp {
    constructor(seconds, nanoseconds) {
        this._type = 'timestamp';
        this.seconds = seconds;
        this.nanoseconds = nanoseconds;
    }

    /** Create from JS Date */
    static fromDate(date) {
        const millis = date.getTime();
        const seconds = Math.floor(millis / 1000);
        const nanoseconds = (millis % 1000) * 1e6;
        return new Timestamp(seconds, nanoseconds);
    }

    /** Now */
    static now() {
        return Timestamp.fromDate(new Date());
    }

    /** Create from Firestore-style seconds + nanos */
    static fromSeconds(seconds, nanoseconds = 0) {
        return new Timestamp(seconds, nanoseconds);
    }

    /** Create from Postgres ISO datetime string */
    static fromPostgres(isoString) {
        const date = new Date(isoString);

        if (isNaN(date.getTime())) {
            throw new Error("Invalid Postgres ISO datetime: " + isoString);
        }

        // Parse fractional seconds manually (Postgres can include microseconds)
        const match = isoString.match(/\.(\d+)(?=Z|[+-]\d\d:?\d\d$)/);
        let nanos = 0;

        if (match) {
            let fractional = match[1];                 // e.g., "789123"
            if (fractional.length > 9) {
                fractional = fractional.slice(0, 9);   // trim to nanoseconds
            }
            nanos = parseInt((fractional + "000000000").slice(0, 9), 10);
        }

        const seconds = Math.floor(date.getTime() / 1000);

        return new Timestamp(seconds, nanos);
    }

    /** Convert back to JS Date */
    toDate() {
        return new Date(this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6));
    }

    /** Milliseconds since epoch */
    toMillis() {
        return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6);
    }

    /** ISO string */
    toString() {
        return this.toDate().toISOString();
    }
}

export const FieldValue = {
    increment: (by = 1) => ({ _op: 'increment', by }),
    serverTimestamp: () => ({ _op: 'serverTimestamp' }),
};

export const FieldPath = (path) => ({ _fieldPath: path });
export const documentId = (id) => ({ _documentId: id });

/* ======================================================================= */
/*  Admin Client Factory                                                   */
/* ======================================================================= */

export function makePostbaseAdminClient({ pool }) {
    let self = null;

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
        const where = [];
        const params = [];
        let i = 1;

        for (const f of filters) {
            const { field, op, value } = f;
            const sqlOp = op === "==" ? "=" : op;

            if (op === "IN") {
                if (!Array.isArray(value)) throw new Error("IN requires array");
                const ph = value.map(() => `$${i++}`).join(",");
                params.push(...value);
                where.push(`data->>'${field}' IN (${ph})`);
                continue;
            }

            if (op === "array-contains") {
                if (value && value._type === "ref") {
                    params.push(JSON.stringify([value]));
                    where.push(`data->'${field}' @> $${i++}::jsonb`);
                } else {
                    params.push(value);
                    where.push(`(data->'${field}') ? $${i++}`);
                }
                continue;
            }

            // reference compare
            if (value && value._type === "ref") {
                params.push(value.path);
                where.push(`data->'${field}'->>'path' ${sqlOp} $${i++}`);
                continue;
            }

            params.push(value);
            where.push(`data->>'${field}' ${sqlOp} $${i++}`);
        }

        return {
            whereSql: where.length ? "WHERE " + where.join(" AND ") : "",
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

        console.log('updates', updates);

        for (const [k, v] of Object.entries(updates)) {
            if (!v) {
                result[k] = v;
                continue;
            }

            if (v.hasOwnProperty('_op') && v._op && v._op === "increment") {
                result[k] = Number(result[k] || 0) + v.by;
                continue;
            }

            if (v.hasOwnProperty('_op') && v._op && v._op === "serverTimestamp") {
                result[k] = now;
                continue;
            }

            if (v instanceof Timestamp) {
                result[k] = v.toString();
                continue;
            }

            if (v.hasOwnProperty('_type') && v._type && v._type === "ref") {
                result[k] = { _type: "ref", path: v.path };
                continue;
            }

            if (!v || typeof v !== "object") {
                result[k] = v;
                continue;
            }

            result[k] = serializeForWrite(v);
        }

        return result;
    }

    /* =================================================================== */
    /* Snapshot classes                                                    */
    /* =================================================================== */

    class AdminDocumentSnapshot {
        constructor(id, rawData, ref) {
            this.id = id;
            this._raw = rawData;
            this._data = adminDeserialize(rawData);
            this.ref = ref;
        }

        exists() {
            return !!this._data;
        }

        data() {
            return this._data;
        }

        raw() {
            return this._raw;
        }
    }

    class AdminQuerySnapshot {
        constructor(docs) {
            this.docs = docs;
        }
        forEach(fn) { this.docs.forEach(fn); }
        get empty() { return this.docs.length === 0; }
        get size() { return this.docs.length; }
    }

    /* ------------------------------------------------------------------ */
    /*  Document Reference                                                 */
    /* ------------------------------------------------------------------ */
    class DocumentRef {
        constructor(collectionName, id, parentPath = null) {
            this.collectionName = collectionName;
            this.id = id;
            this.parentPath = parentPath; // e.g. "users/u1"
        }

        /** Build full document path (for chaining use only) */
        get fullPath() {
            const base = this.parentPath ? `${this.parentPath}/${this.collectionName}` : this.collectionName;
            return `${base}/${this.id}`;
        }

        /** Allow chaining subcollections under this document */
        collection(subName) {
            return new CollectionRef(subName, this.fullPath);
        }

        async get(client = pool) {
            const sql = `SELECT id, data FROM "${this.collectionName}" WHERE id = $1 LIMIT 1`;
            console.log(`Executing: ${sql}`);
            console.log(`with params ${this.id}`)
            const result = await runQuery(client, sql, [this.id]);

            if (!result.rowCount) {
                return new AdminDocumentSnapshot(this.id, null, this);
            }

            const row = result.rows[0];
            return new AdminDocumentSnapshot(row.id, row.data, this);
        }

        async set(data, opts = {}, client = pool) {
            const existing = await this.get(client); // data has been deserialized
            const base = opts.merge && existing.exists() ? existing.raw() : {};
            const finalData = applyFieldValues(base, serializeForWrite(data));

            const sql = `
            INSERT INTO "${this.collectionName}" (id, data)
            VALUES ($1, $2)
            ON CONFLICT (id)
            DO UPDATE SET data = EXCLUDED.data, updated_at = now() at time zone 'UTC'
            RETURNING id, data`;
            const result = await runQuery(client, sql, [this.id, finalData]);
            const row = result.rows[0];
            return new AdminDocumentSnapshot(row.id, row.data, this);
        }

        async update(partial, client = pool) {
            const existing = await this.get(client);
            if (!existing.exists()) throw new Error("Document does not exist");
            const merged = applyFieldValues(existing.raw(), serializeForWrite(partial));
            return await this.set(merged, { merge: false }, client);
        }

        async delete(client = pool) {
            const sql = `DELETE FROM "${this.collectionName}" WHERE id=$1 RETURNING id`;
            const r = await runQuery(client, sql, [this.id]);
            return r.rowCount ? r.rows[0].id : null;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Collection Reference                                               */
    /* ------------------------------------------------------------------ */
    class CollectionRef {
        constructor(collectionName, parentPath = null) {
            this.collectionName = collectionName;
            this.parentPath = parentPath; // e.g. "users/u1"
            this._filters = [];
            this._order = [];
            this._limit = null;
            this._offset = null;
        }

        /** Build full collection path (for chaining use only) */
        get fullPath() {
            return this.parentPath ? `${this.parentPath}/${this.collectionName}` : this.collectionName;
        }

        /** Return a DocumentRef in this collection */
        doc(id) {
            return new DocumentRef(this.collectionName, id, this.parentPath);
        }

        /** Allow chaining subcollections under this collection */
        collection(subName) {
            return new CollectionRef(subName, this.fullPath);
        }

        where(field, op, value) {
            if (value && typeof value === "object" && value.fullPath) {
                // DocumentRef inbound (admin)
                value = { _type: "ref", path: value.fullPath };
            }
            this._filters.push({ field, op, value });
            return this;
        }

        orderBy(field, dir = "asc") {
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
            console.log('data before serializing', data);
            console.log('data after serializing', serializeForWrite(data));

            const id = randomUUID();
            const prepared = applyFieldValues({}, serializeForWrite(data));

            const sql = `INSERT INTO "${this.collectionName}" (id, data) VALUES ($1, $2) RETURNING id, data;`;
            const r = await runQuery(client, sql, [id, prepared]);
            const row = r.rows[0];
            return new AdminDocumentSnapshot(row.id, row.data, new DocumentRef(this.collectionName, row.id, this.parentPath));
        }

        async getDocs(client = pool) {
            const { whereSql, params } = buildWhere(this._filters);
            const orderSql = buildOrder(this._order);
            const limitSql = this._limit ? `LIMIT ${this._limit}` : "";
            const offsetSql = this._offset ? `OFFSET ${this._offset}` : "";

            const sql = `
            SELECT id, data, created_at, updated_at
            FROM "${this.collectionName}"
            ${whereSql} ${orderSql} ${limitSql} ${offsetSql}`;
            const result = await runQuery(client, sql, params);
            return result.rows.map(r => new AdminDocumentSnapshot(r.id, r.data, new DocumentRef(this.collectionName, r.id, this.parentPath)));
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
        await client.query("BEGIN");
        const ops = [];

        const tx = {
            get: (ref) => ref.get(client),
            set: (ref, data, opts = {}) => ops.push(() => ref.set(data, opts, client)),
            update: (ref, data) => ops.push(() => ref.update(data, client)),
            delete: (ref) => ops.push(() => ref.delete(client)),
        };

        try {
            await fn(tx);
            for (const op of ops) await op();
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        }
    }

    function isDocumentRef(value) {
        if (!value || typeof value !== "object") return false;
        if (value.collectionName && value.id) return true;
        if (value._type === 'ref' && value.path) return true;
        return false;
    }

    function resolveReference(ref) {
        if (ref.collectionName && ref.id) return `${ref.collectionName}/${ref.id}`;
        if (ref._type === 'ref' && ref.path) return ref.path;
    }

    /* ------------------------------------------------------------------ */
    /*  Postbase Admin Client (Firestore-like for Postgres JSONB)          */
    /* ------------------------------------------------------------------ */

    function serializeForWrite(value) {
        if (isDocumentRef(value)) {
            console.log('isDocumentRef(value) === true');
            return { _type: 'ref', path: resolveReference(value) };
        }

        if (value instanceof Timestamp) {
            console.log('value instanceof Timestamp === true');
            return value.toString();
        }

        if (Array.isArray(value)) {
            console.log('Array.isArray(value) === true');
            return value.map(serializeForWrite);
        }

        if (typeof value === "object" && value !== null) {
            console.log('(typeof value === "object" && value !== null) === true');
            const out = {};
            for (const [k, v] of Object.entries(value)) {
                out[k] = serializeForWrite(v);
                console.log('serializeForWrite', k, out[k]);
            }
            return out;
        }

        return value;
    }

    function adminDeserialize(value) {
        if (Array.isArray(value)) return value.map(adminDeserialize);

        if (value && typeof value === "object") {
            // detect timestamp
            if (typeof value === "string" && isIsoDateString(value)) {
                return Timestamp.fromPostgres(value);
            }

            // detect reference object
            if (value._type === "ref" && value.path) {
                const parts = value.path.split('/');
                let ref = self.collection(parts[0]).doc(parts[1]);
                for (let i = 2; i < parts.length; i += 2) {
                    ref = ref.collection(parts[i]).doc(parts[i + 1]);
                }
                return ref;
            }

            const out = {};
            for (const [k, v] of Object.entries(value)) {
                out[k] = adminDeserialize(v);
            }
            return out;
        }

        // ISO top-level primitive
        if (typeof value === "string" && isIsoDateString(value)) {
            return Timestamp.fromPostgres(value);
        }

        return value;
    }

    function isIsoDateString(v) {
        return typeof v === "string" &&
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v);
    }

    /* ------------------------------------------------------------------ */
    /*  Public API                                                         */
    /* ------------------------------------------------------------------ */
    self = {
        DocumentRef,
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
    return self;
}
