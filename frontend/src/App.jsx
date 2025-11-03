import { useEffect, useState } from 'preact/hooks';
import { Router } from 'preact-router';
import Header from './components/Header';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { getSession } from './auth';

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
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <Header user={user} />

            <Router>
                <Home path="/" user={user} />
                <Dashboard path="/dashboard" user={user} />
                <Login path="/login" user={user} />
            </Router>

            <footer className="bg-white border-t py-6 mt-10">
                <div className="container mx-auto text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} Postbase Demo
                </div>
            </footer>
        </div>
    );
}
