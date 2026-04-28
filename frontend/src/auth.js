import { createAuthClient as createBetterAuthClient } from 'better-auth/client';
import { phoneNumberClient } from "better-auth/client/plugins"
import { createAuthClient } from '../lib/postbase/auth';
import { createFirebaseAuthClient } from '../lib/postbase/compat/firebase/auth';

export const betterAuthClient = createBetterAuthClient({
    baseURL: import.meta.env.VITE_API_BASE + '/auth', // Specify if on a different domain/path,
    plugins: [
        phoneNumberClient()
    ]
});

export const postbaseAuthClient = createAuthClient(betterAuthClient);

// better-auth
export const {
    signUp,
    signIn,
    signOut: _signOut,
    getSession,
    sendVerificationEmail,
    requestPasswordReset,
    resetPassword,
    phoneNumber,
    deleteUser,
} = betterAuthClient;

// rename to logOut because firebase has reserved signOut
export const logout = async (...args) => {
    const authToken = window.sessionStorage.getItem('authToken');
    if (authToken) {
        window.sessionStorage.removeItem('authToken');
    }
    // at the end because it can trigger navigation
    await _signOut(...args);
};

// firebase auth
export const getAuth = () => postbaseAuthClient;
export const { getBetterAuthToken } = postbaseAuthClient;

export const {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    updateProfile,
    updateEmail,
    updatePassword,
    onAuthStateChanged,
    signOut,
} = createFirebaseAuthClient(postbaseAuthClient);
