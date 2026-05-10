'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

export default function WalletInfo() {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network as any);
    const connection = new Connection(rpcUrl, 'confirmed');

    const fetchBalance = async () => {
      try {
        const bal = await connection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);
      } catch {
        setBalance(null);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 15000);
    return () => clearInterval(interval);
  }, [publicKey]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 8,
        background: 'rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.2)',
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#16a34a',
          boxShadow: '0 0 6px rgba(22,163,74,0.6)',
        }} />
        <span style={{ fontSize: '0.6rem', color: '#16a34a', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
          {process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'DEVNET'}
        </span>
      </div>

      {publicKey && (
        <div style={{
          padding: '4px 10px', borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginBottom: 1 }}>Wallet</div>
          <div style={{
            fontSize: '0.62rem', color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}>
            {publicKey.toBase58().slice(0, 8)}&hellip;{publicKey.toBase58().slice(-6)}
            <span style={{ marginLeft: 6, color: 'var(--accent-primary)', fontWeight: 700 }}>
              {balance !== null ? `${balance.toFixed(3)} SOL` : '...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
