// src/Home.tsx

import React, { useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
    const { connected } = useWallet();
    const navigate = useNavigate();

    useEffect(() => {
        if (connected) {
            navigate('/success');
        }
    }, [connected, navigate]);

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Sign in with Solana</h1>
            <WalletMultiButton />
        </div>
    );
};

export default Home;
