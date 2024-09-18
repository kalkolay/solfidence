import React from 'react';
import './App.css';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { clusterApiUrl } from '@solana/web3.js';
import { Routes, Route } from 'react-router-dom';
import Home from './Home';
import Success from './Success';

// Default styles
require('@solana/wallet-adapter-react-ui/styles.css');

function App() {
  // Choose the network you want to connect to
  const network = WalletAdapterNetwork.Devnet;

  // RPC endpoint
  const endpoint = clusterApiUrl(network);

  // Wallet adapters you wish to include
  const wallets = [new SolflareWalletAdapter()];

  return (
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={false}>
          <WalletModalProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/success" element={<Success />} />
            </Routes>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
  );
}

export default App;
