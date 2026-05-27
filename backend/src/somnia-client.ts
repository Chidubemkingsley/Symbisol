import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { llmPlanTasks, llmAgentResponse } from './llm.js';
import { sendMicroPayment, PaymentReceipt } from './payments.js';

dotenv.config();

interface AgentInfo {
  id: number;
  name: string;
  endpoint: string;
  description: string;
  category: string;
  capabilities: string[];
  price: string;
  reputation: number;
  owner: string;
  isActive: boolean;
  jobsCompleted: number;
  jobsFailed: number;
  totalEarned: number;
}

interface AgentConfig {
  name: string;
  endpoint: string;
  description: string;
  category: string;
  capabilities: string[];
  price: string;
}

interface TaskResult {
  taskId: number;
  agentId: number;
  agentName: string;
  description: string;
  result: any;
  status: string;
  fee: string;
  depth: number;
  txHash?: string;
  explorerUrl?: string;
  blockNumber?: number;
  durationMs?: number;
}

let provider: ethers.JsonRpcProvider | null = null;
let wallet: ethers.Wallet | null = null;
let somniaKit: any = null;

function getSomniaConfig() {
  const network = process.env.SOMNIA_NETWORK || 'testnet';
  return {
    network,
    rpcUrl: network === 'mainnet'
      ? 'https://rpc.somnia.network'
      : 'https://dream-rpc.somnia.network',
    chainId: network === 'mainnet' ? 50311 : 50312,
    registry: process.env.SOMNIA_AGENT_REGISTRY || '0x4d608e4de735db23A1c08BDacD8a37aa0b586c6A',
    manager: process.env.SOMNIA_AGENT_MANAGER || '0x686B8f061Ecb573917d0d3fda8EC07d6f8cccB44',
    executor: process.env.SOMNIA_AGENT_EXECUTOR || '0x157C56dEdbAB6caD541109daabA4663Fc016026e',
    vault: process.env.SOMNIA_AGENT_VAULT || '0x82f6dfC7E66B592B55B28020B86aC783e6a12B20',
  };
}

export async function initSomniaClient(): Promise<boolean> {
  try {
    const privateKey = process.env.SOMNIA_PRIVATE_KEY;
    if (!privateKey) {
      console.warn('[SOMNIA] No private key set — running in simulation mode');
      return false;
    }
    const config = getSomniaConfig();
    provider = new ethers.JsonRpcProvider(config.rpcUrl);
    wallet = new ethers.Wallet(
      privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`,
      provider
    );
    console.log(`[SOMNIA] Wallet: ${wallet.address}`);
    console.log(`[SOMNIA] Network: ${config.network} (${config.rpcUrl})`);

    try {
      const balance = await provider.getBalance(wallet.address);
      console.log(`[SOMNIA] Balance: ${ethers.formatEther(balance)} STT`);
    } catch {
      console.warn('[SOMNIA] Could not fetch balance');
    }

    try {
      const { SomniaAgentKit, SOMNIA_NETWORKS } = await import('somnia-agent-kit');
      const netKey = config.network === 'mainnet' ? 'mainnet' : 'testnet';
      somniaKit = new SomniaAgentKit({
        network: SOMNIA_NETWORKS[netKey],
        contracts: {
          agentRegistry: config.registry,
          agentManager: config.manager,
          agentExecutor: config.executor,
          agentVault: config.vault,
        },
        privateKey: privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`,
      });
      await somniaKit.initialize();
      console.log('[SOMNIA] Agent Kit initialized');
    } catch (e: any) {
      console.warn('[SOMNIA] Agent Kit init warning:', e.message);
    }

    return true;
  } catch (error: any) {
    console.warn('[SOMNIA] Init warning:', error.message);
    return false;
  }
}

export function getKit(): any { return somniaKit; }
export function getProvider(): ethers.JsonRpcProvider {
  if (!provider) throw new Error('Provider not initialized');
  return provider;
}
export function getWallet(): ethers.Wallet | null { return wallet; }
export const SIMULATION_MODE = () => !somniaKit && !wallet;

