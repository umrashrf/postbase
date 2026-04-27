import { getBetterAuthToken } from "../../../../../src/auth";
import { getDB } from "../../../db";

export function getFirestore(app) {
    // app is just {} having baseUrl and getAuthToken
    return getDB({
        baseUrl: app.baseUrl + '/db',
        getAuthToken: getBetterAuthToken,
    });
}

export function collection(db, collectionName) {
    return db.collection(collectionName);
}

export async function getDocs(collOrQuery) {
    // collOrQuery both have get() method
    return await collOrQuery.get();
}

export function doc(coll, id) {
    return coll.doc(id);
}

export async function getDoc(coll, id) {
    return await doc(id).get();
}

export async function addDoc(coll, data) {
    return await coll.add(data);
}

export async function setDoc(doc, data) {
    return await doc.set(data, { merge: true });
}

export function query(coll, ...filters) {
    let q = coll;
    for (let f of filters) {
        if (f.name === 'where') {
            q = q.where(...f.filter);
        } else if (f.name === 'orderBy') {
            q = q.orderBy(...f.orderBy)
        }
    }
    return q;
}

export function where(key, op, value) {
    this.filter = [key, op, value];
    return this;
}

export function orderBy(key, dir = 'asc') {
    this.orderBy = [key, dir];
    return this;
}

export function onSnapshot(docOrQuery, callback) {
    return docOrQuery.onSnapshot(callback);
}
