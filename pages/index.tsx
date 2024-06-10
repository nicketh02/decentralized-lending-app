import { useSession, signOut, signIn } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Welcome to the Decentralized Lending Marketplace</h1>
      {status === 'loading' ? (
        <p className="text-lg text-gray-600">Loading...</p>
      ) : session ? (
        <div className="text-center space-y-4">
          <p className="text-lg text-gray-700">Signed in as <span className="font-semibold">{session.user?.email}</span></p>
          <button
            onClick={() => signOut()}
            className="bg-red-500 text-white py-3 px-6 rounded-md hover:bg-red-600 text-lg"
          >
            Sign out
          </button>
          <Link href="/auth/wallet-connect" legacyBehavior>
            <a className="bg-blue-500 text-white py-3 px-6 rounded-md hover:bg-blue-600 text-lg inline-block ml-4">
              Go to Wallet Connect
            </a>
          </Link>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => signIn()}
              className="bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 text-lg"
            >
              Sign in
            </button>
            <Link href="/auth/signup" legacyBehavior>
              <a className="bg-blue-500 text-white py-3 px-6 rounded-md hover:bg-blue-600 text-lg inline-block">
                Sign up
              </a>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}