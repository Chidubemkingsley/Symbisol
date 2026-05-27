'use client';

import React from 'react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { EVMWalletProvider } from '@/lib/EVMWalletProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EVMWalletProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </EVMWalletProvider>
  );
}
