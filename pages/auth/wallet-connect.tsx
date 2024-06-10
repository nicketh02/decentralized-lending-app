import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { ethers, JsonRpcSigner } from 'ethers';

export default function WalletConnect() {
    const { data: session, status } = useSession();
    const [account, setAccount] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        console.log('Session status:', status);
        if (status === 'loading') {
            // Wait for session to load
            return;
        }
        if (!session) {
            console.log('No session found, redirecting to signin');
            router.push('/auth/signin');
        } else {
            console.log('Session found:', session);
            checkWalletConnection();
        }
    }, [session, status, router]); // Add `router` to the dependency array

    useEffect(() => {
        if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length === 0) {
                    // MetaMask is locked or the user has not connected any accounts
                    console.log('Please connect to MetaMask.');
                    setAccount(null);
                } else if (accounts[0] !== account) {
                    setAccount(accounts[0]);
                }
            };

            const handleDisconnect = () => {
                console.log('MetaMask disconnected.');
                setAccount(null);
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('disconnect', handleDisconnect);

            // Cleanup the event listeners on component unmount
            return () => {
                if (window.ethereum.removeListener) {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    window.ethereum.removeListener('disconnect', handleDisconnect);
                }
            };
        }
    }, [account]);

    const checkWalletConnection = async () => {
        if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts: JsonRpcSigner[] = await provider.listAccounts();
                if (accounts.length > 0) {
                    setAccount(accounts[0].address);
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
            }
        } else {
            console.log('MetaMask is not installed');
        }
    };

    const connectWallet = async () => {
        if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                checkWalletConnection();
            } catch (error) {
                console.error('User denied account access:', error);
            }
        } else {
            console.log('MetaMask is not installed');
        }
    };

    if (status === 'loading') {
        return <div className="flex items-center justify-center min-h-screen text-lg">Loading...</div>;
    }

    if (!session) return null;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
                <h1 className="text-3xl font-bold mb-6">Welcome, {session.user?.email}</h1>
                {account ? (
                    <>
                        <p className="text-lg text-gray-700 mb-6 break-all">Connected account: {account}</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 mb-4"
                        >
                            Go to Dashboard
                        </button>
                    </>
                ) : (
                    <button
                        onClick={connectWallet}
                        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 mb-4"
                    >
                        Connect Wallet
                    </button>
                )}
                <button
                    onClick={() => signOut()}
                    className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600"
                >
                    Sign out
                </button>
            </div>
        </div>
    );
}
