'use client';

import React, { useState } from 'react';
import EconomyGraph from '@/components/EconomyGraph';
import AgentChat from '@/components/AgentChat';
import TransactionLog from '@/components/TransactionLog';
import ToolCatalog from '@/components/ToolCatalog';
import ProtocolTrace from '@/components/ProtocolTrace';
import RobotGuide from '@/components/RobotGuide';
import OnChainFeed from '@/components/OnChainFeed';
import AgentEconomyTicker from '@/components/AgentEconomyTicker';
import { useI18n } from '@/lib/LanguageContext';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002').replace(/\/$/, '');

export default function Home() {
  const { language, t } = useI18n();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [protocolData, setProtocolData] = useState<any[]>([]);
  const [hiringDecisions, setHiringDecisions] = useState<any[]>([]);
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [autonomousActive, setAutonomousActive] = useState(false);
  const [autonomousLoading, setAutonomousLoading] = useState(false);

  const handleNewPayments = () => setRefreshTrigger(prev => prev + 1);

  const handleProtocolTrace = (log: any) => {
    if (log.type === 'hiring_decision' || log.type === 'a2a-hire') {
      const decisionLog = log.type === 'a2a-hire' ? {
        tool: 'Autonomous Delegation', selectedAgent: log.worker,
        reason: log.reason || `Recursive hire by ${log.hirer}`,
        valueScore: 100, alternatives: [], approved: true,
      } : log;
      setHiringDecisions(prev => [...prev, decisionLog]);
      setRefreshTrigger(prev => prev + 1);
    } else {
      setProtocolData(prev => [...prev, log]);
    }
  };

  const triggerStressTest = async () => {
    setIsStressTesting(true);
    try {
      await fetch(`${API}/api/agent/stress-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } catch (err) {
      console.error('Stress test failed', err);
    } finally {
      setTimeout(() => setIsStressTesting(false), 10000);
    }
  };

  const toggleAutonomous = async () => {
    setAutonomousLoading(true);
    try {
      const endpoint = autonomousActive ? 'stop' : 'start';
      await fetch(`${API}/api/autonomous/${endpoint}`, { method: 'POST' });
      setAutonomousActive(!autonomousActive);
    } catch (err) {
      console.error('Autonomous toggle failed', err);
    } finally {
      setAutonomousLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: 60 }}>

      {/* ── Economy Ticker ── */}
      <div style={{ margin: '0 -32px 0', position: 'sticky', top: 64, zIndex: 50 }}>
        <AgentEconomyTicker />
      </div>

      {/* ── Hero ── */}
      <section style={{
        marginTop: 32, marginBottom: 48,
        padding: '52px 40px',
        background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 60%, #1e1b4b 100%)',
        color: '#fff', borderRadius: 14, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, fontSize: '9rem', opacity: 0.04, fontWeight: 900, pointerEvents: 'none', color: '#fff', userSelect: 'none' }}>
          SomniaSwarm
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="mono" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 0.95, marginBottom: 16, letterSpacing: '-0.04em' }}>
            {t.heroTitle}<br />
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{t.heroSubtitle}</span>
          </h1>
          <p className="mono" style={{ fontSize: '1.05rem', maxWidth: 560, fontWeight: 500, borderLeft: '3px solid rgba(255,255,255,0.25)', paddingLeft: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
            {t.heroLead}
          </p>

          <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', padding: '7px 14px', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 7 }}>
              {t.recursiveDelegation}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', padding: '7px 14px', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 7 }}>
              {t.paymentsVerified}
            </div>
            <div style={{ background: 'rgba(22,163,74,0.25)', color: '#86efac', padding: '7px 14px', fontSize: '0.85rem', border: '1px solid rgba(22,163,74,0.4)', borderRadius: 7 }}>
              🔗 Real STT Payments
            </div>
            <div style={{ background: 'rgba(14,165,233,0.25)', color: '#7dd3fc', padding: '7px 14px', fontSize: '0.85rem', border: '1px solid rgba(14,165,233,0.4)', borderRadius: 7 }}>
              🤖 Groq LLaMA-3.3 Powered
            </div>

            {/* God Mode button */}
            <button
              onClick={triggerStressTest}
              disabled={isStressTesting}
              style={{
                background: isStressTesting ? '#6b7280' : '#f59e0b',
                color: '#fff', padding: '7px 18px', fontSize: '0.9rem', fontWeight: 800,
                fontFamily: 'var(--font-mono)', border: 'none', borderRadius: 7,
                cursor: isStressTesting ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                boxShadow: isStressTesting ? 'none' : '0 2px 12px rgba(245,158,11,0.4)',
              }}
            >
              {isStressTesting ? '⚡ Running…' : t.godMode || '⚡ God Mode'}
            </button>

            {/* Autonomous Mode toggle */}
            <button
              onClick={toggleAutonomous}
              disabled={autonomousLoading}
              style={{
                background: autonomousActive ? 'rgba(22,163,74,0.3)' : 'rgba(255,255,255,0.1)',
                color: autonomousActive ? '#86efac' : 'rgba(255,255,255,0.8)',
                padding: '7px 18px', fontSize: '0.9rem', fontWeight: 700,
                fontFamily: 'var(--font-mono)', border: `1px solid ${autonomousActive ? 'rgba(22,163,74,0.5)' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: 7, cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {autonomousLoading ? '…' : autonomousActive ? '🟢 Auto: ON' : '⚫ Auto: OFF'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Economy Graph ── */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            <span className="text-glow">{t.monitorTitle}</span> {t.monitorLabel}
          </h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {autonomousActive && (
              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#16a34a', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', padding: '3px 8px', borderRadius: 4 }}>
                🤖 AUTONOMOUS
              </span>
            )}
            <span className="badge badge-stx">{language === 'hi' ? '60FPS रियलटाइम' : '60FPS REALTIME'}</span>
          </div>
        </div>
        <div style={{ borderRadius: 10, padding: 4, background: '#f8f9fa', border: '1px solid #e5e7eb' }}>
          <EconomyGraph refreshTrigger={refreshTrigger} />
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 28 }}>
        {/* Left: Agent Chat */}
        <div className="glass-panel" style={{ height: 820, padding: 28, display: 'flex', flexDirection: 'column', border: 'var(--border-strong)' }}>
          <AgentChat onNewPayments={handleNewPayments} onProtocolTrace={handleProtocolTrace} />
        </div>

        {/* Right: Transaction Log + Protocol Trace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: 820 }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <TransactionLog refreshTrigger={refreshTrigger} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ProtocolTrace traces={protocolData} hiringDecisions={hiringDecisions} />
          </div>
        </div>
      </div>

      {/* ── On-Chain Feed ── */}
      <div style={{ marginTop: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            📡 On-Chain Event Feed
          </h2>
          <a
            href="https://shannon-explorer.somnia.network"
            target="_blank" rel="noreferrer"
            style={{ fontSize: '0.75rem', color: '#7C3AED', fontFamily: 'var(--font-mono)', textDecoration: 'none' }}
          >
            Somnia Explorer ↗
          </a>
        </div>
        <OnChainFeed />
      </div>

      {/* ── Tool Catalog ── */}
      <div style={{ marginTop: 64 }}>
        <ToolCatalog />
      </div>

      <RobotGuide />
    </div>
  );
}
