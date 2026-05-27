'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Terminal, Loader2, Shield, Zap, Activity, ExternalLink, CheckCircle2 } from 'lucide-react';
import { A2ATopology } from './A2ATopology';
import { getAgentIcon, getAgentColor } from './AgentIcons';
import { useI18n } from '@/lib/LanguageContext';

interface Params {
  onNewPayments: (amount: number) => void;
  onProtocolTrace: (log: any) => void;
}

interface StepCard {
  index: number;
  agentId: number;
  agentName: string;
  description: string;
  status: 'running' | 'done' | 'error';
  result?: any;
  txHash?: string;
  explorerUrl?: string;
  blockNumber?: number;
  fee?: string;
  durationMs?: number;
}

interface Message {
  role: 'user' | 'system' | 'assistant';
  content: string;
  cost?: number;
  steps?: StepCard[];
  subAgentHires?: any[];
}

const SimpleMarkdown = ({ text }: { text: string }) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i} style={{ color: 'var(--accent-primary)' }}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('`') && part.endsWith('`'))
          return <code key={i} style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', color: '#7C3AED', fontSize: '0.85em' }}>{part.slice(1, -1)}</code>;
        return part;
      })}
    </span>
  );
};

function ResultCard({ step }: { step: StepCard }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = getAgentIcon(step.agentName);
  const color = getAgentColor(step.agentName);
  const isDone = step.status === 'done';

  const renderResult = (r: any): string => {
    if (!r) return '';
    if (typeof r === 'string') return r;
    // Pick the most readable field
    const priority = ['summary','interpretation','translated','result','code','forecast','agentNote'];
    for (const key of priority) {
      if (r[key] && typeof r[key] === 'string') return r[key];
    }
    return JSON.stringify(r, null, 2).slice(0, 400);
  };

  return (
    <div style={{
      border: `1px solid ${isDone ? 'rgba(22,163,74,0.25)' : 'rgba(124,58,237,0.2)'}`,
      borderRadius: 10,
      overflow: 'hidden',
      background: isDone ? 'rgba(22,163,74,0.03)' : 'rgba(124,58,237,0.03)',
      marginBottom: 8,
    }}>
      {/* Step header */}
      <div
        onClick={() => isDone && setExpanded(x => !x)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', cursor: isDone ? 'pointer' : 'default',
        }}
      >
        <div style={{ color, flexShrink: 0 }}><Icon size={16} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: '#111827' }}>
              {step.agentName}
            </span>
            {step.fee && (
              <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontFamily: 'var(--font-mono)', background: 'rgba(245,158,11,0.1)', padding: '1px 5px', borderRadius: 3 }}>
                {step.fee} STT
              </span>
            )}
            {step.durationMs && (
              <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>{step.durationMs}ms</span>
            )}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {step.description}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {step.txHash && (
            <a
              href={step.explorerUrl || `https://shannon-explorer.somnia.network/tx/${step.txHash}`}
              target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: '0.6rem', color: '#7C3AED', fontFamily: 'var(--font-mono)',
                background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                padding: '3px 7px', borderRadius: 4, textDecoration: 'none',
              }}
              title={step.txHash}
            >
              {step.txHash.slice(0, 6)}…{step.txHash.slice(-4)}
              <ExternalLink size={10} />
            </a>
          )}
          {isDone
            ? <CheckCircle2 size={16} color="#16a34a" />
            : <Loader2 size={16} className="spin" color="#7C3AED" />
          }
        </div>
      </div>

      {/* Expanded result */}
      {expanded && isDone && step.result && (
        <div style={{
          padding: '0 14px 12px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }}>
          {typeof step.result === 'object' && step.result.keyFindings ? (
            // Research-style result
            <div style={{ fontSize: '0.8rem', lineHeight: 1.6, color: '#374151' }}>
              <p style={{ margin: '8px 0 6px', color: '#111827' }}>{step.result.summary}</p>
              {step.result.keyFindings?.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {step.result.keyFindings.map((f: string, i: number) => (
                    <li key={i} style={{ marginBottom: 2 }}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : typeof step.result === 'object' && step.result.code ? (
            // Code result
            <pre style={{
              margin: '8px 0 0', padding: 10,
              background: '#f8f9fa', border: '1px solid #e5e7eb',
              borderRadius: 6, fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)', overflow: 'auto', maxHeight: 200,
              color: '#1f2937',
            }}>
              {step.result.code.slice(0, 600)}
            </pre>
          ) : (
            <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#374151', lineHeight: 1.6 }}>
              {renderResult(step.result)}
            </p>
          )}
          {step.result.agentNote && (
            <div style={{ marginTop: 6, fontSize: '0.65rem', color: '#9ca3af', fontStyle: 'italic' }}>
              Agent note: {step.result.agentNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002').replace(/\/$/, '');

export default function AgentChat({ onNewPayments, onProtocolTrace }: Params) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'planning' | 'executing' | 'verifying'>('idle');
  const [activeSteps, setActiveSteps] = useState<StepCard[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeSteps]);

  // SSE for live step updates
  useEffect(() => {
    let sse: EventSource | null = null;
    let retries = 0;
    const MAX = 5;

    const connect = () => {
      if (retries >= MAX) return;
      sse = new EventSource(`${API}/api/events`);
      sse.onopen = () => { retries = 0; };
      sse.onerror = () => {
        sse?.close();
        retries++;
        setTimeout(connect, Math.min(3000 * Math.pow(1.5, retries - 1), 15000));
      };

      sse.addEventListener('step_started', (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          if (d.source === 'autonomous') return; // Don't clutter user chat with autonomous steps
          setAgentStatus('executing');
          setActiveSteps(prev => [...prev, {
            index: d.index, agentId: d.agentId,
            agentName: d.agentName || `Agent #${d.agentId}`,
            description: d.description, status: 'running',
          }]);
          onProtocolTrace({ type: 'step_started', ...d });
        } catch {}
      });

      sse.addEventListener('step_completed', (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          if (d.source === 'autonomous') { onProtocolTrace({ type: 'step_completed', ...d }); return; }
          setActiveSteps(prev => prev.map(s =>
            s.index === d.index
              ? { ...s, status: 'done', result: d.result, txHash: d.txHash, explorerUrl: d.explorerUrl, blockNumber: d.blockNumber, fee: d.fee, durationMs: d.durationMs, agentName: d.agentName || s.agentName }
              : s
          ));
          onProtocolTrace({ type: 'step_completed', ...d });
          if (d.fee) onNewPayments(parseFloat(d.fee));
        } catch {}
      });

      sse.addEventListener('plan_created', (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          if (d.source !== 'autonomous') setAgentStatus('planning');
        } catch {}
      });

      sse.addEventListener('query_completed', (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          if (d.source === 'autonomous') return;
          setAgentStatus('idle');
          setIsProcessing(false);
        } catch {}
      });

      sse.addEventListener('query_error', (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          if (d.source === 'autonomous') return;
          setMessages(prev => [...prev, { role: 'system', content: `❌ **Error:** ${d.error}` }]);
          setAgentStatus('idle');
          setIsProcessing(false);
          setActiveSteps([]);
        } catch {}
      });
    };

    connect();
    return () => sse?.close();
  }, [onProtocolTrace, onNewPayments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    const userMsg = query.trim();
    setQuery('');
    setActiveSteps([]);
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsProcessing(true);
    setAgentStatus('planning');

    try {
      const res = await fetch(`${API}/api/agent/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const steps: StepCard[] = (data.results || []).map((r: any, i: number) => ({
        index: i, agentId: r.agentId, agentName: r.agentName,
        description: r.description, status: 'done', result: r.result,
        txHash: r.txHash, explorerUrl: r.explorerUrl, blockNumber: r.blockNumber,
        fee: r.fee, durationMs: r.durationMs,
      }));

      const totalFee = (data.results || []).reduce((s: number, r: any) => s + parseFloat(r.fee || '0'), 0);

      setMessages(prev => [...prev, { role: 'assistant', content: '', steps, cost: totalFee }]);
      setActiveSteps([]);
      setAgentStatus('idle');
      setIsProcessing(false);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'system', content: `❌ **Error:** ${err.message}` }]);
      setAgentStatus('idle');
      setIsProcessing(false);
      setActiveSteps([]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ paddingBottom: 16, borderBottom: '2px solid var(--border-strong)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: '#7C3AED', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}>
            <Terminal size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, color: '#111827' }}>{t.managerAgent}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: agentStatus === 'idle' ? '#d1d5db' : '#16a34a', boxShadow: agentStatus !== 'idle' ? '0 0 6px rgba(22,163,74,0.6)' : 'none' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase' }}>
                {agentStatus === 'idle' ? 'standby' : agentStatus}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 6, padding: '4px 10px' }}>
            <Shield size={11} color="#7C3AED" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, color: '#7C3AED' }}>SOMNIA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 6, padding: '4px 10px' }}>
            <Zap size={11} color="#16a34a" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, color: '#16a34a' }}>AGENTIC L1</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 4, marginBottom: 12 }}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isSystem = msg.role === 'system';

          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase' }}>
                {isUser ? 'You' : isSystem ? 'System' : 'Agent Swarm'}
              </span>

              {isUser || isSystem ? (
                <div style={{
                  maxWidth: '85%', padding: '12px 16px',
                  background: isUser ? '#f0f7ff' : '#fafafa',
                  border: `1px solid ${isUser ? 'rgba(124,58,237,0.2)' : '#e5e7eb'}`,
                  borderRadius: 12, fontSize: '0.9rem', lineHeight: 1.6, color: '#111827',
                }}>
                  <SimpleMarkdown text={msg.content} />
                </div>
              ) : (
                <div style={{ width: '100%' }}>
                  {msg.steps?.map((step, i) => <ResultCard key={i} step={step} />)}
                  {msg.cost !== undefined && msg.cost > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#f59e0b' }}>
                      <Zap size={12} />
                      Total: {msg.cost.toFixed(3)} STT paid on-chain
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Live in-progress steps */}
        {activeSteps.length > 0 && (
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#9ca3af', textTransform: 'uppercase' }}>Agent Swarm</span>
            <div style={{ marginTop: 4 }}>
              {activeSteps.map((step, i) => <ResultCard key={i} step={step} />)}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t.placeholder || 'Ask the agent swarm anything…'}
          disabled={isProcessing}
          style={{
            width: '100%', background: '#f8f9fa', border: '1px solid #e5e7eb',
            color: '#111827', padding: '14px 52px 14px 16px', fontSize: '0.95rem',
            borderRadius: 10, outline: 'none', fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
          onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
        />
        <button
          type="submit"
          disabled={!query.trim() || isProcessing}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: query.trim() && !isProcessing ? '#7C3AED' : '#d1d5db',
            border: 'none', color: '#fff', width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 7, cursor: query.trim() && !isProcessing ? 'pointer' : 'default',
            transition: 'all 0.15s',
          }}
        >
          {isProcessing ? <Loader2 size={18} className="spin" /> : <Send size={18} strokeWidth={2.5} />}
        </button>
      </form>

      {isProcessing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#9ca3af' }}>
          <Activity size={13} className="spin" color="#7C3AED" />
          {t.thinking || 'Swarm is thinking…'}
        </div>
      )}
    </div>
  );
}
