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
    const [stakeAmount, setStakeAmount] = useState('');
    const [tokenAmount, setTokenAmount] = useState('');
    const [approveAmount, setApproveAmount] = useState('');
    const [repayInputAmount, setRepayInputAmount] = useState('');
    const [borrowerInfo, setBorrowerInfo] = useState(null);
    const [loanAmount, setLoanAmount] = useState(0);
    const [repaymentAmount, setRepaymentAmount] = useState(0);
    const [stackedTokens, setStackedTokens] = useState(0);
    const [interestRate, setInterestRate] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [canClaimCollateral, setCanClaimCollateral] = useState(false);
    const [newInterestRate, setNewInterestRate] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const adminAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS ? process.env.NEXT_PUBLIC_ADMIN_ADDRESS : "0x0";

    const escrowabi = escrowABI["abi"];
    const borrowerabi = borrowerABI["abi"];
    const tokenabi = tokenABI["abi"];
    const escrowContractAddress = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS ? process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS : "0x0";
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = provider.getSigner();

    useEffect(() => {
        if (session) {
            checkAdmin();
            fetchBorrowerInfo();
            if (repaymentAmount > 0) {
                const interval = setInterval(fetchBorrowerInfo, 10000); // Refresh every 10 seconds
                return () => clearInterval(interval); // Cleanup on component unmount
            }
        }
    }, [session, repaymentAmount]);

    const checkAdmin = async () => {
        const accounts = await provider.listAccounts();
        if (accounts[0].address.toLowerCase() === adminAddress.toLowerCase()) {
            setIsAdmin(true);
        }
    };

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
                setLoanAmount(parseFloat(ethers.formatUnits(info.loanAmount, 'wei')));
                setRepaymentAmount(parseFloat(ethers.formatUnits(info.repaymentAmount, 'wei')));
                setStackedTokens(parseFloat(ethers.formatUnits(info.stackedTokens, 'wei')));

                const rate = await borrowerContract.interestRate();
                setInterestRate(parseFloat(ethers.formatUnits(rate, 'wei')));
            } catch (error) {
                console.error('Error fetching borrower info:', error);
            }
        }
    };

    const handleGetTokens = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);
                const tx = await escrowContract.getTokens(ethers.parseUnits(tokenAmount, 'wei'));
                const receipt = await tx.wait();

                if (receipt.status === 1) {
                    alert('Get Tokens transaction successful');
                    fetchBorrowerInfo();
                } else {
                    alert('Get Tokens transaction failed');
                }
            } catch (error: any) {
                alert(`Error getting tokens: ${error.message}`);
                console.error('Error getting tokens:', error);
            }
        }
    };

    const handleApprove = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);
                const tokenContractAddress = await escrowContract.token();
                const tokenContract = new ethers.Contract(tokenContractAddress, tokenabi, await signer);
                const tx = await tokenContract.approve(escrowContractAddress, ethers.parseUnits(approveAmount, 'wei'));
                const receipt = await tx.wait();

                if (receipt.status === 1) {
                    alert('Approve Tokens transaction successful');
                    fetchBorrowerInfo();
                } else {
                    alert('Approve Tokens transaction failed');
                }
            } catch (error: any) {
                alert(`Error approving tokens: ${error.message}`);
                console.error('Error approving tokens:', error);
            }
        }
    };

    const handleBorrow = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                if (borrowAmount === '' || loanDuration === '') {
                    throw new Error('Borrow amount and loan duration must be provided');
                }

                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);
                const tx = await escrowContract.borrow(
                    ethers.parseUnits(borrowAmount, 'wei'),
                    parseInt(loanDuration, 10)
                );
                const receipt = await tx.wait();

                if (receipt.status === 1) {
                    alert('Borrow transaction successful');
                    fetchBorrowerInfo();
                } else {
                    alert('Borrow transaction failed');
                }
            } catch (error: any) {
                alert(`Error during borrowing: ${error.message}`);
                console.error('Error during borrowing:', error);
            }
        }
    };

    const handleRepay = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);
                const tx = await escrowContract.repay({ value: ethers.parseUnits(repayInputAmount, 'wei') });
                const receipt = await tx.wait();

                if (receipt.status === 1) {
                    alert('Repay transaction successful');
                    fetchBorrowerInfo();
                } else {
                    alert('Repay transaction failed');
                }
            } catch (error: any) {
                alert(`Error during repayment: ${error.message}`);
                console.error('Error during repayment:', error);
            }
        }
    };

    const handleClaimCollateral = async () => {
        if (typeof window.ethereum !== 'undefined' && canClaimCollateral) {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);

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
                const receipt = await tx.wait();

                if (receipt.status === 1) {
                    alert('Claim Collateral transaction successful');
                    fetchBorrowerInfo();
                } else {
                    alert('Claim Collateral transaction failed');
                }
            } catch (error: any) {
                alert(`Error during collateral claim: ${error.message}`);
                console.error('Error during collateral claim:', error);
            }
        }
    };

    const handleStakeTokens = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);
                const tx = await escrowContract.stakeTokens(ethers.parseUnits(stakeAmount, 'wei'));
                const receipt = await tx.wait();

                if (receipt.status === 1) {
                    alert('Stake Tokens transaction successful');
                    fetchBorrowerInfo();
                } else {
                    alert('Stake Tokens transaction failed');
                }
            } catch (error: any) {
                alert(`Error staking tokens: ${error.message}`);
                console.error('Error staking tokens:', error);
            }
        }
    };

    const handleClaimStackedTokens = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);
                const tx = await escrowContract.claimStackedTokens();
                const receipt = await tx.wait();

                if (receipt.status === 1) {
                    alert('Claim Stacked Tokens transaction successful');
                    fetchBorrowerInfo();
                } else {
                    alert('Claim Stacked Tokens transaction failed');
                }
            } catch (error: any) {
                alert(`Error claiming stacked tokens: ${error.message}`);
                console.error('Error claiming stacked tokens:', error);
            }
        }
    };

    const handleChangeInterestRate = async () => {
        if (typeof window.ethereum !== 'undefined' && newInterestRate) {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);
                const tx = await escrowContract.changeBorrowersInterestRate(ethers.parseUnits(newInterestRate, 'wei'));
                await tx.wait();
                await fetchBorrowerInfo();
                setNewInterestRate('');
                alert('Interest rate changed successfully');
            } catch (error) {
                console.error('Error changing interest rate:', error);
                alert('Failed to change interest rate');
            }
        }
    };

    if (!session) {
        return <div className="flex items-center justify-center min-h-screen text-lg">Loading...</div>;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <h2 className="text-2xl font-bold mb-4">Borrower Section</h2>
            <div className="bg-white p-6 rounded shadow-md w-full max-w-4xl flex">
                <div className="w-1/2 p-4">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">Amount Borrowed</h3>
                        <p>{loanAmount} Wei</p>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">Repayment Amount</h3>
                        <p>{repaymentAmount} Wei</p>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">Interest Rate</h3>
                        <p>{interestRate / 100} %</p>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">Stacked Tokens</h3>
                        <p>{stackedTokens} Wei</p>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">Time Left to Repay</h3>
                        <p>{timeLeft > 0 ? `${timeLeft} seconds` : 'Time is up!'}</p>
                    </div>
                    {isAdmin && (
                        <div className="mb-4">
                            <input
                                type="number"
                                value={newInterestRate}
                                onChange={(e) => setNewInterestRate(e.target.value)}
                                placeholder="New Interest Rate multiplied by 100"
                                className="w-full p-2 border rounded"
                            />
                            <button onClick={handleChangeInterestRate} className="mt-2 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                                Change Interest Rate
                            </button>
                        </div>
                    )}
                </div>
                <div className="w-1/2 p-4">
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
                        <button onClick={handleBorrow} className="mt-2 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                            Borrow
                        </button>
                    </div>
                    <div className="mb-4">
                        <input
                            type="number"
                            value={repayInputAmount}
                            onChange={(e) => setRepayInputAmount(e.target.value)}
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
                            value={tokenAmount}
                            onChange={(e) => setTokenAmount(e.target.value)}
                            placeholder="Get Tokens Amount in Wei"
                            className="w-full p-2 border rounded"
                        />
                        <button onClick={handleGetTokens} className="mt-2 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                            Get Tokens
                        </button>
                    </div>
                    <div className="mb-4">
                        <input
                            type="number"
                            value={approveAmount}
                            onChange={(e) => setApproveAmount(e.target.value)}
                            placeholder="Approve Tokens Amount in Wei"
                            className="w-full p-2 border rounded"
                        />
                        <button onClick={handleApprove} className="mt-2 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                            Approve Tokens
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
                    <div className="mb-4">
                        <button onClick={handleClaimStackedTokens} className="mt-2 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                            Claim Stacked Tokens
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Borrowers;