export const SIMULATED_AGENTS: AgentInfo[] = [
  { id: 1, name: 'ResearchAgent',    endpoint: '/api/agent/research',   description: 'Deep research agent powered by LLM + Wikipedia', category: 'research',  capabilities: ['web-search','data-collection','wikipedia','llm'],           price: '1.0',  reputation: 9200, owner: '0xsim', isActive: true, jobsCompleted: 156, jobsFailed: 8,  totalEarned: 156 },
  { id: 2, name: 'AnalysisAgent',    endpoint: '/api/agent/analyze',    description: 'LLM-powered data analysis, sentiment, and trends',  category: 'analysis',  capabilities: ['llm','text-analysis','sentiment','trend-analysis'],         price: '0.5',  reputation: 8800, owner: '0xsim', isActive: true, jobsCompleted: 312, jobsFailed: 15, totalEarned: 156 },
  { id: 3, name: 'DataOracleAgent',  endpoint: '/api/agent/oracle',     description: 'Real-time crypto prices, market data, JSON APIs',   category: 'oracle',    capabilities: ['json-api','price-feed','weather','sports'],                 price: '0.3',  reputation: 9500, owner: '0xsim', isActive: true, jobsCompleted: 523, jobsFailed: 12, totalEarned: 156.9 },
  { id: 4, name: 'SummaryAgent',     endpoint: '/api/agent/summarize',  description: 'LLM summarization of long texts and documents',     category: 'nlp',       capabilities: ['summarization','text-generation','paraphrasing','llm'],     price: '0.2',  reputation: 8700, owner: '0xsim', isActive: true, jobsCompleted: 678, jobsFailed: 23, totalEarned: 135.6 },
  { id: 5, name: 'CodeAgent',        endpoint: '/api/agent/code',       description: 'Generates and reviews smart contracts and code',    category: 'code',      capabilities: ['code-generation','code-review','debugging','solidity','llm'],price: '1.5',  reputation: 9100, owner: '0xsim', isActive: true, jobsCompleted: 89,  jobsFailed: 5,  totalEarned: 133.5 },
  { id: 6, name: 'TranslationAgent', endpoint: '/api/agent/translate',  description: 'Multi-language translation via LLM',               category: 'nlp',       capabilities: ['translation','multi-language','localization','llm'],         price: '0.4',  reputation: 8400, owner: '0xsim', isActive: true, jobsCompleted: 234, jobsFailed: 11, totalEarned: 93.6 },
  { id: 7, name: 'WeatherAgent',     endpoint: '/api/agent/weather',    description: 'Real-time weather data and LLM-interpreted forecasts', category: 'data',   capabilities: ['weather','forecast','climate','llm'],                        price: '0.1',  reputation: 9600, owner: '0xsim', isActive: true, jobsCompleted: 890, jobsFailed: 7,  totalEarned: 89 },
  { id: 8, name: 'SentimentAgent',   endpoint: '/api/agent/sentiment',  description: 'Deep sentiment and emotion analysis via LLM',      category: 'sentiment', capabilities: ['sentiment','emotion-detection','opinion-mining','llm'],      price: '0.25', reputation: 8600, owner: '0xsim', isActive: true, jobsCompleted: 445, jobsFailed: 18, totalEarned: 111.25 },
];

export async function registerAgentInRegistry(config: AgentConfig): Promise<number | null> {
  if (!wallet && !somniaKit) {
    const id = SIMULATED_AGENTS.length + 1;
    SIMULATED_AGENTS.push({
      id, name: config.name, endpoint: config.endpoint,
      description: config.description, category: config.category,
      capabilities: config.capabilities,
      price: config.price, reputation: 5000,
      owner: (wallet as ethers.Wallet | null)?.address || '0xsim',
      isActive: true, jobsCompleted: 0, jobsFailed: 0, totalEarned: 0,
    });
    return id;
  }
  return null;
}

export async function discoverAgents(capability?: string): Promise<AgentInfo[]> {
  const active = SIMULATED_AGENTS.filter(a => a.isActive);
  if (!capability) return active;
  return active.filter(a =>
    a.capabilities.some(c => c.toLowerCase().includes(capability.toLowerCase()))
  );
}

let taskCounter = 0;
const taskLog: any[] = [];

export async function executeAgentTask(
  agentId: number,
  description: string,
  params: any,
  parentTaskId: number = 0,
  depth: number = 0
): Promise<TaskResult> {
  const agents = await discoverAgents();
  const agent = agents.find(a => a.id === agentId);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  taskCounter++;
  const taskId = taskCounter;
  const fee = parseFloat(agent.price);
  const startMs = Date.now();

  const logEntry: any = {
    id: taskId, agentId, agentName: agent.name,
    description, params, fee, depth, parentTaskId,
    timestamp: new Date().toISOString(), status: 'assigned',
  };
  taskLog.push(logEntry);

  try {
    const result = await executeAgentLogic(agent, description, params);
    const durationMs = Date.now() - startMs;

    logEntry.status = 'completed';
    logEntry.result = result;
    logEntry.durationMs = durationMs;

    agent.jobsCompleted++;
    agent.totalEarned += fee;

    // Real on-chain micro-payment
    let payment: PaymentReceipt | null = null;
    if (wallet) {
      payment = await sendMicroPayment(wallet, agent.name, fee);
      if (payment) {
        logEntry.txHash = payment.txHash;
        logEntry.blockNumber = payment.blockNumber;
        logEntry.explorerUrl = payment.explorerUrl;
      }
    }

    return {
      taskId, agentId, agentName: agent.name, description, result,
      status: 'completed', fee: fee.toString(), depth, durationMs,
      txHash: payment?.txHash,
      explorerUrl: payment?.explorerUrl,
      blockNumber: payment?.blockNumber,
    };
  } catch (error: any) {
    agent.jobsFailed++;
    logEntry.status = 'failed';
    logEntry.error = error.message;
    throw error;
  }
}

