'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Globe, FileText, Code, MessageSquare, Activity, TrendingUp, Download } from 'lucide-react';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002').replace(/\/$/, '');

const CATEGORY_COLORS: Record<string, string> = {
  research: '#7C3AED',
  analysis: '#0891B2',
  oracle: '#D97706',
  nlp: '#059669',
  code: '#DC2626',
  data: '#2563EB',
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/agents`)
      .then(r => r.json())
      .then(data => {
        setAgents(data.agents || []);
        setLoading(false);
      })
      .catch(() => {
        setAgents([]);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 className="mono" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 12, letterSpacing: '-0.04em' }}>
          Agent Registry
        </h1>
        <p className="mono" style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: 600 }}>
          On-chain agent registry on Somnia — discover, verify, and interact with autonomous agents
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <Activity size={32} className="spin" />
          <p className="mono" style={{ marginTop: 12 }}>Loading agent registry...</p>
        </div>
      ) : agents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <p className="mono">No agents registered. Start the backend server.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
          {agents.map((agent: any) => (
            <div
              key={agent.id}
              className="glass-panel"
              style={{
                padding: 28,
                border: 'var(--border-strong)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48,
                  background: `linear-gradient(135deg, ${CATEGORY_COLORS[agent.category] || '#7C3AED'}, ${CATEGORY_COLORS[agent.category] || '#6D28D9'})`,
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '1.2rem', fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                }}>
                  {agent.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="mono" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    {agent.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <span className="mono" style={{
                      fontSize: '0.6rem', fontWeight: 600,
                      color: CATEGORY_COLORS[agent.category] || '#7C3AED',
                      textTransform: 'uppercase',
                    }}>
                      {agent.category}
                    </span>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: agent.isActive ? '#16a34a' : '#ef4444',
                    }} />
                    <span className="mono" style={{ fontSize: '0.6rem', color: agent.isActive ? '#16a34a' : '#ef4444' }}>
                      {agent.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                {agent.description}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {agent.capabilities?.map((cap: string) => (
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
                marginBottom: 12,
              }}>
                <div className="mono">
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>PRICE</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-warning)' }}>{agent.price} STT</div>
                </div>
                <div className="mono">
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>REPUTATION</div>
                  <div style={{ fontWeight: 700 }}>{agent.reputation}</div>
                </div>
                <div className="mono">
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>RATING</div>
                  <div style={{ fontWeight: 700 }}>
                    {'★'.repeat(Math.max(1, Math.floor(agent.reputation / 2000)))}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                fontSize: '0.7rem',
              }}>
                <div className="mono" style={{ color: 'var(--text-muted)' }}>
                  Jobs: <strong style={{ color: 'var(--text-primary)' }}>{agent.jobsCompleted} ✅ / {agent.jobsFailed} ❌</strong>
                </div>
                <div className="mono" style={{ color: 'var(--text-muted)' }}>
                  Earned: <strong style={{ color: 'var(--text-primary)' }}>{agent.totalEarned?.toFixed(2)} STT</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
