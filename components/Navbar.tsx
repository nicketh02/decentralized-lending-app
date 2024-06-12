import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession, signOut, signIn } from 'next-auth/react';
import { ethers } from 'ethers';

const Navbar = () => {
    const { data: session, status } = useSession();
    const [account, setAccount] = useState<string | null>(null);

    useEffect(() => {
        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0) {
                setAccount(null);
            } else {
                setAccount(accounts[0]);
            }
        };

        const checkWalletConnection = async () => {
            if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const accounts = await provider.listAccounts();
                    if (accounts.length > 0) {
                        setAccount(accounts[0].address);
                    }
                    window.ethereum.on('accountsChanged', handleAccountsChanged);
                } catch (error) {
                    console.error('Error checking wallet connection:', error);
                }
            }
        };

        checkWalletConnection();

        return () => {
            if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        };
    }, []);

    if (status === "loading") {
        return <div className="flex items-center justify-center min-h-screen text-lg">Loading...</div>;
    }

    const userType = session?.user?.type;

    return (
        <nav className="bg-gray-800 p-4 flex justify-between items-center">
            <Link href="/" legacyBehavior>
                <a className="text-white">Decentralized Lending DApp</a>
            </Link>
            <div className="flex items-center ml-auto space-x-4">
                <Link href="/dashboard" legacyBehavior>
                    <a className="text-white">Dashboard</a>
                </Link>
                {account && (
                    <div className="text-white">
                        <span className="block text-sm">{account}</span>
                    </div>
                )}
                {session ? (
                    <button
                        onClick={() => signOut()}
                        className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600"
                    >
                        Logout
                    </button>
                ) : (
                    <button
                        onClick={() => signIn()}
                        className="bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600"
                    >
                        Login
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
