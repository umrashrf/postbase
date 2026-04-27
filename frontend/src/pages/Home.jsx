import AuthPanel from '../components/AuthPanel';

export default function Home({ user }) {
    return (
        <main className="text-gray-800">
            {/* HERO */}
            <section className="bg-gradient-to-br from-blue-50 to-white pt-24 pb-32">
                <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10">
                    <div>
                        <h1 className="text-5xl font-extrabold leading-tight text-gray-900">
                            Backend ❤️<br />
                            <span className="text-blue-600">that just works.</span>
                        </h1>
                        <p className="mt-5 text-lg text-gray-600 max-w-lg">
                            Self Hosted Firebase/Supabase Alternative using Node.js, Express.js, BetterAuth and PostgreSQL (JSONB)
                        </p>
                        <p className="mt-6 text-2xl">
                            Firebase 💔 | Supabase 💔 | Postbase ❤️
                        </p>

                        <div className="mt-8 flex gap-4">
                            <a href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium shadow hover:bg-blue-700 transition">Login with BetterAuth</a>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 relative">
                        <div className="bg-gray-900 text-green-400 font-mono text-sm rounded-lg shadow-lg p-6 overflow-x-auto">
                            <code className="block whitespace-pre overflow-x-scroll">{
                                `import { getBetterAuthToken } from "./auth";
import { getDB } from "../lib/postbase/db";

export const db = getDB({
    baseUrl: import.meta.env.VITE_API_BASE + '/db',
    getAuthToken: getBetterAuthToken,
});

await db.collection('users').addDoc({ name: "Umair" });

await db.collection('users').where('name', '==', 'Umair');`
                            }</code>
                        </div>
                    </div>
                </div>
            </section>

            <section id="better-auth" className="bg-gradient-to-br from-blue-50 to-white pt-24 pb-32">
                <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10">
                    <div>
                        <h1 className="text-5xl font-extrabold leading-tight text-gray-900">
                            BetterAuth
                        </h1>
                        <p className="mt-5 text-lg text-gray-600 max-w-lg">
                            Did not reinvent the wheel
                        </p>

                        <div className="mt-8 flex gap-4">
                        </div>
                    </div>

                    <div className="relative">
                        <div className="bg-gray-900 text-green-400 font-mono text-sm rounded-lg shadow-lg p-6 overflow-x-auto">
                            <code className="block whitespace-pre overflow-x-scroll">{
                                `import { 
    getAuth,
    signInWithEmailAndPassword,
    signOut,
} from "./auth";

const auth = getAuth();

const userCredential = await signInWithEmailAndPassword(auth, 'email', 'password');

await signOut(auth);`
                            }</code>
                        </div>
                    </div>
                </div>
            </section>

            <section id="familiar-api" className="bg-gradient-to-br from-blue-50 to-white pt-24 pb-32">
                <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10">
                    <div>
                        <h1 className="text-5xl font-extrabold leading-tight text-gray-900">
                            Familiar API
                        </h1>
                        <p className="mt-5 text-lg text-gray-600 max-w-lg">
                            Inspired by Firebase's API
                        </p>

                        <div className="mt-8 flex gap-4">
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 relative">
                        <div className="bg-gray-900 text-green-400 font-mono text-sm rounded-lg shadow-lg p-6 overflow-x-auto">
                            <code className="block whitespace-pre overflow-x-scroll">{
                                `import { db } from "./postbase";

await db.collection('users').addDoc({ name: "Umair" });

await db.collection('users').where('name', '==', 'Umair');

await db.collection('users').doc('docId').get();
`
                            }</code>
                        </div>
                        <div className="bg-gray-900 text-green-400 font-mono text-sm rounded-lg shadow-lg p-6 overflow-x-auto">
                            <pre>
                                <code className="block whitespace-pre overflow-x-scroll">{
                                    `import { getBetterAuthToken } from "./auth";
import { createClientStorage } from "../lib/postbase/storage";

export const storage = createClientStorage({
    baseUrl: import.meta.env.VITE_API_BASE + '/storage',
    getAuthToken: getBetterAuthToken,
});

const profilePicFile = new File(...); // HTMLFileInput

const fileRef = storage.ref('path/to/directory/' + profilePicFile.name);

const remoteFile = await fileRef.put(profilePicFile);

const profileUrl = await remoteFile.ref.getDownloadURL();`
                                }</code>
                            </pre>
                        </div>
                        <div className="bg-gray-900 text-green-400 font-mono text-sm rounded-lg shadow-lg p-6 overflow-x-auto">
                            <code className="block whitespace-pre overflow-x-scroll">{
                                `import { getBetterAuthToken } from "./auth";
import { RtdbClient } from '../lib/postbase/rtdb';

export const rtdbClient = new RtdbClient({
    restUrl: import.meta.env.VITE_API_BASE,
    wsUrl: import.meta.env.VITE_API_BASE.replace('https://', 'wss://'),
});`
                            }</code>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="why" className="bg-white py-24">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-12 text-gray-900">Why Postbase?</h2>
                    <div className="grid md:grid-cols-3 gap-10">
                        {[
                            {
                                title: "Self Hosted",
                                desc: "Based on mostly open source easily installable projects",
                                icon: "🧩"
                            },
                            {
                                title: "Cost Effective",
                                desc: "Avoid surprise cloud charges",
                                icon: "💳"
                            },
                            {
                                title: "Scalable",
                                desc: "Scale to millions of requests per day — no rate limits on your growth.",
                                icon: "⚡"
                            },

                        ].map(f => (
                            <div key={f.title} className="bg-gray-50 border rounded-lg p-8 shadow-sm hover:shadow transition">
                                <div className="text-4xl mb-3">{f.icon}</div>
                                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                                <p className="text-gray-600">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AUTH (optional section near footer) */}
            <section className="bg-gray-50 py-16">
                <div className="max-w-lg mx-auto px-6">
                    <AuthPanel user={user} />
                </div>
            </section>
        </main>
    );
}
