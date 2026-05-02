import { h } from 'preact';
import AuthPanel from '../components/AuthPanel';

export default function Login({ user }) {
    return (
        <div className="container mx-auto py-10">
            <AuthPanel user={user} />
        </div>
    );
}
