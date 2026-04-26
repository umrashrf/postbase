import { createAuthClient as createBetterAuthClient } from 'better-auth/client';
import { createAuthClient } from '../lib/postbase/auth';
import { auth as firebaseAuth } from '../lib/postbase/compat/firebase/auth';

export const authClient = createBetterAuthClient({
    baseURL: import.meta.env.VITE_API_BASE + '/auth', // Specify if on a different domain/path,
});

export const auth = createAuthClient(authClient);

export async function getBetterAuthToken() {
    const authToken = window.sessionStorage.getItem('authToken');
    if (authToken) {
        return authToken;
    }
    const { data } = await authClient.getSession();
    if (data && data.hasOwnProperty('session') && data.session?.token) {
        window.sessionStorage.setItem('authToken', data.session?.token);
        return data.session?.token;
    }
    return null;
}

// better-auth
export const {
    signUp,
    signIn,
    signOut: _signOut,
    getSession,
} = authClient;

export const signOut = (...args) => {
    const authToken = window.sessionStorage.getItem('authToken');
    if (authToken) {
        window.sessionStorage.removeItem('authToken');
    }
    // at the end because it can trigger navigation
    _signOut.apply(this, ...args);
};

// firebase auth
export const {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    updateProfile,
    updateEmail,
    updatePassword,
    sendPasswordResetEmail,
} = firebaseAuth(auth);

// firebase auth + better-auth
export const onAuthStateChanged = auth.onAuthStateChanged;
