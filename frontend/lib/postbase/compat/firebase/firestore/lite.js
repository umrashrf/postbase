import { getDB } from "../../../db";

export function getFirestore(app) {
    // app is just {} having baseUrl and getAuthToken
    return getDB({
        baseUrl: app.baseUrl + '/db',
        getAuthToken: app.getAuthToken,
    });
}

export function collection(db, collectionName) {
    return db.collection(collectionName);
}

export async function getDocs(coll) {
    return await coll.get();
}
