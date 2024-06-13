import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [address, setAddress] = useState('');
    const [type, setType] = useState('borrower'); // Default to borrower
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, address, type }),
        });

        const data = await res.json();

        if (res.status === 201) {
            setSuccess('Account successfully created! Redirecting to sign in...');
            setTimeout(() => {
                router.push('/auth/signin');
            }, 2000);
        } else {
            setError(data.error);
        }
    };

    return (
        <Layout>
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                    <h1 className="text-3xl font-bold mb-6 text-center">Sign Up</h1>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-700">Email:</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700">Password:</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700">Address:</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Type:</label>
                            <div className="flex space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="borrower"
                                        checked={type === 'borrower'}
                                        onChange={(e) => setType(e.target.value)}
                                        className="form-radio"
                                    />
                                    <span className="ml-2 text-gray-700">Borrower</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="lender"
                                        checked={type === 'lender'}
                                        onChange={(e) => setType(e.target.value)}
                                        className="form-radio"
                                    />
                                    <span className="ml-2 text-gray-700">Lender</span>
                                </label>
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">
                            Sign Up
                        </button>
                    </form>
                    {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
                    {success && <p className="text-green-500 mt-4 text-center">{success}</p>}
                </div>
            </div>
        </Layout>
    );
}
