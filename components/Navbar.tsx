import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ethers } from 'ethers';

const Navbar = () => {
    const { data: session } = useSession();
    const [account, setAccount] = useState<string | null>(null);

    useEffect(() => {
        const checkWalletConnection = async () => {
            if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const accounts = await provider.listAccounts();
                    if (accounts.length > 0) {
                        setAccount(accounts[0].address);
                    }
                } catch (error) {
                    console.error('Error checking wallet connection:', error);
                }
            }
        };
        checkWalletConnection();
    }, []);

    return (
        <nav className="bg-gray-800 p-4 flex justify-between items-center">
            <div className="text-white">Decentralized Lending DApp</div>
            <div className="flex items-center ml-auto space-x-4">
                <Link href="/" legacyBehavior>
                    <a className="text-white">Home</a>
                </Link>
                {session && (
                    <>
                        {session.user.type === 'Lender' && (
                            <Link href="/Lenders">
                                <a className="text-white">Lender Section</a>
                            </Link>
                        )}
                        <div className="text-white">
                            {account ? (
                                <span className="block text-sm">{account}</span>
                            ) : (
                                <span className="block text-sm">No Wallet Connected</span>
                            )}
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600"
                        >
                            Logout
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;