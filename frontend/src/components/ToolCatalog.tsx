import React, { useState, useEffect } from 'react';
import { Globe, Box, WifiOff, RefreshCw } from 'lucide-react';
import { getAgentIcon, getAgentColor } from './AgentIcons';
import { useI18n } from '@/lib/LanguageContext';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002').replace(/\/$/, '');

interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  token: string;
  canHireSubAgents: boolean;
  reputation: number;
  isExternal?: boolean;
  mcpCompatible?: boolean;
}

// Static fallback shown when backend is unreachable
const FALLBACK_TOOLS: Tool[] = [
  { id: 'weather', name: 'Weather Oracle', category: 'data', description: 'Hyper-local weather data and atmospheric insights.', price: '0.001', token: 'STT', canHireSubAgents: false, reputation: 92 },
  { id: 'summarize', name: 'Summarizer Pro', category: 'nlp', description: 'Advanced NLP engine for condensing research into executive summaries.', price: '0.003', token: 'STT', canHireSubAgents: false, reputation: 88 },
  { id: 'mathSolve', name: 'MathSolver v3', category: 'compute', description: 'High-precision symbolic mathematics and statistical computation.', price: '0.005', token: 'STT', canHireSubAgents: false, reputation: 95 },
  { id: 'sentiment', name: 'SentimentAI', category: 'nlp', description: 'Real-time emotional tone analysis and market sentiment tracking.', price: '0.002', token: 'STT', canHireSubAgents: false, reputation: 79 },
  { id: 'codeExplain', name: 'CodeExplainer', category: 'code', description: 'Expert-level code analysis, refactoring suggestions, and documentation.', price: '0.004', token: 'STT', canHireSubAgents: false, reputation: 91 },
  { id: 'research', name: 'DeepResearch Alpha', category: 'research', description: 'Full-spectrum autonomous researcher with recursive sub-agent hiring.', price: '0.01', token: 'STT', canHireSubAgents: true, reputation: 94 },
  { id: 'coding', name: 'AutoCoder Elite', category: 'code', description: 'High-speed software architect for autonomous code synthesis and PR review.', price: '0.02', token: 'STT', canHireSubAgents: true, reputation: 94 },
  { id: 'translate', name: 'PolyglotAI', category: 'nlp', description: 'Real-time multi-language translation and localization bridge.', price: '0.005', token: 'STT', canHireSubAgents: false, reputation: 82 },
];

export default function ToolCatalog() {
  const { t } = useI18n();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const fetchTools = async () => {
    setRetrying(true);
    setError(false);
    try {
      const res = await fetch(`${API}/api/tools`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const formatted = (Array.isArray(data) ? data : data.tools || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        description: t.description,
        price: t.price?.STT || 0,
        token: 'STT',
        canHireSubAgents: t.canHireSubAgents,
        reputation: t.reputation || 95,
        isExternal: t.isExternal,
        mcpCompatible: t.mcpCompatible,
      }));
      setTools(formatted.length > 0 ? formatted : FALLBACK_TOOLS);
    } catch {
      setError(true);
      setTools(FALLBACK_TOOLS);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => { fetchTools(); }, []);

  if (loading) return (
    <div className="mono" style={{ padding: 20, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      {t.loadingAgents}
    </div>
  );

  return (
    <div style={{
      marginTop: 24,
      padding: 24,
      border: 'var(--border-width) solid var(--border-strong)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-secondary)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h3 className="mono" style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Box size={20} /> {t.availableAgents}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
              <WifiOff size={12} />
              <span>Backend offline — showing cached agents</span>
              <button
                onClick={fetchTools}
                disabled={retrying}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', padding: 0, display: 'flex', alignItems: 'center' }}
                title="Retry"
              >
                <RefreshCw size={12} style={{ animation: retrying ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            </div>
          )}
          <div className="badge badge-stx">
            <Globe size={12} style={{ marginRight: 6 }} />
            {t.globalNetwork}
          </div>
        </div>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}
        className="tool-grid-responsive"
      >
        {tools.map(tool => (
          <AgentCard key={tool.id} tool={tool} />
        ))}
      </div>
      <style jsx>{`
        @media (max-width: 480px) {
          .tool-grid-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}


function AgentCard({ tool }: { tool: Tool }) {

  const Icon = getAgentIcon(tool.id);
  const color = getAgentColor(tool.id);

  return (
    <div
      className="agent-card"
      style={{
        background: 'var(--bg-primary)',
        border: 'var(--border-width) solid var(--border-strong)',
        borderRadius: 'var(--radius-sm)',
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.1s',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-sm)'
      }}
      onMouseEnter={e => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={e => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.borderColor = 'var(--border-strong)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44,
            background: `${color}15`,
            border: `var(--border-width) solid ${color}`,
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '2px 2px 0 0 rgba(0,0,0,0.1)',
            color: 'var(--text-primary)'
          }}>
            {/* eslint-disable-next-line */}
            <Icon size={24} color={color} strokeWidth={2.5} />
          </div>
           <div>
             <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#111111' }}>{tool.name}</h4>
             <span className="mono" style={{ fontSize: '0.7rem', color: '#111111', fontWeight: 600 }}>{tool.category}</span>
           </div>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#111111', lineHeight: 1.5, marginBottom: 20, flex: 1, fontWeight: 500 }}>
        {tool.description}
      </p>

      <div style={{
        paddingTop: 16,
        borderTop: '1px dashed var(--border-strong)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {tool.mcpCompatible && (
            <div style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              background: 'var(--info)',
              color: '#fff',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-strong)'
            }}>
              MCP
            </div>
          )}
          {tool.canHireSubAgents && (
            <div style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              background: 'var(--accent-500)',
              color: '#fff',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-strong)'
            }}>
              A2A
            </div>
          )}
        </div>

          <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111111' }}>
            {Number(tool.price) > 0 ? `${tool.price} ${tool.token}` : 'FREE'}
          </div>
      </div>
    </div>
  );
}
