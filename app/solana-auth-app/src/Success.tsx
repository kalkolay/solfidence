// src/Success.tsx

import React, { useEffect, useState } from 'react';
import { WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import { Connection, PublicKey, TransactionSignature, ParsedTransactionWithMeta } from '@solana/web3.js';

const Success: React.FC = () => {
    const { connected, publicKey } = useWallet();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<ParsedTransactionWithMeta[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!connected) {
            navigate('/');
        } else if (publicKey) {
            fetchTransactions();
        }
    }, [connected, navigate, publicKey]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
            const signatures = await connection.getSignaturesForAddress(publicKey as PublicKey, { limit: 20 });

            const transactionSignatures = signatures.map((sig) => sig.signature);

            const parsedTransactions = await connection.getParsedTransactions(transactionSignatures);

            const nonNullTransactions = parsedTransactions.filter(
                (tx): tx is ParsedTransactionWithMeta => tx !== null
            );

            setTransactions(nonNullTransactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Account Transactions</h1>
            <WalletDisconnectButton />
            {loading ? (
                <p>Loading transactions...</p>
            ) : (
                <div>
                    {transactions.length > 0 ? (
                        <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr>
                                <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>Signature</th>
                                <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>Block Time</th>
                                <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {transactions.map((tx) => (
                                <tr key={tx.transaction.signatures[0]}>
                                    <td style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>
                                        {tx.transaction.signatures[0]}
                                    </td>
                                    <td style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>
                                        {tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString() : 'N/A'}
                                    </td>
                                    <td style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>
                                        {tx.meta?.err ? 'Failed' : 'Success'}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No transactions found.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Success;
