import { useState, useEffect } from 'preact/hooks';
import { signOut } from '../auth';

export default function Header({ user }) {
    const [menu, setMenu] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header className={`max-w-[50px] md:max-w-[200px] min-h-screen z-40 transition-all bg-[#212020] text-white ${scrolled ? 'shadow' : ''} backdrop-blur`}>
            <div className="max-w-6xl mx-auto px-2 md:px-4 py-4 flex gap-8 flex-col justify-between">
                <a href="/" className="text-2xl font-extrabold">
                    <img src="/assets/img/icon-transparent.png" class="max-w-[40px] md:w-auto" />
                    <span class="hidden md:inline">Postbase Admin</span>
                </a>
                <nav className="flex flex-col gap-2 text-sm font-medium">
                    <a href="/project/0/authentication/users" className="hover:text-blue-600">
                        <span class="md:hidden">Auth</span>
                        <span class="hidden md:inline">Authentication</span>
                    </a>
                    <a href="/project/0/firestore/databases/-default-/data" className="hover:text-blue-600">
                        <span class="md:hidden">DB</span>
                        <span class="hidden md:inline">Firestore</span>
                    </a>
                    <a href="/project/0/storage" className="hover:text-blue-600">
                        <span class="md:hidden">Store</span>
                        <span class="hidden md:inline">Storage</span>
                    </a>
                </nav>

                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="relative">
                            <button onClick={() => setMenu(!menu)} className="flex items-center gap-2 px-3 py-1 border rounded-md hover:bg-gray-50">
                                <img src={user.image} className="w-8 h-8 rounded-full" alt="profile" />
                                <span className="hidden sm:inline text-sm">{user.name || user.email}</span>
                            </button>
                            {menu && (
                                <div className="absolute right-0 mt-2 bg-white border rounded-md shadow-lg w-48 z-50">
                                    <a href="/dashboard" className="block px-4 py-2 hover:bg-gray-50">Dashboard</a>
                                    <a href="/billing" className="block px-4 py-2 hover:bg-gray-50">Billing</a>
                                    <button onClick={() => signOut({
                                        fetchOptions: {
                                            onSuccess: () => {
                                                location.href = import.meta.env.VITE_FRONTEND_URL;
                                            },
                                        },
                                    })} className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer">Logout</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <a href="/login" className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition">
                            <span class="md:hidden">&gt;</span>
                            <span class="hidden md:inline">Sign In</span>
                        </a>
                    )}
                </div>
            </div>
        </header>
    );
}
