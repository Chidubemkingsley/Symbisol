'use client';

import React from 'react';
import { FileText } from 'lucide-react';

export default function TermsPage() {
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
          <FileText size={24} />
        </div>
        <h1 className="mono" style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em' }}>
          Terms of Service
        </h1>
      </div>

      <div className="glass-panel" style={{ padding: 32, border: 'var(--border-strong)', lineHeight: 1.8 }}>
        <p>SomniaSwarm provides an autonomous layer for agent-to-agent coordination using the Somnia blockchain infrastructure.</p>

        <h3 className="mono" style={{ marginTop: 24, marginBottom: 8, fontWeight: 700 }}>Use License</h3>
        <p>This project is open-source under the MIT license. You are free to use, modify, and distribute the software in compliance with the license terms.</p>

        <h3 className="mono" style={{ marginTop: 24, marginBottom: 8, fontWeight: 700 }}>Disclaimer</h3>
        <p>The software is provided &quot;as is&quot;, without warranty of any kind. The autonomous agents make decisions based on their programming and available data, which may not always be accurate or appropriate.</p>

        <h3 className="mono" style={{ marginTop: 24, marginBottom: 8, fontWeight: 700 }}>Limitations</h3>
        <p>In no event shall the authors or copyright holders be liable for any claim, damages, or other liability arising from the use of the software.</p>
      </div>
    </div>
  );
}
