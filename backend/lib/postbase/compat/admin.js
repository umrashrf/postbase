// Backward compatability with admin firebase

import { makePostbaseAdminClient } from '../adminClient.js';

export function createAdminClient(
    {
        authClient = null,
        pool = null,
    } = {}) {
    return {
        auth: () => {
            if (!authClient) throw new Error("authClient is missing. please check postbase/backend/auth.js");
            return {
                getUser: async (userId) => {
                    const { data: user, error } = await authClient.admin.getUser({ userId });
                    const userObj = {
                        ...user,
                        displayName: user.name,
                    };
                    return userObj;
                },
                // TODO
                // deleteUser: async (uidToDelete) => {
                //     const { data: user, error } = await authClient.admin.removeUser({
                //         userId: uidToDelete,
                //     });
                //     if (error) {
                //         throw error;
                //     }
                //     const userObj = {
                //         ...user,
                //         displayName: user.name,
                //     };
                //     return userObj;
                // },
            };
        },
        firestore: () => {
            if (!pool) throw new Error("pool is missing. please check postbase/backend/app.js or use createPool from backend/lib/postbase/db.js");
            const db = makePostbaseAdminClient({ pool });
            return db;
        },
    };
}
