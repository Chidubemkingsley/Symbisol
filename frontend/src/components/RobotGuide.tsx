'use client';

import React, { useState, useEffect, useRef } from 'react';

// ── FAQ data ────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "What is SYMBISOL?",
    a: "SYMBISOL is an AI agent marketplace on Solana. You type a task, and a Manager Agent automatically hires specialist AI agents to complete it — paying each one in SOL on-chain. No human middleman needed.",
  },
  {
    q: "How do I use it?",
    a: "Just type anything in the chat box — like \"Research quantum computing\" or \"Solve 42 * (7 + 3)\". The Manager Agent reads your request, picks the best worker agents, pays them, and returns the result.",
  },
  {
    q: "What is x402?",
    a: "x402 is a payment protocol built on HTTP 402 (\"Payment Required\"). When an agent calls a service, the server replies with a Solana invoice. The agent pays it on-chain, then retries — all automatically in milliseconds.",
  },
  {
    q: "What is A2A hiring?",
    a: "Agent-to-Agent (A2A) hiring means agents can hire other agents. For example, the Research Agent might hire the Summarizer and Sentiment agents to help. You can watch this happen live in the topology graph.",
  },
  {
    q: "Do I need a wallet?",
    a: "Not to watch the demo — the backend has its own funded wallet. If you want to send real payments, connect a Phantom or Solflare wallet using the button in the top-right corner.",
  },
  {
    q: "What is the topology graph?",
    a: "The animated graph shows the live payment network: YOU → Manager Agent → Worker Agents. Green lines are standard payments, teal lines are A2A recursive hires. Dots moving along lines are live transactions.",
  },
  {
    q: "What is reputation?",
    a: "Every agent has a reputation score (0–10,000). It goes up +50 for each completed job and down -100 for failures. The Manager Agent uses reputation to pick the best worker for each task.",
  },
  {
    q: "What is the Protocol Trace panel?",
    a: "It shows the raw x402 handshake — the actual HTTP 402 headers, payment payloads, and Solana transaction signatures. It's full transparency into how machine-to-machine payments work.",
  },
  {
    q: "What is God Mode / Stress Test?",
    a: "Clicking the Stress Test button fires multiple agent queries simultaneously so you can watch the topology graph light up with many parallel payment flows at once. Great for demos!",
  },
  {
    q: "Is this on mainnet?",
    a: "The smart contract is deployed on Solana Devnet at 5383AVU3XCHu2L4dEVZVGtitekZEuaFBFoxgnFQJJmmB. Devnet SOL has no real value — it's safe to experiment freely.",
  },
];

