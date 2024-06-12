import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useSession } from 'next-auth/react';
import escrowABI from '../contracts/Escrow.sol/Escrow.json';
import lenderABI from '../contracts/Lender.sol/Lender.json';
import tokenABI from '../contracts/PlatformToken.sol/PlatformToken.json';

const Lenders = () => {
    const { data: session } = useSession();
    const [depositAmount, setDepositAmount] = useState('');
    const [currentDeposit, setCurrentDeposit] = useState(0);
    const [interestEarned, setInterestEarned] = useState(0);
    const [interestRate, setInterestRate] = useState(0);
    const escrowabi = escrowABI["abi"];
    const lenderabi = lenderABI["abi"];
    const tokenabi = tokenABI["abi"];
    const escrowContractAddress = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS ? process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS : "0x0";
    const tokenContractAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = provider.getSigner();

    useEffect(() => {
        if (session) {
            fetchDepositInfo();
            const interval = setInterval(fetchDepositInfo, 10000); // Refresh every 10 seconds
            return () => clearInterval(interval); // Cleanup on component unmount
        }
    }, [session]);

    const fetchDepositInfo = async () => {
        if (typeof window.ethereum !== 'undefined') {
            console.log("escrow contract address - ", escrowContractAddress)
            const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);
            console.log("escrow address - ", await escrowContract.getAddress());

            try {
                const lenderContractAddress = await escrowContract.lenderContract();
                console.log("lender contract address - ", lenderContractAddress);
                const lenderContract = new ethers.Contract(lenderContractAddress, lenderabi, await signer);
                console.log("lender address - ", await lenderContract.getAddress());

                const lenderInfo = await lenderContract.lenders((await provider.getSigner()).getAddress());
                const interest = await lenderContract.totalInterestGained((await provider.getSigner()).getAddress());
                const rate = await lenderContract.interestRate();
                console.log("total interest gained - ", interest);

                setCurrentDeposit(parseFloat(ethers.formatUnits(lenderInfo.amount, 'wei')));
                setInterestEarned(parseFloat(ethers.formatUnits(interest, 'wei')));
                setInterestRate(parseFloat(ethers.formatUnits(rate, 'wei')));
            } catch (error) {
                console.error('Error fetching deposit info:', error);
            }
        }
    };

    const handleDeposit = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);

                const tx = await escrowContract.deposit({ value: ethers.parseUnits(depositAmount, 'wei') });
                await tx.wait();
                await fetchDepositInfo();
            } catch (error) {
                console.error('Error during deposit:', error);
            }
        }
    };

    const handleWithdraw = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);

                const tx = await escrowContract.withdraw();
                await tx.wait();
                fetchDepositInfo();
            } catch (error) {
                console.error('Error during withdraw:', error);
            }
        }
    };

    if (!session) {
        return <div className="flex items-center justify-center min-h-screen text-lg">Loading...</div>;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <h2 className="text-2xl font-bold mb-4">Lender Section</h2>
            <div className="bg-white p-6 rounded shadow-md w-full max-w-4xl flex">
                <div className="w-1/2 p-4">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">Current Deposit</h3>
                        <p>{currentDeposit} Wei</p>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">Interest Earned</h3>
                        <p>{interestEarned} Wei</p>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">Interest Rate</h3>
                        <p>{interestRate / 100} %</p>
                    </div>
                </div>
                <div className="w-1/2 p-4">
                    <div className="mb-4">
                        <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="Deposit Amount in Wei"
                            className="w-full p-2 border rounded"
                        />
                        <button onClick={handleDeposit} className="mt-2 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                            Deposit
                        </button>
                    </div>
                    <div className="mb-4">
                        <button onClick={handleWithdraw} className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600">
                            Withdraw
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Lenders;
