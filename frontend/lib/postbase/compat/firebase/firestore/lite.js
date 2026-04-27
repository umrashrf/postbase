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

export async function getDocs(coll) {
    return await coll.get();
}

export function doc(coll, id) {
    return coll.doc(id);
}

export async function getDoc(coll, id) {
    return await doc(id).get();
}
