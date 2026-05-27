'use client';

import React from 'react';
import { BookOpen, Cpu, Globe, Network, Shield, Zap, Activity } from 'lucide-react';

const DOCS_CONTENT = [
  {
    title: 'What is SomniaSwarm?',
    icon: <Cpu size={20} />,
    content: `SomniaSwarm is a decentralized multi-agent orchestration framework built on Somnia's Agentic L1. It enables autonomous AI agents to discover each other via an on-chain registry, decompose complex tasks, coordinate execution, and verify results — all using Somnia's native infrastructure.

Key differences from traditional agent systems:
- Agents run on decentralized validator nodes via Somnia Agents
- AI decisions are deterministic and verifiable through consensus
- Inter-agent communication uses Somnia Data Streams
- Event-driven triggers execute in the same block via On-Chain Reactivity`,
  },
  {
    title: 'Architecture Overview',
    icon: <Network size={20} />,
    content: `The system has four layers:

1. Coordinator Agent — Receives natural language queries, decomposes into subtasks, evaluates worker agents by reputation and efficiency, and dispatches work.

2. Worker Agents — Specialized agents (Research, Analysis, Oracle, Summary, Code, Translation) that execute specific tasks. Each agent is registered on-chain with verifiable reputation.

3. Somnia Blockchain Layer — Smart contracts (AgentRegistry, AgentVault, TaskManager), Data Streams for communication, and On-Chain Reactivity for event-driven execution.

4. Frontend — Next.js dashboard with real-time visualization of agent activities, task logs, and protocol traces.

The Coordinator agent uses task decomposition to break down complex queries. For example, "Research AI agents and analyze sentiment" would:
- Step 1: ResearchAgent fetches Wikipedia/API data
- Step 2: AnalysisAgent processes the data for sentiment`,
  },
  {
    title: 'Agents & Capabilities',
    icon: <Activity size={20} />,
    content: `Each agent in the swarm has on-chain registered capabilities:

ResearchAgent — web-search, data-collection, wikipedia
AnalysisAgent — llm, text-analysis, sentiment
DataOracleAgent — json-api, price-feed, weather
SummaryAgent — summarization, text-generation
CodeAgent — code-generation, solidity, review
TranslationAgent — translation, multi-language
WeatherAgent — weather, forecast
SentimentAgent — sentiment, emotion-detection

Agents are evaluated using:
Value Score = reputation² / (price × 10,000)
This ensures the Coordinator selects the most cost-effective agent for each task.`,
  },
  {
    title: 'Somnia Agentic L1 Integration',
    icon: <Zap size={20} />,
    content: `SomniaSwarm leverages every major Somnia primitive:

1. Somnia Agent Kit — SDK for agent lifecycle management, vault operations, and on-chain registry. Initialized with deployed contract addresses on Somnia Testnet.

2. Somnia Agents (Decentralized Compute) — JSON API Request for external data fetching, LLM Inference for deterministic AI decision-making, LLM Parse Website for web scraping, and Find URL for Topic for content discovery.

3. Somnia Data Streams — Structured on-chain data channels for agent communication. Events are published for agent registration, task creation, task completion, and system events.

4. On-Chain Reactivity — Event-driven agent triggers that execute in the same block as the triggering event, enabling sub-second response chains.

5. Smart Contracts — Solidity contracts for AgentRegistry (discovery), AgentVault (funds), and TaskManager (lifecycle).`,
  },
  {
    title: 'Smart Contracts',
    icon: <Shield size={20} />,
    content: `Three Solidity smart contracts power the on-chain layer:

AgentRegistry.sol:
- Register agents with name, endpoint, category, capabilities, price
- Discover agents by category or capability
- Rate and track reputation (0-10,000 basis points)
- Record job completions and failures

AgentVault.sol:
- Create vaults for each agent with daily withdrawal limits
- Deposit and withdraw STT tokens
- Lock/unlock vaults for security
- Transfer between agent vaults

TaskManager.sol:
- Create tasks with agent assignments
- Track task lifecycle (Assigned → Completed/Failed/Disputed)
- Verify task completion on-chain
- Record reputation updates

Deployed on Somnia Testnet (Chain ID: 50312)`,
  },
  {
    title: 'Getting Started',
    icon: <BookOpen size={20} />,
    content: `To run SomniaSwarm locally:

1. Install dependencies:
   npm run install:all

2. Configure backend/.env:
   SOMNIA_NETWORK=testnet
   SOMNIA_PRIVATE_KEY=your_key_here

3. Start the backend:
   cd backend && npm run dev

4. Start the frontend:
   cd frontend && npm run dev

5. Open http://localhost:3000

Try these queries in the Agent Chat:
- "Research quantum computing breakthroughs"
- "What's the weather in Tokyo and BTC price?"
- "Write a Solidity contract for token staking"
- "Analyze the sentiment of this market update"
- "Summarize the latest AI developments"`,
  },
  {
    title: 'System Requirements',
    icon: <Globe size={20} />,
    content: `- Node.js 18+ for the backend and CLI agent
- npm for workspace management
- An EVM wallet (MetaMask recommended) for frontend connection
- STT testnet tokens for on-chain transactions (optional — simulation mode works without a wallet)

No external API keys are required — the system works fully in simulation mode, demonstrating all agent orchestration capabilities without real on-chain transactions.

For production deployment on Render, the render.yaml provides a one-click deployment configuration with both backend and frontend services.`,
  },
];

export default function DocsPage() {
  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 className="mono" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 12, letterSpacing: '-0.04em' }}>
          Documentation
        </h1>
        <p className="mono" style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: 600 }}>
          Comprehensive guide to the SomniaSwarm — decentralized agent swarm on Somnia Agentic L1
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {DOCS_CONTENT.map((section, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: 32, border: 'var(--border-strong)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36,
                background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
              }}>
                {section.icon}
              </div>
              <h2 className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {section.title}
              </h2>
            </div>
            <div style={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
