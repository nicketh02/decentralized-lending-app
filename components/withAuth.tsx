import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';

const withAuth = (WrappedComponent: any) => {
    const AuthComponent = (props: any) => {
        const { data: session, status } = useSession();
        const [account, setAccount] = useState<string | null>(null);
        const router = useRouter();

        useEffect(() => {
            if (status === 'loading') return; // Wait for session to load
            if (!session) {
                router.push('/auth/signin');
            } else {
                checkWalletConnection();
                setupEventListeners();
            }

            // Cleanup event listeners on component unmount
            return () => {
                removeEventListeners();
            };
        }, [session, status, router]);

        const checkWalletConnection = async () => {
            if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const accounts = await provider.listAccounts();
                    if (accounts.length > 0) {
                        setAccount(accounts[0].address);
                    } else {
                        router.push('/auth/wallet-connect');
                    }
                } catch (error) {
                    console.error('Error checking wallet connection:', error);
                }
            } else {
                console.log('MetaMask is not installed');
            }
        };

        const setupEventListeners = () => {
            if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('disconnect', handleDisconnect);
            }
        };

        const removeEventListeners = () => {
            if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('disconnect', handleDisconnect);
            }
        };

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0) {
                // MetaMask is locked or the user has not connected any accounts
                console.log('Please connect to MetaMask.');
                setAccount(null);
                router.push('/auth/wallet-connect');
            } else if (accounts[0] !== account) {
                setAccount(accounts[0]);
            }
        };

        const handleDisconnect = () => {
            console.log('MetaMask disconnected.');
            setAccount(null);
            router.push('/auth/wallet-connect');
        };

        if (status === 'loading' || !account) {
            return <div className="flex items-center justify-center min-h-screen text-lg">Loading...</div>;
        }

        return <WrappedComponent {...props} account={account} />;
    };

    AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return AuthComponent;
};

export default withAuth;
