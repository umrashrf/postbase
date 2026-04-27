import { createClientStorage } from "../../storage";

export function getStorage(app) {
    // app is just {} having baseUrl and getAuthToken
    return createClientStorage({
        baseUrl: app.baseUrl + '/storage',
        getAuthToken: app.getAuthToken,
    });
}
