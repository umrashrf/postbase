import { createAuthClient } from '../../auth';

export function auth(auth) {
    // if (!(auth instanceof createAuthClient)) {
    //     throw new Error("");
    // }

    const getAuth = () => {

    };

    const createUserWithEmailAndPassword = async (auth, email, password) => {
        const userCredential = {
            user: null,
        };

        // optional
        const error = {
            code: '',
            message: '',
        };

        return userCredential;
    };

    const signInWithEmailAndPassword = async () => {};

    const sendEmailVerification = async () => {};

    const updateProfile = async () => {};

    const updateEmail = async () => {};

    const updatePassword = async () => {};

    const sendPasswordResetEmail = async () => {};

    return {
        getAuth,
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        sendEmailVerification,
        updateProfile,
        updateEmail,
        updatePassword,
        sendPasswordResetEmail,
    };
}