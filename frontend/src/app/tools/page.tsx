'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Globe, FileText, Code, MessageSquare, Activity, TrendingUp, Download } from 'lucide-react';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002').replace(/\/$/, '');

const TOOL_ICONS: Record<string, React.ReactNode> = {
  research: <Globe size={20} />,
  analysis: <TrendingUp size={20} />,
  oracle: <Activity size={20} />,
  nlp: <MessageSquare size={20} />,
  code: <Code size={20} />,
  data: <Download size={20} />,
};

export default function ToolsPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/tools`)
      .then(r => r.json())
      .then(data => {
        setTools(data.tools || []);
        setLoading(false);
      })
      .catch(() => {
        setTools([]);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 className="mono" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 12, letterSpacing: '-0.04em' }}>
          Agent Swarm Tools
        </h1>
        <p className="mono" style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: 600 }}>
          Browse the autonomous agent swarm. Each agent has specialized capabilities registered on-chain via Somnia's Agent Registry.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <Activity size={32} className="spin" />
          <p className="mono" style={{ marginTop: 12 }}>Loading agent catalog...</p>
        </div>
      ) : tools.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <p className="mono">No agents available. Start the backend server.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {tools.map((tool: any) => (
            <div
              key={tool.id}
              className="glass-panel"
              style={{
                padding: 28,
                border: 'var(--border-strong)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40,
                  background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}>
                  {TOOL_ICONS[tool.category] || <Cpu size={20} />}
                </div>
                <div>
                  <h3 className="mono" style={{ fontSize: '1rem', fontWeight: 700 }}>
                    {tool.name}
                  </h3>
                  <span style={{
                    fontSize: '0.65rem',
                    color: '#7C3AED',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {tool.category}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                {tool.description}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {tool.capabilities?.map((cap: string) => (
                  <span key={cap} className="badge badge-stx" style={{ fontSize: '0.6rem' }}>
                    {cap}
                  </span>
                ))}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 8,
                padding: 12,
                background: '#f8f9fa',
                borderRadius: 8,
                fontSize: '0.75rem',
              }}>
                <div className="mono">
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>PRICE</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-warning)' }}>{tool.price} STT</div>
                </div>
                <div className="mono">
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>REPUTATION</div>
                  <div style={{ fontWeight: 700 }}>{tool.reputation}</div>
                </div>
                <div className="mono">
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>EFFICIENCY</div>
                  <div style={{ fontWeight: 700 }}>η{tool.efficiency?.toFixed(2) || '—'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
