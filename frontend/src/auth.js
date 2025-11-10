import { createAuthClient as createBetterAuthClient } from 'better-auth/client';
import { createAuthClient } from '../lib/postbase/auth';

export const authClient = createBetterAuthClient({
    baseURL: import.meta.env.VITE_API_BASE + '/auth', // Specify if on a different domain/path,
});

export const auth = createAuthClient(authClient);

export const { signUp, signIn, signOut, getSession } = authClient;
