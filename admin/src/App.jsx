import { useEffect, useState } from 'preact/hooks';
import { Router } from 'preact-router';
import Header from './components/Header';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { getSession } from './auth';
import Users from './pages/authentication/Users';
import Database from './pages/firestore/Database';
import Files from './pages/storage/files';

export default function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        (async () => {
            const { data } = await getSession();
            if (data && data.hasOwnProperty('user')) {
                setUser(data.user);
            }
        })();
    }, []);

    return (
        <div className="bg-[#131312] text-white">
            <div class="flex">
                <Header user={user} />

                <div class="w-full">
                    <Router>
                        <Home path="/" user={user} />
                        <Dashboard path="/dashboard" user={user} />
                        <Login path="/login" user={user} />
                        <Users path="/project/0/authentication/users" user={user} />
                        <Database path="/project/0/firestore/databases/-default-/data" user={user} />
                        <Files path="/project/0/storage" user={user} />
                    </Router>

                    <footer className="bg-[#131312] text-white py-6">
                        <div className="container mx-auto text-center text-sm">
                            © {new Date().getFullYear()} Postbase Demo
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}
