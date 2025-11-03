import { useState } from 'preact/hooks';
import { signUp, signIn, signOut } from '../auth';

export default function AuthPanel({ user }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const loginWithGoogle = async () => {
        alert("Finish setting up Sign in with Google. Learn more at https://www.better-auth.com/docs/authentication/google")
        await signIn.social({
            provider: "google",
            callbackURL: import.meta.env.VITE_FRONTEND_URL + '/dashboard'
        });
    };

    return (
        <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold">Account</h3>
            {!user ? (
                <div className="mt-3 space-y-3">
                    <button onClick={loginWithGoogle} className="w-full bg-red-600 text-white py-2 rounded">Sign in with Google</button>

                    <div className="flex gap-2">
                        <input className="flex-1 border p-2 rounded" type="text" placeholder="email" value={email} onInput={e => setEmail(e.target.value)} />
                        <input className="flex-1 border p-2 rounded" type="password" placeholder="password" value={password} onInput={e => setPassword(e.target.value)} />
                    </div>

                    <div className="flex gap-2">
                        <button className="px-3 py-2 border rounded"
                            onClick={async () => {
                                alert("Setup PostgreSQL (migration, connection string). Learn more at https://www.better-auth.com/docs/installation#create-database-tables");
                                await signUp.email(
                                    { email, password, name: email.split('@', 1)[0], callbackURL: "/dashboard" },
                                    {
                                        onRequest: (ctx) => {
                                            //show loading
                                        },
                                        onSuccess: (ctx) => {
                                            //redirect to the dashboard or sign in page
                                            window.location = import.meta.env.VITE_FRONTEND_URL;
                                        },
                                        onError: (ctx) => {
                                            // display the error message
                                            console.error('Sign up failed', ctx);
                                            alert('Sign up failed');
                                        },
                                    });
                            }}>
                            Sign up
                        </button>
                        <button className="px-3 py-2 border rounded"
                            onClick={async () => {
                                alert("Setup PostgreSQL (migration, connection string). Learn more at https://www.better-auth.com/docs/installation#create-database-tables");
                                await signIn.email({ email, password, callbackURL: '/dashboard' });
                            }}>
                            Login
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mt-3">
                    <div className="flex items-center gap-3">
                        <img src={user.image} className="w-10 h-10 rounded-full" />
                        <div>
                            <div className="font-medium">{user.name || user.email}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                        <a href="/dashboard" className="px-3 py-2 border rounded">Dashboard</a>
                        <a href="/billing" className="px-3 py-2 border rounded">Billing</a>
                        <button onClick={() => signOut({
                            fetchOptions: {
                                onSuccess: () => {
                                    location.href = import.meta.env.VITE_FRONTEND_URL;
                                },
                            },
                        })} className="px-3 py-2 border rounded cursor-pointer">Logout</button>
                    </div>
                </div>
            )}
        </div>
    );
}
