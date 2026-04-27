import { initializeApp } from "../lib/postbase/compat/firebase/app";
import { getDatabase } from "../lib/postbase/compat/firebase/database";
import { getFirestore } from "../lib/postbase/compat/firebase/firestore/lite";
import { getStorage } from "../lib/postbase/compat/firebase/storage";
import { getBetterAuthToken } from "./auth";

const firebaseConfig = {
    baseUrl: import.meta.env.VITE_API_BASE,
    getAuthToken: getBetterAuthToken,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdbClient = getDatabase(app);
