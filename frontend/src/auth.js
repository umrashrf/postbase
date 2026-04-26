import { createAuthClient as createBetterAuthClient } from 'better-auth/client';
import { createAuthClient } from '../lib/postbase/auth';
import { auth as firebaseAuth } from '../lib/postbase/compat/firebase/auth';

export const betterAuthClient = createBetterAuthClient({
    baseURL: import.meta.env.VITE_API_BASE + '/auth', // Specify if on a different domain/path,
});

export const postbaseAuthClient = createAuthClient(betterAuthClient);

// better-auth
export const {
    signUp,
    signIn,
    signOut: _signOut,
    getSession,
} = betterAuthClient;

// firebase auth
export const getAuth = postbaseAuthClient;
export const {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    updateProfile,
    updateEmail,
    updatePassword,
} = firebaseAuth(postbaseAuthClient);

// firebase auth + better-auth
export const onAuthStateChanged = postbaseAuthClient.onAuthStateChanged;
export const getBetterAuthToken = postbaseAuthClient.getBetterAuthToken;
export const signOut = postbaseAuthClient.signOut;