// ── Robot face SVG ───────────────────────────────────────────────────────────
function RobotFace({ blinking }: { blinking: boolean }) {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Antenna */}
      <line x1="28" y1="2" x2="28" y2="10" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="28" cy="2" r="2.5" fill="#16a34a"/>
      {/* Head */}
      <rect x="6" y="10" width="44" height="36" rx="10" fill="#ffffff" stroke="#16a34a" strokeWidth="2.5"/>
      {/* Eyes */}
      {blinking ? (
        <>
          <rect x="14" y="22" width="10" height="2.5" rx="1.25" fill="#16a34a"/>
          <rect x="32" y="22" width="10" height="2.5" rx="1.25" fill="#16a34a"/>
        </>
      ) : (
        <>
          <circle cx="19" cy="24" r="5" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2"/>
          <circle cx="37" cy="24" r="5" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2"/>
          <circle cx="20" cy="24" r="2" fill="#16a34a"/>
          <circle cx="38" cy="24" r="2" fill="#16a34a"/>
          {/* Eye shine */}
          <circle cx="21" cy="23" r="0.8" fill="#ffffff"/>
          <circle cx="39" cy="23" r="0.8" fill="#ffffff"/>
        </>
      )}
      {/* Mouth */}
      <path d="M18 34 Q28 40 38 34" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Cheek blush */}
      <circle cx="11" cy="30" r="3" fill="#bbf7d0" opacity="0.7"/>
      <circle cx="45" cy="30" r="3" fill="#bbf7d0" opacity="0.7"/>
      {/* Ear bolts */}
      <rect x="2" y="22" width="4" height="8" rx="2" fill="#16a34a" opacity="0.6"/>
      <rect x="50" y="22" width="4" height="8" rx="2" fill="#16a34a" opacity="0.6"/>
    </svg>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', marginLeft: 4 }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#16a34a',
            display: 'inline-block',
            animation: `robotDot 1.2s ${i * 0.2}s ease-in-out infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes robotDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RobotGuide() {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [typing, setTyping] = useState(false);
  const [displayedAnswer, setDisplayedAnswer] = useState('');
  const [blinking, setBlinking] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Blink every 3–5 seconds
  useEffect(() => {
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    };
    const id = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  // Pulse the button every 8s to attract attention
  useEffect(() => {
    const id = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // Greeting on first open
  useEffect(() => {
    if (open && !hasGreeted) {
      setHasGreeted(true);
    }
  }, [open, hasGreeted]);

  // Typewriter effect
  const typeAnswer = (text: string) => {
    setTyping(true);
    setDisplayedAnswer('');
    let i = 0;
    if (typingRef.current) clearInterval(typingRef.current);
    typingRef.current = setInterval(() => {
      i++;
      setDisplayedAnswer(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(typingRef.current!);
        setTyping(false);
      }
    }, 18);
  };

  const handleQuestion = (idx: number) => {
    if (activeIdx === idx) {
      setActiveIdx(null);
      setDisplayedAnswer('');
      return;
    }
    setActiveIdx(idx);
    typeAnswer(FAQ[idx].a);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      {/* ── Floating trigger button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Ask the guide robot"
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          width: 68,
          height: 68,
          borderRadius: '50%',
          background: '#ffffff',
          border: '2.5px solid #16a34a',
          boxShadow: pulse
            ? '0 0 0 8px rgba(22,163,74,0.15), 4px 4px 0 0 #09090b'
            : '4px 4px 0 0 #09090b',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'box-shadow 0.3s, transform 0.15s',
          transform: open ? 'scale(0.95)' : 'scale(1)',
          padding: 0,
        }}
        aria-label="Open guide robot"
      >
        <RobotFace blinking={blinking} />
        {/* Notification dot */}
        {!open && (
          <span style={{
            position: 'absolute',
            top: 4, right: 4,
            width: 12, height: 12,
            borderRadius: '50%',
            background: '#16a34a',
            border: '2px solid #fff',
            animation: 'pulse 2s infinite',
          }} />
        )}
      </button>

      {/* ── Panel ── */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            bottom: 108,
            right: 28,
            width: 360,
            maxHeight: '70vh',
            background: '#ffffff',
            border: '2.5px solid #16a34a',
            borderRadius: 16,
            boxShadow: '6px 6px 0 0 #09090b',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeInUp 0.2s ease',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 44, height: 44,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <RobotFace blinking={blinking} />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                SYMBI — Guide Bot
              </div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem', marginTop: 2 }}>
                Ask me anything about SYMBISOL ✦
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                marginLeft: 'auto', background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6,
                color: '#fff', width: 28, height: 28, cursor: 'pointer',
                fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label="Close"
            >×</button>
          </div>

          {/* Answer display */}
          {activeIdx !== null && (
            <div style={{
              padding: '14px 18px',
              background: '#f0fdf4',
              borderBottom: '1px solid #bbf7d0',
              fontSize: '0.82rem',
              color: '#14532d',
              lineHeight: 1.6,
              minHeight: 64,
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#16a34a', marginBottom: 6, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                {FAQ[activeIdx].q}
              </div>
              <span>{displayedAnswer}</span>
              {typing && <TypingDots />}
            </div>
          )}

          {/* Questions list */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
            {!hasGreeted && (
              <div style={{ padding: '10px 18px 6px', fontSize: '0.78rem', color: '#52525b', lineHeight: 1.5 }}>
                👋 Hi! I'm <strong style={{ color: '#16a34a' }}>SYMBI</strong>, your guide. Tap a question below to learn how SYMBISOL works.
              </div>
            )}
            {FAQ.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleQuestion(idx)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 18px',
                  background: activeIdx === idx ? '#f0fdf4' : 'transparent',
                  border: 'none',
                  borderLeft: activeIdx === idx ? '3px solid #16a34a' : '3px solid transparent',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  color: activeIdx === idx ? '#15803d' : '#374151',
                  fontWeight: activeIdx === idx ? 700 : 500,
                  transition: 'all 0.12s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  lineHeight: 1.4,
                }}
                onMouseEnter={e => {
                  if (activeIdx !== idx) {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.color = '#111827';
                  }
                }}
                onMouseLeave={e => {
                  if (activeIdx !== idx) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#374151';
                  }
                }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: activeIdx === idx ? '#16a34a' : '#f0fdf4',
                  border: `1.5px solid ${activeIdx === idx ? '#16a34a' : '#bbf7d0'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 800,
                  color: activeIdx === idx ? '#fff' : '#16a34a',
                  fontFamily: 'var(--font-mono)',
                  transition: 'all 0.12s',
                }}>
                  {idx + 1}
                </span>
                {item.q}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 18px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#fafafa',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.65rem', color: '#6b7280', fontFamily: 'var(--font-mono)' }}>
              SYMBI v1.0 · Powered by SYMBISOL
            </span>
          </div>
        </div>
      )}
    </>
  );
}
