import { createAuthClient } from '../../auth';

export function auth(auth) {
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

    const sendEmailVerification = async () => { };

    const updateProfile = async () => { };

    const updateEmail = async () => { };

    const updatePassword = async () => { };

    const sendPasswordResetEmail = async () => { };

    return {
        createUserWithEmailAndPassword,
        sendEmailVerification,
        sendPasswordResetEmail,
        signInWithEmailAndPassword,
        updateProfile,
        updateEmail,
        updatePassword,
    };
}