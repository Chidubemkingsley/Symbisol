# SomniaSwarm — Autonomous Agent Swarm on Somnia Agentic L1

> **A decentralized AI agent swarm where heterogeneous agents autonomously discover each other, decompose complex tasks, coordinate execution, and verify results — all powered by Somnia's Agentic L1 infrastructure.**

> **Built for the Somnia Agentic L1 Hackathon.**

---

## What is SomniaSwarm?

SomniaSwarm is a **systemic multi-agent orchestration framework** built on Somnia's Agentic L1. It demonstrates true agent autonomy, composability, and real-world utility by leveraging:

- **Somnia Agent Kit** — Production SDK for agent lifecycle management, vaults, and on-chain registry
- **Somnia Agents** — Decentralized compute containers for LLM inference, JSON API requests, and website parsing
- **Somnia Data Streams** — Structured, verifiable on-chain data channels for inter-agent communication
- **Somnia On-Chain Reactivity** — Same-block event-driven reactions for real-time agent coordination
- **Somnia EVM Compatibility** — Solidity smart contracts for agent registry, task management, and vaults

### Key Differentiators

| Feature | Description |
|---|---|
| **Agent-First Design** | Agents discover each other via on-chain registry, autonomously form execution plans, and delegate subtasks |
| **Decentralized AI** | Uses Somnia's deterministic LLM inference — AI decisions are verifiable through validator consensus |
| **Data Streams Communication** | Agents publish results and events via Somnia Data Streams for real-time coordination |
| **On-Chain Reactivity** | Event-driven agent triggers execute in the same block, enabling sub-second response chains |
| **Agent Vault System** | Each agent has a secure vault with daily withdrawal limits and inter-agent transfer capabilities |
| **Multi-Agent Orchestration** | Coordinator agent decomposes tasks, evaluates worker agents by reputation/efficiency, and dispatches work |
| **Live Wikipedia Research** | Agents fetch real research data from Wikipedia and other JSON APIs |
| **Protocol Transparency** | Every agent step, decision, and result is captured and visible in the dashboard |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 16 + React 19 + RainbowKit)                      │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────────┐       │
│  │AgentChat │ │EconomyGraph│ │ TxnLog   │ │ProtocolTrace     │       │
│  └────┬─────┘ └───────────┘ └──────────┘ └──────────────────┘       │
│       │ POST /api/agent/query    SSE /api/events                     │
├───────┼──────────────────────────────────────────────────────────────┤
│  BACKEND (Express + Somnia Agent Kit + ethers.js)                    │
│  ┌────▼─────────────────────────────────────────────────────────┐   │
│  │  Coordinator Agent (Task Decomposition via LLM)               │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │ autonomousHiringDecision(reputation, price, category)│    │   │
│  │  └────────────────┬─────────────────────────────────────┘    │   │
│  │                   │                                          │   │
│  │  ┌────────────────┼──────────────────────────────────┐       │   │
│  │  │ Research │ Analysis │ Oracle │ Summary │ Code  │       │   │
│  │  │  1.0 STT  │ 0.5 STT  │ 0.3 STT│ 0.2 STT │ 1.5 STT│      │   │
│  │  └──────────┴──────────┴────────┴─────────┴───────┘       │   │
│  │                                                             │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │ Somnia Agent Kit │ Somnia Agents │ Data Streams    │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│  SOMNIA BLOCKCHAIN (Testnet/Mainnet)                                │
│  ┌───────────────┐ ┌──────────────┐ ┌─────────────────────────┐    │
│  │ AgentRegistry │ │ AgentVault   │ │ TaskManager              │    │
│  │ (Solidity)    │ │ (Solidity)   │ │ (Solidity)              │    │
│  └───────────────┘ └──────────────┘ └─────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Somnia Data Streams │ Somnia On-Chain Reactivity            │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Agent Swarm Members

| Agent | Endpoint | Price | Category | Capabilities |
|---|---|---|---|---|
| ResearchAgent | `/api/agent/research` | 1.0 STT | research | web-search, data-collection, wikipedia |
| AnalysisAgent | `/api/agent/analyze` | 0.5 STT | analysis | llm, text-analysis, sentiment |
| DataOracleAgent | `/api/agent/oracle` | 0.3 STT | oracle | json-api, price-feed, weather |
| SummaryAgent | `/api/agent/summarize` | 0.2 STT | nlp | summarization, text-generation |
| CodeAgent | `/api/agent/code` | 1.5 STT | code | code-generation, solidity, review |
| TranslationAgent | `/api/agent/translate` | 0.4 STT | nlp | translation, multi-language |
| WeatherAgent | `/api/agent/weather` | 0.1 STT | data | weather, forecast |
| SentimentAgent | `/api/agent/sentiment` | 0.25 STT | analysis | sentiment, emotion-detection |

---

## Somnia Integration Points

### 1. Somnia Agent Kit SDK
- Initialized in `backend/src/somnia-client.ts`
- Manages agent registry, task execution, and vault operations
- Uses deployed contract addresses on Somnia Testnet

### 2. Somnia Agents (Decentralized Compute)
- Integrated in `backend/src/somnia-agents.ts`
- **JSON API Request** — Fetch external data with on-chain consensus
- **LLM Inference** — Deterministic AI for autonomous decision-making
- **LLM Parse Website** — Extract structured data from web pages
- **Find URL for Topic** — Discover relevant URLs for research