async function executeAgentLogic(agent: AgentInfo, description: string, params: any): Promise<any> {
  const routes: Record<string, (p: any) => Promise<any>> = {
    research: async (p) => {
      const topic = p.topic || p.query || description;
      const llm = await llmAgentResponse('research', `Research this topic: "${topic}"`);
      if (llm) return llm;
      // Fallback
      try {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
        if (!res.ok) throw new Error('Wikipedia fetch failed');
        const data = await res.json();
        return {
          summary: data.extract || `Information about ${topic}`,
          keyFindings: [(data.extract || '').split('.').slice(0, 3).join('.') + '.'],
          sources: [data.content_urls?.desktop?.page || ''],
          relatedTopics: [],
          confidence: 0.8,
        };
      } catch {
        return { summary: `Research on ${topic}`, keyFindings: [], sources: [], confidence: 0.5 };
      }
    },

    analysis: async (p) => {
      const text = p.text || p.query || description;
      const llm = await llmAgentResponse('analysis', `Analyse this: "${text}". Type: ${p.analysisType || 'general'}`);
      if (llm) return llm;
      return { sentiment: 'neutral', confidence: 0.75, insights: ['Requires more data'], trends: [], recommendation: 'Monitor closely', riskLevel: 'medium' };
    },

    oracle: async (p) => {
      if (p.type === 'price' || p.type === 'crypto') {
        try {
          const symbol = (p.symbol || 'BTC').toLowerCase();
          const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
          const data = await res.json();
          const price = data[symbol]?.usd || 0;
          const llm = await llmAgentResponse('oracle', `Interpret this crypto price data: ${symbol.toUpperCase()} = $${price} USD`);
          if (llm) return { ...llm, rawPrice: price, symbol: symbol.toUpperCase(), currency: 'USD' };
          return { symbol: symbol.toUpperCase(), price, currency: 'USD', timestamp: new Date().toISOString() };
        } catch {
          return { symbol: p.symbol || 'BTC', price: 67420, currency: 'USD', note: 'Simulated price' };
        }
      }
      if (p.url) {
        try {
          const res = await fetch(p.url);
          const data = await res.json();
          return data;
        } catch {
          return { note: 'Could not fetch URL', url: p.url };
        }
      }
      return { error: 'Specify type: price, or provide a url' };
    },

    nlp: async (p) => {
      const text = p.text || description;
      const task = p.task || 'summarize';
      const prompt = task === 'translate'
        ? `Translate to ${p.targetLang || 'Spanish'}: "${text}"`
        : `Summarize: "${text}"`;
      const llm = await llmAgentResponse('nlp', prompt);
      if (llm) return llm;
      return { summary: text.slice(0, 100) + '...', keyPoints: [], wordCount: text.split(' ').length };
    },

    code: async (p) => {
      const lang = p.language || 'solidity';
      const prompt = p.task === 'review'
        ? `Review this code: ${p.code || description}`
        : `Generate ${lang} code for: "${description}"`;
      const llm = await llmAgentResponse('code', prompt);
      if (llm) return llm;
      return {
        language: lang,
        code: `// ${lang} generated for: ${description}\nfunction example() { return "Hello Somnia"; }`,
        explanation: `Generated ${lang} code`,
        agentNote: 'LLM unavailable — simulated output',
      };
    },

    data: async (p) => {
      const location = p.location || 'London';
      try {
        const res = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
        const data = await res.json();
        const cc = data.current_condition?.[0];
        const rawWeather = { location, temperature: `${cc?.temp_C}°C`, condition: cc?.weatherDesc?.[0]?.value, humidity: cc?.humidity, windSpeed: cc?.windspeedKmph };
        const llm = await llmAgentResponse('data', `Interpret weather data: ${JSON.stringify(rawWeather)}`);
        if (llm) return llm;
        return rawWeather;
      } catch {
        return { location, temperature: '22°C', condition: 'Partly cloudy', note: 'Simulated' };
      }
    },

    sentiment: async (p) => {
      const text = p.text || description;
      const llm = await llmAgentResponse('sentiment_agent', `Analyse sentiment of: "${text}"`);
      if (llm) return llm;
      const score = Math.random() * 2 - 1;
      return { text: text.slice(0, 100), score, label: score > 0.3 ? 'positive' : score < -0.3 ? 'negative' : 'neutral', magnitude: Math.abs(score) };
    },
  };

  const handler = routes[agent.category];
  if (handler) return handler(params);
  const llm = await llmAgentResponse('research', description);
  if (llm) return llm;
  return { result: `Task completed by ${agent.name}: ${description}` };
}

