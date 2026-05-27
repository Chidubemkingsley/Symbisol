'use client';

import React, { useState, useEffect } from 'react';
import { X, Bot } from 'lucide-react';

const FAQS = [
  {
    q: "What is SomniaSwarm?",
    a: "SomniaSwarm is a decentralized AI agent swarm on Somnia. You type a task, and the Coordinator Agent automatically decomposes it, discovers specialized worker agents from the on-chain registry, and dispatches each subtask autonomously.",
  },
  {
    q: "How do agents pay each other?",
    a: "Agents use the AgentVault smart contract for fund management. Each agent has a vault with configurable daily limits. Inter-agent transfers happen via vault-to-vault transfers, all recorded on the Somnia blockchain.",
  },
  {
    q: "What is an Agent Registry?",
    a: "The AgentRegistry is a Solidity smart contract that stores agent metadata including name, capabilities, price, and reputation. Agents are discovered by querying this registry, enabling autonomous agent-to-agent coordination.",
  },
  {
    q: "What is Agent Efficiency?",
    a: "Efficiency = reputation² / (price × 10,000). This Value Score helps the Coordinator Agent select the most cost-effective agent for each task, considering both quality (reputation) and cost (price).",
  },
  {
    q: "How does autonomous task decomposition work?",
    a: "The Coordinator Agent receives a natural language query, analyzes keywords to identify required capabilities, queries the Agent Registry for matching agents, and creates an execution plan with ordered steps.",
  },
  {
    q: "Is this using real on-chain transactions?",
    a: "The system works in simulation mode without a wallet. When a funded Somnia wallet is configured via SOMNIA_PRIVATE_KEY, it uses real Somnia Agent Kit contracts, Data Streams, and Somnia Agents on the testnet.",
  },
];

export default function RobotGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 56, height: 56,
          background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
          border: 'none', borderRadius: 16,
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
          zIndex: 1000,
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Bot size={28} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      width: 380, maxHeight: '80vh',
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      zIndex: 1000,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
        color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bot size={20} />
          <span className="mono" style={{ fontWeight: 700, fontSize: '0.9rem' }}>SOMNIASWARM GUIDE</span>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      {/* FAQ */}
      <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
        <p className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Frequently Asked Questions
        </p>

        {FAQS.map((faq, idx) => (
          <div key={idx} style={{ marginBottom: 8 }}>
            <button
              onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 16px',
                background: expandedFaq === idx ? '#f5f3ff' : '#f8f9fa',
                border: '1px solid', borderColor: expandedFaq === idx ? 'rgba(124,58,237,0.2)' : '#e5e7eb',
                borderRadius: 8,
                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                color: 'var(--text-primary)',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {faq.q}
            </button>
            {expandedFaq === idx && (
              <div style={{
                padding: '12px 16px',
                fontSize: '0.8rem', color: 'var(--text-secondary)',
                lineHeight: 1.6,
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
              }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
