/**
 * A wrapper around better-auth/client's createAuthClient
 * that adds Firebase-like helpers:
 * - onAuthStateChanged(callback)
 * - getIdToken()
 * - currentUser
 */
export function createAuthClient(auth) {
    // Track current user state
    let currentUser = null;
    const subscribers = new Set();

    function notifySubscribers(user) {
        for (const cb of subscribers) {
            try {
                cb(user);
            } catch (err) {
                console.error("Error in onAuthStateChanged listener:", err);
            }
        }
    }

    // Poll for session changes (adjust interval as needed)
    async function checkSession() {
        try {
            const { data } = await auth.getSession();
            const newUser = data?.user ?? null;
            if (newUser) {
                newUser.uid = newUser.id;
            }

            if (JSON.stringify(newUser) !== JSON.stringify(currentUser)) {
                currentUser = newUser;
                if (currentUser) {
                    currentUser.getIdToken = getIdToken;
                }
                notifySubscribers(currentUser);
            }
        } catch (err) {
            console.error("Error checking session:", err);
        }
    }

    // Simple polling loop (every 5 seconds by default)
    const POLL_INTERVAL = 5000;
    let pollTimer = setInterval(checkSession, POLL_INTERVAL);

    /**
     * Adds a listener for auth state changes.
     * Returns an unsubscribe function (for React/Preact useEffect cleanup).
     */
    function onAuthStateChanged(callback) {
        subscribers.add(callback);

        // Immediately invoke with current user
        (async () => {
            const { data } = await auth.getSession();
            const newUser = data?.user ?? null;
            if (newUser) {
                newUser.uid = newUser.id;
            }
            if (JSON.stringify(newUser) !== JSON.stringify(currentUser)) {
                currentUser = newUser;
                if (currentUser) {
                    currentUser.getIdToken = getIdToken;
                }
                notifySubscribers(currentUser);
            }
            callback(currentUser);
        })();

        // Return unsubscribe
        return () => {
            subscribers.delete(callback);
            if (subscribers.size === 0) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
        };
    }

    /**
     * Firebase-like getIdToken() equivalent.
     * Returns the current access token (JWT) if a session exists.
     */
    async function getIdToken(refresh = false) {
        const { data } = await auth.getSession();
        const token =
            data?.session?.token ?? data?.session?.token ?? null;
        return token;
    }

    // Return wrapped client with added helpers and dynamic currentUser getter
    return {
        ...auth,

        /**
         * Returns the most recent known user (Firebase-like).
         * This does not fetch the server — it reflects the last known session state.
         */
        get currentUser() {
            return currentUser;
        },

        onAuthStateChanged,
    };
}
