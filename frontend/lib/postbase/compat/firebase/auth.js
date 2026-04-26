//import { createAuthClient } from '../../auth';

export function createFirebaseAuthClient(postbaseAuthClientWithBetterAuthFunctions) {
    // if (!(auth instanceof createAuthClient)) {
    //     throw new Error("");
    // }

    const createUserWithEmailAndPassword = async (auth, email, password, name = null) => {
        try {
            // better-auth requires name whereas firebase auth doesn't
            let _name = name;
            if (!_name) {
                _name = email.split('@')[0];
            }

            await auth.signUp.email({
                email,
                password,
                name,
                //callbackURL: "/dashboard",
            });

            const { data } = await auth.getSession();
            const user = data?.user ?? null;

            const userCredential = { user };

            return userCredential;

        } catch (err) {
            throw {
                code: '500',
                message: err.message,
            };
        }
    };

    const signInWithEmailAndPassword = async (auth, email, password) => {
        try {
            await auth.signIn.email({
                email,
                password,
                //callbackURL: '/dashboard',
            });

            const { data } = await auth.getSession();
            const user = data?.user ?? null;

            const userCredential = { user };

            return userCredential;

        } catch (err) {
            throw {
                code: '500',
                message: err.message,
            };
        }
    };

    const sendEmailVerification = async (currentUser) => {
        /** // Must have following function on the server: 
         *  // https://better-auth.com/docs/concepts/email
         *  import { betterAuth } from 'better-auth';
            import { sendEmail } from './email'; // your email sending function
            export const auth = betterAuth({
                emailVerification: {
                    sendVerificationEmail: async ({ user, url, token }, request) => {
                        void sendEmail({
                            to: user.email,
                            subject: 'Verify your email address',
                            text: `Click the link to verify your email: ${url}`
                        })
                    }
                }
            })
        */
        await postbaseAuthClientWithBetterAuthFunctions.sendVerificationEmail({
            email: currentUser.email
        });
    };

    const updateProfile = async () => { };

    const updateEmail = async () => { };

    const updatePassword = async () => { };

    const sendPasswordResetEmail = async (auth, email) => {
        await auth.requestPasswordReset({
            email,
        });

    };

    const signOut = async (auth) => {
        const authToken = window.sessionStorage.getItem('authToken');
        if (authToken) {
            window.sessionStorage.removeItem('authToken');
        }
        // at the end because it can trigger navigation
        auth.signOut.apply(this, []);
    };

    return {
        createUserWithEmailAndPassword,
        sendEmailVerification,
        sendPasswordResetEmail,
        signInWithEmailAndPassword,
        updateProfile,
        updateEmail,
        updatePassword,
        signOut,
    };
}