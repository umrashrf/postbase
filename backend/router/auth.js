import { betterAuth } from "better-auth";
import { createPool } from "../lib/postbase/db";
//import { phoneNumber } from "better-auth/plugins"
//import { makePostbaseAdminClient } from "./lib/postbase/adminClient.js";

const pool = createPool({
    connectionString: process.env.DATABASE_URL
});

// Enable if required
//const db = makePostbaseAdminClient({ pool });

export const auth = betterAuth({
    // Following is only needed for local testing
    // You can avoid this by using /etc/hosts and nginx servers
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
    database: pool,
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url, token }, request) => {
            // await sendEmail({
            //     to: user.email,
            //     subject: "Reset your password",
            //     text: `Click the link to reset your password: ${url}`,
            // });
        },
        // onPasswordReset: async ({ user }, request) => {
        //     // your logic here
        //     console.log(`Password for user ${user.email} has been reset.`);
        // },
    },
    // emailVerification: {
    //     sendVerificationEmail: async ({ user, url }) => {
    //         // Send email using third-party APIs or your own SMTP server
    //         await sendEmail({
    //             to: user.email,
    //             subject: "Verify your email address",
    //             text: `Click the link to verify your email: ${url}`,
    //         });
    //     },
    //     sendOnSignIn: true,
    // },
    socialProviders: {
        // Enable following for Sign in with Google
        // google: {
        //     prompt: "select_account",
        //     clientId: process.env.GOOGLE_CLIENT_ID,
        //     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // },
    },
    user: {
        deleteUser: {
            enabled: true, // this is required to delete the user
            beforeDelete: async (user) => {
                // Optionally delete relevant relation if you were storing any
                // try {
                //     await db.collection('users').doc(user.id).delete();
                // } catch (err) {
                //     console.error('Error cleaning up users', err);
                // }
            },
        }
    },
    plugins: [
        // phoneNumber({
        //     sendOTP: ({ phoneNumber, code }, request) => {
        //         // Implement sending OTP code via SMS
        //     }
        // })
    ]
});
