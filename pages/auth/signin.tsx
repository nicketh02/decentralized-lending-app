import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getProviders, signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function SignIn({ providers }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Reset error message

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError(result.error);
                console.error('Error:', result.error);
            } else {
                console.log('Successfully signed in');
                console.log('Redirecting to wallet-connect page...');
                setTimeout(() => {
                    router.push('/auth/wallet-connect'); // Redirect to wallet connect page
                }, 1000); // Add a short delay before redirecting
            }
        } catch (err) {
            console.error('Sign in error:', err);
            setError('An unexpected error occurred.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-center">Sign In</h1>
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
                    <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">
                        Sign In
                    </button>
                </form>
                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
                <div className="mt-6 text-center">
                    <p className="text-gray-700">Don&#39;t have an account?</p>
                    <Link href="/auth/signup" legacyBehavior>
                        <a className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 block mt-2">
                            Sign up
                        </a>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async () => {
    const providers = await getProviders();
    return {
        props: { providers },
    };
};
