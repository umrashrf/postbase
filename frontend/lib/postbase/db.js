// // Minimal client SDK for the generic CRUD API.
// // Usage example:
//   import { getDB } from './postbase.js';
//   const db = getDB({ baseUrl: 'https://api.example.com/api' });
//   const posts = db.collection('posts');
//   await posts.addDoc({ title: 'hi' });
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
    baseUrl = '/api',
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

    /** Build full collection path */
    get fullPath() {
        return this.parentPath ? `${this.parentPath}/${this.name}` : this.name;
    }

    /** Return a DocumentReference inside this collection */
    doc(id) {
        return new DocumentReference(this.db, this.name, id, this.parentPath);
    }

    /** Allow chaining subcollections under this collection — for convenience */
    collection(subName) {
        // Enables chaining like: db.collection('orgs').collection('users')
        // Useful for root-level logical grouping (not subcollections of docs)
        return new CollectionReference(this.db, subName, this.fullPath);
    }

    // POST /:collection
    async addDoc(data) {
        const url = `${this.db.baseUrl}/${encodeURIComponent(this.fullPath)}`;
        const headers = await this.db.getHeaders();
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json', ...headers },
            body: JSON.stringify(serializeRefs(data))
        });
        const json = await toJsonOrThrow(res);
        return json.data;
    }

    // POST /:collection/query
    async getDocs(query = {}) {
        const url = `${this.db.baseUrl}/${encodeURIComponent(this.fullPath)}/query`;
        const headers = await this.db.getHeaders();
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json', ...headers },
            body: JSON.stringify(query)
        });
        const json = await toJsonOrThrow(res);
        const docs = (json.data || []).map((doc) => {
            const data = deserializeRefs(this.db, doc.data || {});
            data.id = doc.id;
            data._path = `${this.fullPath}/${doc.id}`;
            return data;
        });
        return docs;
    }

    where(field, op, value) {
        return new QueryBuilder(this.fullPath).where(field, op, value);
    }
}

/** 
 * Recursively convert DocumentReference instances to JSON-safe { _type: 'ref', path } objects
 */
function serializeRefs(obj) {
    if (obj instanceof DocumentReference) {
        return { _type: 'ref', path: obj.fullPath };
    }
    if (Array.isArray(obj)) {
        return obj.map(serializeRefs);
    }
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
        return obj.map((v) => deserializeRefs(db, v));
    }
    if (obj && typeof obj === 'object') {
        if (obj._type === 'ref' && typeof obj.path === 'string') {
            // Convert "users/alovelace" → collection('users').doc('alovelace')
            const parts = obj.path.split('/');
            if (parts.length % 2 === 0) {
                let ref = db.collection(parts[0]).doc(parts[1]);
                for (let i = 2; i < parts.length; i += 2) {
                    ref = ref.collection(parts[i]).doc(parts[i + 1]);
                }
                return ref;
            }
            // fallback: return plain object if malformed
            return obj;
        }
        const out = {};
        for (const [k, v] of Object.entries(obj)) {
            out[k] = deserializeRefs(db, v);
        }
        return out;
    }
    return obj;
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
        const base = this.parentPath ? `${this.parentPath}/${this.collectionName}` : this.collectionName;
        return `${base}/${this.id}`;
    }

    /** Allow chaining subcollections under this document */
    collection(subName) {
        return new CollectionReference(this.db, subName, this.fullPath);
    }

    async get() {
        const url = `${this.db.baseUrl}/${encodeURIComponent(this.fullPath)}`;
        const headers = await this.db.getHeaders();
        const res = await fetch(url, { headers });
        const json = await toJsonOrThrow(res);
        const data = deserializeRefs(this.db, json.data || {});
        data.id = this.id;
        data._path = this.fullPath;
        return data;
    }

    async set(data, opts = {}) {
        const url = `${this.db.baseUrl}/${encodeURIComponent(this.fullPath)}`;
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
        const url = `${this.db.baseUrl}/${encodeURIComponent(this.fullPath)}`;
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
        const url = `${this.db.baseUrl}/${encodeURIComponent(this.fullPath)}`;
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

class QueryBuilder {
    constructor(collectionNameOrRef) {
        this.collection = (collectionNameOrRef && collectionNameOrRef.name) || collectionNameOrRef;
        this._filters = [];
        this._order = [];
        this._limit = undefined;
        this._offset = undefined;
    }
    where(field, op, value) {
        this._filters.push({ field, op, value });
        return this;
    }
    orderBy(field, dir = 'asc') {
        this._order.push({ field, dir });
        return this;
    }
    limit(n) { this._limit = n; return this; }
    offset(n) { this._offset = n; return this; }
    build() {
        const out = {};
        if (this._filters.length) out.filters = this._filters;
        if (this._order.length) out.order = this._order;
        if (typeof this._limit !== 'undefined') out.limit = this._limit;
        if (typeof this._offset !== 'undefined') out.offset = this._offset;
        return out;
    }
    mergeFrom(other) {
        this._filters.push(...(other._filters || []));
        this._order.push(...(other._order || []));
        if (other._limit) this._limit = other._limit;
        if (other._offset) this._offset = other._offset;
        return this;
    }
}

/* Basic helpers similar to Firestore types */
export const Timestamp = {
    now: () => ({ _type: 'timestamp', iso: new Date().toISOString() }),
    fromDate: (d) => ({ _type: 'timestamp', iso: d.toISOString() })
};

export const FieldValue = {
    increment: (by = 1) => ({ _op: 'increment', by }),
    serverTimestamp: () => ({ _op: 'serverTimestamp' }),
};

export const FieldPath = (path) => ({ _fieldPath: path });

export const documentId = (id) => ({ _documentId: id });
