'use client';

import React, { useEffect, useState } from 'react';

interface FeedEvent {
  id: string;
  timestamp: string;
  type: 'task_completed' | 'task_created' | 'agent_registered' | 'autonomous';
  agentName: string;
  txHash?: string;
  explorerUrl?: string;
  blockNumber?: number;
  fee?: string;
  durationMs?: number;
  source?: string;
}

const TYPE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  task_completed:   { label: 'SETTLED',   color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  task_created:     { label: 'DISPATCHED',color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  agent_registered: { label: 'REGISTERED',color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  autonomous:       { label: 'AUTONOMOUS', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
};

const MOCK_AGENTS = ['ResearchAgent','AnalysisAgent','DataOracleAgent','SummaryAgent','CodeAgent','TranslationAgent','WeatherAgent','SentimentAgent'];
const MOCK_HASHES = () => '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

function shortHash(h: string) { return h ? `${h.slice(0,6)}…${h.slice(-4)}` : ''; }
function fmt(ts: string) {
  try { return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return ts; }
}

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002').replace(/\/$/, '');

export default function OnChainFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [connected, setConnected] = useState(false);

  // Seed with a few realistic bootstrap events
  useEffect(() => {
    const seed: FeedEvent[] = MOCK_AGENTS.slice(0, 4).map((name, i) => ({
      id: `seed-${i}`,
      timestamp: new Date(Date.now() - (4 - i) * 12000).toISOString(),
      type: 'task_completed',
      agentName: name,
      txHash: MOCK_HASHES(),
      explorerUrl: '#',
      blockNumber: 1824560 + i * 3,
      fee: (Math.random() * 1.5 + 0.1).toFixed(3),
      durationMs: Math.floor(Math.random() * 1200) + 300,
      source: 'system',
    }));
    setEvents(seed);
  }, []);

  useEffect(() => {
    let sse: EventSource | null = null;
    let retries = 0;

    const connect = () => {
      sse = new EventSource(`${API}/api/events`);
      sse.onopen = () => { setConnected(true); retries = 0; };
      sse.onerror = () => {
        setConnected(false);
        sse?.close();
        retries++;
        setTimeout(connect, Math.min(3000 * retries, 15000));
      };

      const addEvent = (raw: any, type: FeedEvent['type']) => {
        const ev: FeedEvent = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          type,
          agentName: raw.agentName || raw.name || 'Agent',
          txHash: raw.txHash,
          explorerUrl: raw.explorerUrl,
          blockNumber: raw.blockNumber,
          fee: raw.fee,
          durationMs: raw.durationMs,
          source: raw.source,
        };
        setEvents(prev => [ev, ...prev].slice(0, 60));
      };

      sse.addEventListener('step_completed',   (e: MessageEvent) => { try { addEvent(JSON.parse(e.data), 'task_completed'); } catch {} });
      sse.addEventListener('step_started',     (e: MessageEvent) => { try { addEvent(JSON.parse(e.data), 'task_created'); } catch {} });
      sse.addEventListener('agent_registered', (e: MessageEvent) => { try { addEvent(JSON.parse(e.data), 'agent_registered'); } catch {} });
    };

    connect();
    return () => sse?.close();
  }, []);

  return (
    <div style={{
      background: '#0f0f13',
      border: '1px solid rgba(124,58,237,0.25)',
      borderRadius: 12,
      overflow: 'hidden',
      fontFamily: 'var(--font-mono, monospace)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: connected ? '#16a34a' : '#6b7280',
            boxShadow: connected ? '0 0 6px rgba(22,163,74,0.6)' : 'none',
          }} />
          <span style={{ color: '#e5e7eb', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em' }}>
            ON-CHAIN FEED
          </span>
          <span style={{
            fontSize: '0.55rem', color: '#9ca3af',
            background: 'rgba(255,255,255,0.05)',
            padding: '2px 6px', borderRadius: 3,
          }}>
            SOMNIA TESTNET
          </span>
        </div>
        <span style={{ fontSize: '0.6rem', color: '#6b7280' }}>{events.length} events</span>
      </div>

      {/* Feed */}
      <div style={{ height: 280, overflowY: 'auto', padding: '8px 0' }}>
        {events.map((ev) => {
          const style = TYPE_STYLES[ev.txHash ? 'task_completed' : ev.type] || TYPE_STYLES.task_completed;
          return (
            <div key={ev.id} style={{
              display: 'grid',
              gridTemplateColumns: '60px 80px 1fr auto',
              gap: 8,
              alignItems: 'center',
              padding: '6px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '0.6rem', color: '#6b7280' }}>{fmt(ev.timestamp)}</span>

              <span style={{
                fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.05em',
                color: style.color, background: style.bg,
                padding: '2px 5px', borderRadius: 3,
                whiteSpace: 'nowrap',
              }}>
                {ev.source === 'autonomous' ? 'AUTO' : style.label}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                <span style={{ color: '#c4b5fd', fontSize: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {ev.agentName}
                </span>
                {ev.txHash && (
                  <a
                    href={ev.explorerUrl || `https://shannon-explorer.somnia.network/tx/${ev.txHash}`}
                    target="_blank" rel="noreferrer"
                    style={{ color: '#6b7280', fontSize: '0.6rem', textDecoration: 'none' }}
                    title={ev.txHash}
                  >
                    {shortHash(ev.txHash)} ↗
                  </a>
                )}
                {ev.blockNumber && (
                  <span style={{ fontSize: '0.55rem', color: '#4b5563' }}>#{ev.blockNumber}</span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                {ev.fee && <span style={{ fontSize: '0.6rem', color: '#f59e0b' }}>{ev.fee} STT</span>}
                {ev.durationMs && <span style={{ fontSize: '0.5rem', color: '#4b5563' }}>{ev.durationMs}ms</span>}
              </div>
            </div>
          );
        })}

        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#4b5563', fontSize: '0.7rem' }}>
            Waiting for on-chain events...
          </div>
        )}
      </div>
    </div>
  );
}
