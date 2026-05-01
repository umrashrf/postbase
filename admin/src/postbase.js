import { getSession } from "./auth";
import { getDB } from "./lib/postbase";

async function getBetterAuthToken() {
    const { data } = await getSession();
    if (data && data.hasOwnProperty('session')) {
        return data.session?.token || null;
    }
    return null;
}

export const db = getDB({
    baseUrl: import.meta.env.VITE_API_BASE,
    getAuthToken: getBetterAuthToken,
});
