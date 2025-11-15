// // Minimal client SDK for the generic CRUD API.
// // Usage example:
//   import { getDB } from './postbase.js';
//   const db = getDB({ baseUrl: 'https://api.example.com/api' });
//   const posts = db.collection('posts');
//   await posts.add({ title: 'hi' });
//   const doc = await posts.doc('123').get();
//
// // You can also use references
// const userRef = db.collection('users').doc('alovelace');
// await userRef.set({ name: 'Ada Lovelace' });

// await db.collection('reviews').doc('r1').set({
//   rating: 5,
//   reviewer: userRef
// });

// const review = await db.collection('reviews').doc('r1').get();

// console.log(review.reviewer instanceof DocumentReference); // ✅ true
// const user = await review.reviewer.get();
// console.log(user.name); // "Ada Lovelace"

function toJsonOrThrow(res) {
    if (!res.ok) {
        return res.json().then(j => { throw j; });
    }
    return res.json();
}

export function getDB({
    baseUrl = '/api/db',
    defaultHeaders = {},
    getAuthToken = null, // 👈 optional async token resolver
} = {}) {
    return new Database(baseUrl.replace(/\/$/, ''), defaultHeaders, getAuthToken);
}

class Database {
    constructor(baseUrl, defaultHeaders, getAuthToken) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = defaultHeaders;
        this.getAuthToken = getAuthToken;
    }

    collection(name) {
        return new CollectionReference(this, name);
    }

    async getHeaders() {
        const headers = { ...this.defaultHeaders };
        if (typeof this.getAuthToken === 'function') {
            try {
                const token = await this.getAuthToken();
                if (token) headers['Authorization'] = `Bearer ${token}`;
            } catch (err) {
                console.warn('getAuthToken failed', err);
            }
        }
        return headers;
    }
}

class CollectionReference {
    constructor(db, name, parentPath = null) {
        this.db = db;
        this.name = name;
        this.parentPath = parentPath; // e.g., "users/u1"
    }

    get fullPath() {
        return this.parentPath ? `${this.parentPath}/${encodeURIComponent(this.name)}` : encodeURIComponent(this.name);
    }

    doc(id) {
        return new DocumentReference(this.db, this.name, id, this.parentPath);
    }

    collection(subName) {
        return new CollectionReference(this.db, subName, this.fullPath);
    }

    async add(data) {
        const url = `${this.db.baseUrl}/${this.fullPath}`;
        const headers = await this.db.getHeaders();
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json', ...headers },
            body: JSON.stringify(serializeRefs(data))
        });
        const json = await toJsonOrThrow(res);
        return json.data;
    }

    /** Directly get all docs (no filters) */
    async get() {
        const query = new QueryBuilder(this);
        const docs = await query.get();
        // If there are no query filters, wrap in QuerySnapshot
        if (query._filters.length === 0 && query._order.length === 0 && !query._limit) {
            return new QuerySnapshot(docs);
        }
        // Otherwise, return array of DocumentSnapshot as before
        return docs;
    }

    /** Start a query builder chain */
    where(field, op, value) {
        return new QueryBuilder(this).where(field, op, value);
    }

    /** Optional syntactic sugar — allow orderBy/limit without where() */
    orderBy(field, dir = 'asc') {
        return new QueryBuilder(this).orderBy(field, dir);
    }

    limit(n) {
        return new QueryBuilder(this).limit(n);
    }
}


/** 
 * Recursively convert DocumentReference instances to JSON-safe { _type: 'ref', path } objects
 */
function serializeRefs(obj) {
    if (obj instanceof DocumentReference) {
        return { _type: 'ref', path: obj.fullPath };
    }

    //NEW: If Timestamp instance, send canonical structure
    if (obj instanceof Timestamp) {
        return { _type: 'timestamp', iso: obj.iso };
    }

    if (Array.isArray(obj)) return obj.map(serializeRefs);

    if (obj && typeof obj === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(obj)) {
            out[k] = serializeRefs(v);
        }
        return out;
    }

    return obj;
}

/**
 * Recursively restore { _type:'ref', path } objects back to DocumentReference instances.
 */
