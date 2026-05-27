'use client';

import React from 'react';
import { useAccount, useBalance, useChainId } from 'wagmi';

export default function WalletInfo() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });

  const networkName = chainId === 50312 ? 'Somnia Testnet' :
                      chainId === 5031 ? 'Somnia Mainnet' :
                      'Unknown Network';

  const symbol = chainId === 50312 ? 'STT' :
                 chainId === 5031 ? 'SOMI' :
                 'ETH';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 8,
        background: 'rgba(124,58,237,0.08)',
        border: '1px solid rgba(124,58,237,0.2)',
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: isConnected ? '#7C3AED' : '#9ca3af',
          boxShadow: isConnected ? '0 0 6px rgba(124,58,237,0.6)' : 'none',
        }} />
        <span style={{
          fontSize: '0.6rem', color: isConnected ? '#7C3AED' : '#9ca3af',
          fontWeight: 600, fontFamily: 'var(--font-mono)',
        }}>
          {isConnected ? (chainId === 50312 ? 'TESTNET' : chainId === 5031 ? 'MAINNET' : symbol) : 'DISCONNECTED'}
        </span>
      </div>

      {isConnected && address && (
        <div style={{
          padding: '4px 10px', borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginBottom: 1 }}>
            {networkName}
          </div>
          <div style={{
            fontSize: '0.62rem', color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}>
            {address.slice(0, 8)}&hellip;{address.slice(-6)}
            <span style={{ marginLeft: 6, color: 'var(--accent-primary)', fontWeight: 700 }}>
              {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
