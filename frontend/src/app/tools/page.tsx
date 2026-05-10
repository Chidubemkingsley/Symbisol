'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAgentIcon, getAgentColor } from '@/components/AgentIcons';
import { RefreshCw, WifiOff, ExternalLink } from 'lucide-react';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002').replace(/\/$/, '');

interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  price: { SOL: number; USDC_lamports: number };
  endpoint: string;
  method: string;
  reputation: number;
  jobsCompleted: number;
  efficiency: number;
  canHireSubAgents: boolean;
  isExternal?: boolean;
  params?: Record<string, string>;
}

export default function ToolsPage() {
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchTools = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API}/api/tools`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTools(Array.isArray(data) ? data : data.tools || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTools(); }, []);

  const categories = ['All', ...new Set(tools.map(t => t.category))];

  const filteredTools = selectedCategory === 'All'
    ? tools
    : tools.filter(t => t.category === selectedCategory);

  const useTool = (tool: Tool) => {
    const query = tool.canHireSubAgents
      ? `use ${tool.name} to help me`
      : `call ${tool.name}`;
    router.push(`/?query=${encodeURIComponent(query)}`);
  };

  return (
    <div style={{ padding: '40px 0' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 className="mono" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 12, color: '#000000' }}>
          Tool Catalog
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#333333', maxWidth: 700 }}>
          Browse available x402-gated agent tools. Pay-per-use with instant Solana micropayments.
        </p>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap', alignItems: 'center' }}>
        {categories.map((category) => (
          <button
            key={category}
            className="mono"
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-sm)',
              border: selectedCategory === category
                ? '1px solid rgba(168, 85, 247, 0.4)'
                : '1px solid rgba(168, 85, 247, 0.2)',
              backgroundColor: selectedCategory === category
                ? 'rgba(168, 85, 247, 0.15)'
                : 'transparent',
              color: selectedCategory === category ? '#000000' : '#4b5563',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#f59e0b' }}>
            <WifiOff size={12} /> Backend unreachable
            <button onClick={fetchTools} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <RefreshCw size={12} />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="mono" style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading tools...</div>
      ) : filteredTools.length === 0 ? (
        <div className="mono" style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>No tools found for this category.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredTools.map((tool) => {
            const Icon = getAgentIcon(tool.id);
            const color = getAgentColor(tool.id);
            return (
              <div
                key={tool.id}
                className="glass-panel"
                style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ color }}>
                      <Icon size={22} />
                    </div>
                    <h3 className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#000000' }}>
                      {tool.name}
                    </h3>
                    <span className="badge" style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}>
                      {tool.category}
                    </span>
                    {tool.canHireSubAgents && (
                      <span className="badge" style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#d97706', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                        A2A
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.95rem', color: '#333333', marginBottom: 12 }}>
                    {tool.description}
                  </p>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Endpoint: </span>
                      <code className="mono" style={{ fontSize: '0.85rem', color: '#9333ea', backgroundColor: 'rgba(168, 85, 247, 0.1)', padding: '2px 8px', borderRadius: 4 }}>
                        {tool.endpoint}
                      </code>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Reputation: </span>
                      <span className="mono" style={{ fontSize: '0.85rem', color: '#000000', fontWeight: 600 }}>
                        {tool.reputation}/100
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Jobs: </span>
                      <span className="mono" style={{ fontSize: '0.85rem', color: '#000000', fontWeight: 600 }}>
                        {tool.jobsCompleted.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: 4 }}>Price per call</div>
                    <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>
                      {tool.price.SOL} SOL
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ minWidth: 140, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
                    onClick={() => useTool(tool)}
                  >
                    <ExternalLink size={14} /> Use Tool
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