function deserializeRefs(db, obj) {
    if (Array.isArray(obj)) {
        return obj.map(v => deserializeRefs(db, v));
    }

    if (obj && typeof obj === 'object') {
        //Detect timestamp object sent by backend/admin client
        if (obj._type === 'timestamp' && typeof obj.iso === 'string') {
            return new Timestamp(obj.iso);
        }

        // Detect PostgreSQL TIMESTAMPTZ returned as strings
        if (isIsoDateString(obj)) {
            return new Timestamp(obj);
        }

        const out = {};
        for (const [k, v] of Object.entries(obj)) {
            out[k] = deserializeRefs(db, v);
        }
        return out;
    }

    //If a primitive ISO string is received, convert it
    if (isIsoDateString(obj)) {
        return new Timestamp(obj);
    }

    return obj;
}


class DocumentSnapshot {
    constructor(id, data, path, db) {
        this.id = id;
        this._data = data;
        this._path = path;
        this._db = db;
    }

    data() {
        return this._data;
    }

    get ref() {
        const parts = this._path.split('/');
        let ref = this._db.collection(parts[0]).doc(parts[1]);
        for (let i = 2; i < parts.length; i += 2) {
            ref = ref.collection(parts[i]).doc(parts[i + 1]);
        }
        return ref;
    }

    get path() {
        return this._path;
    }

    exists() {
        return !!this._data;
    }
}

class DocumentReference {
    constructor(db, collectionName, id, parentPath = null) {
        this.db = db;
        this.collectionName = collectionName;
        this.id = id;
        this.parentPath = parentPath;
    }

    /** Full document path, e.g. "users/u1/posts/p2" */
    get fullPath() {
        const base = this.parentPath ? `${this.parentPath}/${encodeURIComponent(this.collectionName)}` : encodeURIComponent(this.collectionName);
        return `${base}/${encodeURIComponent(this.id)}`;
    }

    /** Allow chaining subcollections under this document */
    collection(subName) {
        return new CollectionReference(this.db, subName, this.fullPath);
    }

    async get() {
        const url = `${this.db.baseUrl}/${this.fullPath}`;
        const headers = await this.db.getHeaders();
        const res = await fetch(url, { headers });
        const json = await toJsonOrThrow(res);
        const data = deserializeRefs(this.db, json.data || {});
        return new DocumentSnapshot(this.id, data, this.fullPath, this.db);
    }

    async set(data, opts = {}) {
        const url = `${this.db.baseUrl}/${this.fullPath}`;
        const headers = await this.db.getHeaders();

        // If merge=true, fetch existing data first and merge locally
        let finalData = data;
        if (opts.merge) {
            try {
                const existing = await this.get();
                finalData = { ...(existing || {}), ...data };
            } catch (err) {
                // If doc doesn't exist, just create it
                finalData = data;
            }
        }

        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'content-type': 'application/json', ...headers },
            body: JSON.stringify(serializeRefs(finalData)),
        });
        const json = await toJsonOrThrow(res);
        return json.data;
    }

    async update(data) {
        const url = `${this.db.baseUrl}/${this.fullPath}`;
        const headers = await this.db.getHeaders();
        const res = await fetch(url, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json', ...headers },
            body: JSON.stringify(serializeRefs(data)),
        });
        const json = await toJsonOrThrow(res);
        return json.data;
    }

    async delete() {
        const url = `${this.db.baseUrl}/${this.fullPath}`;
        const headers = await this.db.getHeaders();
        const res = await fetch(url, { method: 'DELETE', headers });
        const json = await toJsonOrThrow(res);
        return json.data;
    }
}

/* Query builder helpers */
export function query(collectionRef, ...clauses) {
    // returns a structured query object for backend: { filters: [...], order: [...], limit, offset }
    const q = new QueryBuilder(collectionRef);
    for (const c of clauses) {
        if (c instanceof QueryBuilder) q.mergeFrom(c);
    }
    return q;
}

class QuerySnapshot {
    constructor(docs) {
        this.docs = docs; // array of DocumentSnapshot
    }

    // Optional helper like Firestore
    forEach(callback) {
        this.docs.forEach(callback);
    }

    get empty() {
        return this.docs.length === 0;
    }

    get size() {
        return this.docs.length;
    }
}

