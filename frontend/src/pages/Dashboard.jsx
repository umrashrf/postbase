import { h } from 'preact';

export default function Dashboard({ user }) {
    if (!user) {
        return (
            <div className="container mx-auto py-10 text-center">
                <p className="text-gray-600">Please sign in to view your dashboard.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
        </div>
    );
}