export function getTaskLog(): any[] { return taskLog; }

export async function planTaskDecomposition(
  query: string
): Promise<{ steps: { agentId: number; description: string; params: any; depth: number }[] }> {

  // Try real LLM planning first
  const llmSteps = await llmPlanTasks(query);
  if (llmSteps.length > 0) {
    return { steps: llmSteps };
  }

  // Fallback: keyword routing
  const agents = await discoverAgents();
  const q = query.toLowerCase();
  const steps: { agentId: number; description: string; params: any; depth: number }[] = [];

  if (q.includes('research') || q.includes('what is') || q.includes('explain') || q.includes('find') || q.includes('search')) {
    const a = agents.find(x => x.category === 'research');
    if (a) steps.push({ agentId: a.id, description: `Research: ${query}`, params: { topic: query, query }, depth: 0 });
  }
  if (q.includes('price') || q.includes('crypto') || q.includes('bitcoin') || q.includes('ethereum') || q.includes('btc') || q.includes('eth')) {
    const a = agents.find(x => x.category === 'oracle');
    const symbol = q.includes('bitcoin') || q.includes('btc') ? 'bitcoin' : q.includes('ethereum') || q.includes('eth') ? 'ethereum' : 'bitcoin';
    if (a) steps.push({ agentId: a.id, description: `Price for ${symbol}`, params: { type: 'price', symbol }, depth: 0 });
  }
  if (q.includes('weather') || q.includes('temperature') || q.includes('forecast')) {
    const a = agents.find(x => x.category === 'data');
    const location = query.replace(/weather|temperature|forecast|in|the/gi, '').trim() || 'New York';
    if (a) steps.push({ agentId: a.id, description: `Weather: ${location}`, params: { type: 'weather', location }, depth: 0 });
  }
  if (q.includes('sentiment') || q.includes('emotion') || q.includes('feel')) {
    const a = agents.find(x => x.category === 'sentiment');
    if (a) steps.push({ agentId: a.id, description: `Sentiment: ${query}`, params: { text: query }, depth: 0 });
  }
  if (q.includes('analyz') || q.includes('trend') || q.includes('insight')) {
    const a = agents.find(x => x.category === 'analysis');
    if (a) steps.push({ agentId: a.id, description: `Analyse: ${query}`, params: { text: query, analysisType: 'general' }, depth: 0 });
  }
  if (q.includes('summarize') || q.includes('summary') || q.includes('tl;dr')) {
    const a = agents.find(x => x.capabilities.includes('summarization'));
    if (a) steps.push({ agentId: a.id, description: `Summarize: ${query}`, params: { text: query, task: 'summarize' }, depth: 0 });
  }
  if (q.includes('code') || q.includes('solidity') || q.includes('contract') || q.includes('function') || q.includes('write')) {
    const a = agents.find(x => x.category === 'code');
    const lang = q.includes('solidity') ? 'solidity' : q.includes('python') ? 'python' : q.includes('rust') ? 'rust' : 'typescript';
    if (a) steps.push({ agentId: a.id, description: `Code: ${query}`, params: { task: 'generate', language: lang, description: query }, depth: 0 });
  }
  if (q.includes('translat') || q.includes('spanish') || q.includes('french') || q.includes('german')) {
    const a = agents.find(x => x.capabilities.includes('translation'));
    const targetLang = q.includes('spanish') ? 'es' : q.includes('french') ? 'fr' : q.includes('german') ? 'de' : 'es';
    if (a) steps.push({ agentId: a.id, description: `Translate to ${targetLang}`, params: { text: query, task: 'translate', targetLang }, depth: 0 });
  }

  if (steps.length === 0) {
    const a = agents[0];
    if (a) steps.push({ agentId: a.id, description: `Process: ${query}`, params: { topic: query, query }, depth: 0 });
  }

  return { steps };
}
