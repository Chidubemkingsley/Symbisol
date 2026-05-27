'use client';

import React from 'react';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div style={{ paddingBottom: 60, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, marginTop: 20 }}>
        <div style={{
          width: 48, height: 48,
          background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
        }}>
          <Shield size={24} />
        </div>
        <h1 className="mono" style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em' }}>
          Privacy Policy
        </h1>
      </div>

      <div className="glass-panel" style={{ padding: 32, border: 'var(--border-strong)', lineHeight: 1.8 }}>
        <p>SomniaSwarm is designed with privacy at its core. As an autonomous agent platform operating on the Somnia blockchain, we minimize data collection while maximizing transparency.</p>

        <h3 className="mono" style={{ marginTop: 24, marginBottom: 8, fontWeight: 700 }}>Data We Collect</h3>
        <ul>
          <li><strong>Wallet Addresses:</strong> Your public EVM address for agent interaction attribution.</li>
          <li><strong>Task Queries:</strong> Natural language queries you submit to the agent swarm (processed server-side, not stored long-term).</li>
          <li><strong>Usage Statistics:</strong> Anonymous metrics about agent usage and performance.</li>
        </ul>

        <h3 className="mono" style={{ marginTop: 24, marginBottom: 8, fontWeight: 700 }}>On-Chain Data</h3>
        <p>Because SomniaSwarm operates on the Somnia blockchain, agent registrations and task records are stored immutably on-chain. This data is public by design.</p>

        <h3 className="mono" style={{ marginTop: 24, marginBottom: 8, fontWeight: 700 }}>No Cookies or Tracking</h3>
        <p>We do not use cookies, analytics scripts, or third-party tracking services. The frontend is a stateless dashboard that connects directly to your backend.</p>

        <h3 className="mono" style={{ marginTop: 24, marginBottom: 8, fontWeight: 700 }}>Contact</h3>
        <p>For privacy inquiries, please open an issue on our GitHub repository.</p>
      </div>
    </div>
  );
}