class QueryBuilder {
    constructor(collectionRef) {
        this.collectionRef = collectionRef;
        this._filters = [];
        this._order = [];
        this._limit = undefined;
        this._offset = undefined;

        // New cursor fields
        this._startAt = undefined;
        this._startAfter = undefined;
        this._endAt = undefined;
        this._endBefore = undefined;
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

    // 🔽 Pagination methods (Firestore-like)
    startAt(cursor) {
        this._startAt = this._normalizeCursor(cursor);
        return this;
    }

    startAfter(cursor) {
        this._startAfter = this._normalizeCursor(cursor);
        return this;
    }

    endAt(cursor) {
        this._endAt = this._normalizeCursor(cursor);
        return this;
    }

    endBefore(cursor) {
        this._endBefore = this._normalizeCursor(cursor);
        return this;
    }

    // Internal helper — Firestore allows passing either value or doc snapshot
    _normalizeCursor(cursor) {
        if (!cursor) return null;
        if (typeof cursor === 'object' && cursor.id) {
            // Likely a document snapshot or data with an id
            return { _type: 'cursorRef', path: cursor._path || `${this.collectionRef.fullPath}/${cursor.id}` };
        }
        // For raw scalar values (like numeric sort fields)
        return cursor;
    }

    build() {
        const out = {};
        if (this._filters.length) out.filters = this._filters;
        if (this._order.length) out.order = this._order;
        if (typeof this._limit !== 'undefined') out.limit = this._limit;
        if (typeof this._offset !== 'undefined') out.offset = this._offset;

        // Include cursors if defined
        if (this._startAt !== undefined) out.startAt = this._startAt;
        if (this._startAfter !== undefined) out.startAfter = this._startAfter;
        if (this._endAt !== undefined) out.endAt = this._endAt;
        if (this._endBefore !== undefined) out.endBefore = this._endBefore;

        return out;
    }

    async get() {
        const url = `${this.collectionRef.db.baseUrl}/${this.collectionRef.fullPath}/query`;
        const headers = await this.collectionRef.db.getHeaders();

        const queryBody = this.build();
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json', ...headers },
            body: JSON.stringify(queryBody),
        });
        const json = await toJsonOrThrow(res);

        // Map each document to a DocumentSnapshot
        const docs = (json.data || []).map((doc) => {
            const data = deserializeRefs(this.collectionRef.db, doc.data || {});
            return new DocumentSnapshot(doc.id, data, `${this.collectionRef.fullPath}/${doc.id}`, this.collectionRef.db);
        });
        return docs;
    }

    onSnapshot(callback, errorCallback) {
        const wsUrl = this.collectionRef.db.baseUrl
            .replace(/^http/, 'wss')
            + `/${this.collectionRef.fullPath}/stream`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            const queryBody = this.build();
            ws.send(JSON.stringify(queryBody)); // send query definition once
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'init' || msg.type === 'change') {
                    const docs = (msg.data || []).map(doc => {
                        const data = deserializeRefs(this.collectionRef.db, doc.data || doc);
                        return new DocumentSnapshot(
                            doc.id,
                            data,
                            `${this.collectionRef.fullPath}/${doc.id}`,
                            this.collectionRef.db
                        );
                    });
                    callback(new QuerySnapshot(docs));
                }
            } catch (err) {
                if (typeof errorCallback === 'function') errorCallback(err);
                else console.error('onSnapshot parsing error:', err);
            }
        };

        ws.onerror = (err) => {
            if (typeof errorCallback === 'function') errorCallback(err);
            else console.error('onSnapshot websocket error:', err);
        };

        return () => ws.close(); // return unsubscribe function
    }

    mergeFrom(other) {
        this._filters.push(...(other._filters || []));
        this._order.push(...(other._order || []));
        if (other._limit) this._limit = other._limit;
        if (other._offset) this._offset = other._offset;
        if (other._startAt) this._startAt = other._startAt;
        if (other._startAfter) this._startAfter = other._startAfter;
        if (other._endAt) this._endAt = other._endAt;
        if (other._endBefore) this._endBefore = other._endBefore;
        return this;
    }
}

/* Basic helpers similar to Firestore types */

function isIsoDateString(v) {
    return (
        typeof v === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)
    );
}

export class Timestamp {
    constructor(isoString) {
        this._type = 'timestamp';
        this.iso = isoString;
    }

    static fromDate(d) {
        return new Timestamp(d.toISOString());
    }

    static now() {
        return new Timestamp(new Date().toISOString());
    }

    toDate() {
        return new Date(this.iso);
    }

    toMillis() {
        return this.toDate().getTime();
    }

    toString() {
        return this.iso;
    }
}

export const FieldValue = {
    increment: (by = 1) => ({ _op: 'increment', by }),
    serverTimestamp: () => ({ _op: 'serverTimestamp' }),
};

export const FieldPath = (path) => ({ _fieldPath: path });

export const documentId = (id) => ({ _documentId: id });
