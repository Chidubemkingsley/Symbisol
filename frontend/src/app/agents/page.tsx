"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot, Zap, Star, Activity, BarChart3, Filter } from 'lucide-react';
import { useI18n } from '@/lib/LanguageContext';

export default function AgentsPage() {
  const { t } = useI18n();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'reputation' | 'efficiency' | 'price'>('reputation');

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'https://symbisol.onrender.com').replace(/\/$/, '')}/api/registry`);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await res.json();
        setAgents(data.agents || []);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch agents:', err);
        setError(err.message || 'Failed to load agents');
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const sortedAgents = [...agents].sort((a, b) => {
    if (sortBy === 'reputation') return b.reputation - a.reputation;
    if (sortBy === 'efficiency') return b.efficiency - a.efficiency;
    if (sortBy === 'price') return a.priceSOL - b.priceSOL;
    return 0;
  });

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.isActive).length,
    avgRep: agents.length ? (agents.reduce((acc, a) => acc + a.reputation, 0) / agents.length).toFixed(1) : '0',
    totalJobs: agents.reduce((acc, a) => acc + a.jobsCompleted, 0),
  };

  return (
    <div style={{ padding: '40px 0' }}>
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
        <div>
          <h1 className="mono" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 12, color: '#111111' }}>
            {t.marketplaceTitle}
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#111111', maxWidth: 700 }}>
            {t.marketplaceSubtitle}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#111111', fontSize: '0.9rem' }}>
            <Filter size={16} /> {t.sortBy}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="glass-panel"
            style={{
              background: 'rgba(255,255,255,0.8)',
              color: '#111111',
              border: '1px solid var(--border-subtle)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="reputation" style={{ background: '#fff' }}>{t.rep}</option>
            <option value="efficiency" style={{ background: '#fff' }}>{t.efficiency}</option>
            <option value="price" style={{ background: '#fff' }}>{t.price}</option>
          </select>
        </div>
      </div>

      {/* Contract Info Banner */}
      <div style={{
        marginBottom: 32,
        padding: '12px 20px',
        background: 'rgba(83,131,255,0.06)',
        border: '1px solid rgba(83,131,255,0.2)',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
          <span className="mono" style={{ fontSize: '0.75rem', color: '#6b7280' }}>ANCHOR PROGRAM</span>
          <span className="mono" style={{ fontSize: '0.75rem', color: '#111827', fontWeight: 700 }}>
            5383AVU3XCHu2L4dEVZVGtitekZEuaFBFoxgnFQJJmmB
          </span>
          <span className="mono" style={{ fontSize: '0.65rem', color: '#16a34a', background: 'rgba(22,163,74,0.08)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(22,163,74,0.2)' }}>
            DEVNET
          </span>
        </div>
        <a
          href="https://explorer.solana.com/address/5383AVU3XCHu2L4dEVZVGtitekZEuaFBFoxgnFQJJmmB?cluster=devnet"
          target="_blank"
          rel="noreferrer"
          className="mono"
          style={{ fontSize: '0.7rem', color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}
        >
          View on Explorer →
        </a>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 20,
        marginBottom: 40,
      }}>
        {[
          { label: t.totalAgents, value: stats.total, color: '#16a34a' },
          { label: t.networkActive, value: stats.active, color: '#15803d' },
          { label: t.avgReputation, value: `${stats.avgRep}%`, color: '#059669' },
          { label: t.totalJobs, value: stats.totalJobs > 1000 ? `${(stats.totalJobs/1000).toFixed(1)}K` : stats.totalJobs, color: '#16a34a' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-panel"
            style={{ padding: 24, textAlign: 'center' }}
          >
            <div className="mono" style={{ fontSize: '2rem', fontWeight: 800, color: stat.color, marginBottom: 8 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#111111' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <Activity className="animate-pulse" style={{ color: '#16a34a' }} />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div style={{ color: '#ef4444', marginBottom: 16, fontSize: '1.2rem', fontWeight: 600 }}>
             {t.connectionError || 'Unable to connect to Agent Registry'}
          </div>
          <p style={{ color: '#111111', marginBottom: 24 }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn"
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#111111',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Agents Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: 24,
      }}>
        {sortedAgents.map((agent) => (
          <div
            key={agent.id}
            className="glass-panel"
            style={{
              padding: 24,
              transition: 'all 0.2s ease',
              border: '1px solid var(--border-subtle)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Efficiency Glow */}
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              background: `radial-gradient(circle, ${agent.efficiency > 5000 ? 'rgba(52, 211, 153, 0.1)' : 'rgba(168, 85, 247, 0.05)'} 0%, transparent 70%)`,
              zIndex: 0
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16, position: 'relative' }}>
              <div>
                <h3 className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
                  {agent.name}
                </h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge" style={{
                    backgroundColor: agent.isActive ? 'rgba(52, 211, 153, 0.1)' : 'rgba(161, 161, 170, 0.1)',
                    color: agent.isActive ? '#34d399' : '#a1a1aa',
                    fontSize: '0.65rem',
                    padding: '2px 8px',
                    borderColor: agent.isActive ? 'rgba(52, 211, 153, 0.3)' : 'rgba(161, 161, 170, 0.3)',
                  }}>
                    {agent.isActive ? t.online : t.offline}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {agent.id.slice(0, 12)}...
                  </span>
                </div>
              </div>
              <div style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(34, 211, 238, 0.1)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
              }}>
                <span className="mono" style={{ fontSize: '0.75rem', color: '#22d3ee', fontWeight: 600 }}>
                  {agent.category.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 20, position: 'relative' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: '#71717a', marginBottom: 4 }}>{t.rep.toUpperCase()}</div>
                <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: agent.reputation > 90 ? '#34d399' : '#fbbf24' }}>
                  {agent.reputation}%
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: '#71717a', marginBottom: 4 }}>{t.efficiency.toUpperCase()}</div>
                <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a' }}>
                  {agent.efficiency.toFixed(0)}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: '#71717a', marginBottom: 4 }}>{t.price.toUpperCase()}</div>
                <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                  {agent.priceSOL} SOL
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: 12,
              marginBottom: 20,
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{t.jobsCompleted}</span>
                <span className="mono" style={{ color: 'white' }}>{agent.jobsCompleted}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t.reliability}</span>
                <span className="mono" style={{ color: 'white' }}>
                  {agent.jobsCompleted > 0 ? ((agent.jobsCompleted / (agent.jobsCompleted + agent.jobsFailed)) * 100).toFixed(1) : '100'}%
                </span>
              </div>
            </div>

            <Link
              href={`/?query=Hire ${agent.id} to help with `}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
            >
              <Zap size={16} /> {t.hireAgent}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
