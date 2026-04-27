/**
 * A wrapper around better-auth/client's createAuthClient
 * that adds Firebase-like helpers:
 * - onAuthStateChanged(callback)
 * - getIdToken()
 * - currentUser
 */
export function createAuthClient(betterAuthClient) {
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
            const { data } = await betterAuthClient.getSession();
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
            const { data } = await betterAuthClient.getSession();
            const newUser = data?.user ?? null;
            if (newUser) {
                newUser.uid = newUser.id;
            }
            currentUser = newUser;
            if (currentUser) {
                currentUser.getIdToken = getIdToken;
            }
            try {
                callback(newUser);
            } catch (err) {
                console.error("Error in onAuthStateChanged listener:", err);
            }
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
        const { data } = await betterAuthClient.getSession();
        const token =
            data?.session?.token ?? data?.session?.token ?? null;
        return token;
    }

    async function getBetterAuthToken() {
        const authToken = window.sessionStorage.getItem('authToken');
        if (authToken) {
            return authToken;
        }
        const { data } = await betterAuthClient.getSession();
        if (data && data.hasOwnProperty('session') && data.session?.token) {
            window.sessionStorage.setItem('authToken', data.session?.token);
            return data.session?.token;
        }
        return null;
    }

    const signOut = (...args) => {
        const authToken = window.sessionStorage.getItem('authToken');
        if (authToken) {
            window.sessionStorage.removeItem('authToken');
        }
        // at the end because it can trigger navigation
        betterAuthClient.signOut.apply(this, ...args);
    }

    // Return wrapped client with added helpers and dynamic currentUser getter
    return {
        ...betterAuthClient,

        /**
         * Returns the most recent known user (Firebase-like).
         * This does not fetch the server — it reflects the last known session state.
         */
        get currentUser() {
            return currentUser;
        },

        onAuthStateChanged,
        getBetterAuthToken,
        signOut,
    };
}