### 3. Somnia Data Streams
- Integrated in `backend/src/data-streams.ts`
- Real-time agent communication channels
- Event publishing for agent registration, task creation, and completion
- Schema-based structured data on-chain

### 4. On-Chain Reactivity
- Event-driven agent triggers
- Same-block execution for time-sensitive coordination
- Composable event chains

### 5. Smart Contracts (Solidity)
- **AgentRegistry.sol** — On-chain agent registration, discovery, and reputation
- **AgentVault.sol** — Secure agent fund management with daily limits
- **TaskManager.sol** — Task lifecycle management with on-chain verification

### 🚀 Deployed Contracts (Somnia Shannon Testnet)

| Contract | Address |
|---|---|
| **AgentRegistry** | `0x4d608e4de735db23A1c08BDacD8a37aa0b586c6A` |
| **TaskManager** | `0x686B8f061Ecb573917d0d3fda8EC07d6f8cccB44` |
| **AgentVault** | `0x82f6dfC7E66B592B55B28020B86aC783e6a12B20` |

---

## Quick Start

### Prerequisites
- **Node.js 18+**
- **npm** (workspaces support)
- A Somnia wallet with STT testnet tokens
- MetaMask or any EVM wallet (for frontend)

### 1. Install

```bash
git clone <repo-url> && cd SomniaSwarm
npm run install:all
```

### 2. Configure

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env:
#   SOMNIA_PRIVATE_KEY=<your-wallet-private-key>
#   SOMNIA_NETWORK=testnet

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 3. Run

```bash
# Terminal 1: Backend (port 4002)
cd backend && npm run dev

# Terminal 2: Frontend (port 3000)
cd frontend && npm run dev

# Terminal 3: CLI Agent
cd agent && npm start
```

Visit **http://localhost:3000** → the SomniaSwarm dashboard.

---

## Demo Flow

1. **Chat**: Type _"Research quantum computing and summarize the findings"_
2. **Watch**: Coordinator Agent decomposes → plans steps → dispatches to specialized agents
3. **See**: Live topology graph shows agent assignments, Transaction Log captures results, Protocol Trace reveals agent reasoning
4. **Verify**: Every agent step uses Somnia's infrastructure for verifiable execution

### Try these queries:
- "Research AI agents and analyze the sentiment"
- "What's the weather in Tokyo and get the BTC price?"
- "Write a Solidity smart contract for token staking"
- "Summarize the latest developments in quantum computing"
- "Translate 'Hello world' to Spanish and French"
- "Research blockchain scalability and generate a code review"

---

## Deploy to Render

This project includes a `render.yaml` for one-click deployment:

1. Fork/push this repo to GitHub
2. Connect your repo to Render
3. Render will auto-detect `render.yaml`
4. Set the required environment variables:
   - `SOMNIA_PRIVATE_KEY` — Your funded wallet private key
   - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` — From WalletConnect Cloud

---

## Project Structure

```
├── contracts/                     # Solidity smart contracts project
│   ├── contracts/                 # Contract source files
│   │   ├── AgentRegistry.sol      # On-chain agent registry
│   │   ├── AgentVault.sol         # Agent vault management
│   │   └── TaskManager.sol        # Task lifecycle manager
│   ├── scripts/deploy.ts          # Deployment script
│   └── hardhat.config.ts          # Hardhat configuration
├── backend/
│   └── src/
│       ├── index.ts               # Express server + API routes
│       ├── somnia-client.ts       # Somnia Agent Kit integration
│       ├── somnia-agents.ts       # Somnia Agents integration
│       └── data-streams.ts        # Somnia Data Streams
├── agent/
│   └── src/
│       └── somnia-agent.ts        # CLI agent with autonomous orchestration
├── frontend/
│   └── src/
│       ├── app/                   # Next.js pages
│       ├── components/            # React components
│       └── lib/                   # EVM wallet + i18n
├── render.yaml                    # Render deployment config
└── package.json                   # Monorepo root
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Somnia (EVM, Chain ID 50312 testnet / 50311 mainnet) |
| Agent SDK | Somnia Agent Kit |
| Decentralized Compute | Somnia Agents (LLM, JSON API) |
| Data Layer | Somnia Data Streams |
| Events | Somnia On-Chain Reactivity |
| Smart Contracts | Solidity 0.8.20 |
| Backend | Express.js, ethers.js v6, viem |
| LLM Simulation | Local agent logic with Somnia Agent integration |
| Frontend | Next.js 16, React 19, RainbowKit, wagmi, viem |
| Wallet | MetaMask / any EVM wallet via RainbowKit |
| CLI Agent | TypeScript, Axios |
| Deployment | Render (render.yaml) |

---

## Judging Criteria Alignment

| Criteria | How SomniaSwarm Addresses It |
|---|---|
| **Functionality** | Fully functional backend, frontend, and CLI. Works in simulation mode without wallet. All endpoints tested and working. |
| **Agent-First Design** | Agents discover each other on-chain, autonomously decompose tasks, delegate subtasks, and coordinate via Data Streams. Full agent-native behavior. |
| **Innovation & Creativity** | Novel multi-agent orchestration framework leveraging ALL Somnia primitives: Agent Kit, Agents, Data Streams, Reactivity, and EVM contracts. First-of-kind agent swarm on Somnia. |
| **Autonomous Performance** | Self-contained autonomous operation with coordinator-driven task decomposition, reputation-based agent selection, and self-healing error handling. Deployable on Render. |

---

**Built for the Somnia Agentic L1 Hackathon** · Autonomous · Decentralized · Agent-Native
