import { createAuthClient } from '../lib/postbase/auth';

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_API_BASE + '/auth', // Specify if on a different domain/path,
});

export const { signUp, signIn, signOut, getSession } = authClient;
