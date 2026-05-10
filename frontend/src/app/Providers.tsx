'use client';

import React from 'react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { SolanaWalletProvider } from '@/lib/SolanaWalletProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SolanaWalletProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </SolanaWalletProvider>
  );
}
