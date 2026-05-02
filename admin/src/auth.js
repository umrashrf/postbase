import { createAuthClient } from 'better-auth/client';
import { adminClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_API_BASE + '/auth', // Specify if on a different domain/path,
    plugins: [
        adminClient()
    ],
});

export const { signUp, signIn, signOut, getSession } = authClient;
