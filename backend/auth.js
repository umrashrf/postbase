import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
    // Following is only needed for local testing
    // baseURL: 'http://localhost:8081',
    // trustedOrigins: ["http://localhost:8080"],
    // advanced: {
    //     defaultCookieAttributes: {
    //         sameSite: "none",
    //         secure: true,
    //         httpOnly: true,
    //     },
    //     crossSubDomainCookies: {
    //         enabled: true,
    //         domain: "localhost",
    //     },
    // },
    database: new Pool({
        connectionString: process.env.POSTGRES_CONNECTION_STRING,
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        // Enable following for Sign in with Google
        // google: {
        //     prompt: "select_account",
        //     clientId: process.env.GOOGLE_CLIENT_ID,
        //     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // },
    },
});
