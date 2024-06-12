import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useSession } from 'next-auth/react';
import escrowABI from '../contracts/Escrow.sol/Escrow.json';
import borrowerABI from '../contracts/Borrower.sol/Borrower.json';
import tokenABI from '../contracts/PlatformToken.sol/PlatformToken.json';

const Borrowers = () => {
    const { data: session } = useSession();
    const [borrowAmount, setBorrowAmount] = useState('');
    const [loanDuration, setLoanDuration] = useState('');
    const [stakeAmount, setStakeAmount] = useState(''); // New state variable for staking amount
    const [borrowerInfo, setBorrowerInfo] = useState(null);
    const [repaymentAmount, setRepaymentAmount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [canClaimCollateral, setCanClaimCollateral] = useState(false);

    const escrowabi = escrowABI["abi"];
    const borrowerabi = borrowerABI["abi"];
    const tokenabi = tokenABI["abi"];
    const escrowContractAddress = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS ? process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS : "0x0";
    const tokenContractAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS ? process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS : "0x0";
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = provider.getSigner();

    useEffect(() => {
        if (session) {
            fetchBorrowerInfo();
            const interval = setInterval(fetchBorrowerInfo, 10000); // Refresh every 10 seconds
            return () => clearInterval(interval); // Cleanup on component unmount
        }
    }, [session]);

    const fetchBorrowerInfo = async () => {
        if (typeof window.ethereum !== 'undefined') {
            const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);

            try {
                const borrowerContractAddress = await escrowContract.borrowerContract();
                const borrowerContract = new ethers.Contract(borrowerContractAddress, borrowerabi, await signer);

                const info = await borrowerContract.borrowers((await signer).getAddress());
                setBorrowerInfo(info);

                const currentTime = BigInt(Math.floor(Date.now() / 1000));
                const timeLeftToRepay = BigInt(info.loanDuration) - (currentTime - BigInt(info.borrowTime));
                setTimeLeft(Number(timeLeftToRepay));
                setCanClaimCollateral(timeLeftToRepay <= BigInt(0) && BigInt(info.repaymentAmount) > BigInt(0));
                setRepaymentAmount(parseFloat(ethers.formatUnits(info.repaymentAmount, 'wei')));
            } catch (error) {
                console.error('Error fetching borrower info:', error);
            }
        }
    };

    const handleGetTokens = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);
                const tx = await escrowContract.getTokens(ethers.parseUnits(borrowAmount, 'wei'));
                await tx.wait();
                fetchBorrowerInfo();
            } catch (error) {
                console.error('Error getting tokens:', error);
            }
        }
    };

    const handleApprove = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const tokenContract = new ethers.Contract(tokenContractAddress, tokenabi, await signer);
                const tx = await tokenContract.approve(escrowContractAddress, ethers.parseUnits(borrowAmount, 'wei'));
                await tx.wait();
                fetchBorrowerInfo();
            } catch (error) {
                console.error('Error approving tokens:', error);
            }
        }
    };

    const handleBorrow = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);
                const tx = await escrowContract.borrow(ethers.parseUnits(borrowAmount, 'wei'), loanDuration);
                await tx.wait();
                fetchBorrowerInfo();
            } catch (error) {
                console.error('Error during borrowing:', error);
            }
        }
    };

    const handleRepay = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);
                const tx = await escrowContract.repay({ value: ethers.parseUnits(repaymentAmount.toString(), 'wei') });
                await tx.wait();
                fetchBorrowerInfo();
            } catch (error) {
                console.error('Error during repayment:', error);
            }
        }
    };

    const handleClaimCollateral = async () => {
        if (typeof window.ethereum !== 'undefined' && canClaimCollateral) {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);

                // Check if the borrower can claim collateral
                const borrowerContractAddress = await escrowContract.borrowerContract();
                const borrowerContract = new ethers.Contract(borrowerContractAddress, borrowerabi, await signer);

                const borrowerInfo = await borrowerContract.borrowers((await signer).getAddress());
                const currentTime = BigInt(Math.floor(Date.now() / 1000));
                const timeLeftToRepay = BigInt(borrowerInfo.loanDuration) - (currentTime - BigInt(borrowerInfo.borrowTime));

                if (timeLeftToRepay > 0) {
                    console.error('Loan duration has not yet expired.');
                    return;
                }

                const tx = await escrowContract.claimCollateral((await signer).getAddress());
                await tx.wait();
                fetchBorrowerInfo();
            } catch (error) {
                console.error('Error during collateral claim:', error);
            }
        }
    };


    const handleStakeTokens = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);
                const tx = await escrowContract.stakeTokens(ethers.parseUnits(stakeAmount, 'wei'));
                await tx.wait();
                fetchBorrowerInfo();
            } catch (error) {
                console.error('Error staking tokens:', error);
            }
        }
    };

    if (!session) {
        return <div className="flex items-center justify-center min-h-screen text-lg">Loading...</div>;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <h2 className="text-2xl font-bold mb-4">Borrower Section</h2>
            <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold">Amount Borrowed</h3>
                    <p>{borrowerInfo && (borrowerInfo as any).repaymentAmount ? ethers.formatUnits((borrowerInfo as any).repaymentAmount.toString(), 'wei') : 0} Wei</p>
                </div>
                <div className="mb-4">
                    <h3 className="text-lg font-semibold">Repayment Amount</h3>
                    <p>{repaymentAmount} Wei</p>
                </div>
                <div className="mb-4">
                    <h3 className="text-lg font-semibold">Time Left to Repay</h3>
                    <p>{timeLeft > 0 ? `${timeLeft} seconds` : 'Time is up!'}</p>
                </div>
                <div className="mb-4">
                    <input
                        type="number"
                        value={borrowAmount}
                        onChange={(e) => setBorrowAmount(e.target.value)}
                        placeholder="Borrow Amount in Wei"
                        className="w-full p-2 border rounded"
                    />
                    <input
                        type="number"
                        value={loanDuration}
                        onChange={(e) => setLoanDuration(e.target.value)}
                        placeholder="Loan Duration in seconds"
                        className="w-full p-2 border rounded mt-2"
                    />
                    <button onClick={handleGetTokens} className="mt-2 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                        Get {borrowAmount} Tokens
                    </button>
                    <button onClick={handleApprove} className="mt-2 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                        Approve Tokens
                    </button>
                    <button onClick={handleBorrow} className="mt-2 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                        Borrow
                    </button>
                </div>
                <div className="mb-4">
                    <input
                        type="number"
                        value={repaymentAmount}
                        onChange={(e) => setRepaymentAmount(Number(e.target.value))}
                        placeholder="Repayment Amount in Wei"
                        className="w-full p-2 border rounded"
                    />
                    <button onClick={handleRepay} className="mt-2 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                        Repay
                    </button>
                </div>
                <div className="mb-4">
                    <input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="Stake Amount in Wei"
                        className="w-full p-2 border rounded"
                    />
                    <button onClick={handleStakeTokens} className="mt-2 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                        Stake Tokens
                    </button>
                </div>
                <div className="mb-4">
                    <button
                        onClick={handleClaimCollateral}
                        disabled={!canClaimCollateral}
                        className={`w-full py-2 rounded ${canClaimCollateral ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}
                    >
                        Claim Collateral
                    </button>
                    {!canClaimCollateral && <p className="text-red-500 text-sm">Cannot claim collateral until the loan duration expires and repayment is due.</p>}
                </div>

            </div>
        </div>
    );
};

export default Borrowers;
