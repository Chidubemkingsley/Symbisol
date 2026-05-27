'use client';

import React, { useEffect, useRef, useState } from 'react';

interface TickerItem {
  id: string;
  text: string;
  color: string;
}

const COLORS = {
  hired:     '#16a34a',
  payment:   '#f59e0b',
  completed: '#7C3AED',
  auto:      '#0ea5e9',
};

const SEED: TickerItem[] = [
  { id: 's1', text: '✅ ResearchAgent hired • 1.0 STT paid • Task #156 complete • 0.8s',   color: COLORS.completed },
  { id: 's2', text: '⚡ DataOracleAgent dispatched • BTC price fetched • 0.3 STT',           color: COLORS.payment },
  { id: 's3', text: '🤖 AnalysisAgent engaged • Sentiment: positive • 0.5 STT • 0.6s',      color: COLORS.hired },
  { id: 's4', text: '📡 On-chain proof: 0x1a2b…3c4d • Block #1824561 • Somnia Testnet',      color: COLORS.auto },
  { id: 's5', text: '✅ CodeAgent generated Solidity contract • 1.5 STT • Task #89',         color: COLORS.completed },
  { id: 's6', text: '⚡ WeatherAgent queried • London 18°C • 0.1 STT • 0.3s',               color: COLORS.payment },
  { id: 's7', text: '🤖 SentimentAgent: neutral • confidence 0.84 • 0.25 STT',              color: COLORS.hired },
  { id: 's8', text: '📡 Autonomous loop active • 4 swarms running • 2.6 STT/min',            color: COLORS.auto },
];

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002').replace(/\/$/, '');

export default function AgentEconomyTicker() {
  const [items, setItems] = useState<TickerItem[]>(SEED);
  const trackRef = useRef<HTMLDivElement>(null);

  // Listen for SSE events and prepend new ticker items
  useEffect(() => {
    let sse: EventSource | null = null;
    let retries = 0;

    const connect = () => {
      sse = new EventSource(`${API}/api/events`);
      sse.onerror = () => {
        sse?.close();
        retries++;
        setTimeout(connect, Math.min(4000 * retries, 20000));
      };

      sse.addEventListener('step_completed', (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          const fee = d.fee ? `${d.fee} STT` : '';
          const dur = d.durationMs ? `${d.durationMs}ms` : '';
          const tx  = d.txHash ? ` • ${d.txHash.slice(0, 8)}…` : '';
          const label = d.source === 'autonomous' ? '🤖 AUTO' : '✅';
          const text = `${label} ${d.agentName} complete${tx} • ${fee} ${dur}`.trim();
          setItems(prev => [
            { id: `${Date.now()}`, text, color: d.source === 'autonomous' ? COLORS.auto : COLORS.completed },
            ...prev,
          ].slice(0, 40));
        } catch {}
      });

      sse.addEventListener('step_started', (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          const text = `⚡ ${d.description?.slice(0, 55) || 'Task dispatched'}`;
          setItems(prev => [{ id: `${Date.now()}`, text, color: COLORS.hired }, ...prev].slice(0, 40));
        } catch {}
      });
    };

    connect();
    return () => sse?.close();
  }, []);

  return (
    <div style={{
      background: '#0f0f13',
      borderTop: '1px solid rgba(124,58,237,0.2)',
      borderBottom: '1px solid rgba(124,58,237,0.2)',
      padding: '8px 0',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Fade masks */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(to right, #0f0f13, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(to left, #0f0f13, transparent)', zIndex: 2, pointerEvents: 'none' }} />

      {/* Label */}
      <div style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        zIndex: 3, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 6px rgba(22,163,74,0.7)' }} />
        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#9ca3af', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}>
          LIVE
        </span>
      </div>

      {/* Scrolling track */}
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          gap: 48,
          paddingLeft: 80,
          animation: 'ticker-scroll 40s linear infinite',
          whiteSpace: 'nowrap',
        }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={`${item.id}-${i}`}
            style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              color: item.color,
              letterSpacing: '0.02em',
            }}
          >
            {item.text}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
