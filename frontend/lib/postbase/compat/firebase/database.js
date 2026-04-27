import { RtdbClient } from "../../rtdb";

export function getDatabase(app) {
    // app is just {} having baseUrl and getAuthToken
    return new RtdbClient({
        restUrl: app.baseUrl,
        wsUrl: app.baseUrl.replace('https://', 'wss://'),
    });
}
