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

export function query(coll, where) {
    return coll.where(...where);
}

export function where(key, op, value) {
    return [key, op, value];
}
