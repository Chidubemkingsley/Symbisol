import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import {
  initSomniaClient, discoverAgents, executeAgentTask,
  planTaskDecomposition, getTaskLog, registerAgentInRegistry,
} from './somnia-client.js';
import { initDataStreams, publishAgentEvent, getMessages } from './data-streams.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4002', 10);
const HOST = process.env.HOST || '0.0.0.0';
const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(morgan('short'));
app.use(express.json({ limit: '2mb' }));

// ── SSE broadcast ───────────────────────────────────────────────────────────
const sseClients: Set<Response> = new Set();

function broadcastSSE(event: string, data: any) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try { client.write(msg); } catch { sseClients.delete(client); }
  }
}

// ── Health ──────────────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'SomniaSwarm Backend API is online' });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'somnia-swarm', timestamp: new Date().toISOString() });
});

// ── SSE stream ──────────────────────────────────────────────────────────────
app.get('/api/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected' })}\n\n`);
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// ── Agent registry ──────────────────────────────────────────────────────────
app.get('/api/agents', async (_req: Request, res: Response) => {
  try {
    const agents = await discoverAgents();
    res.json({ agents, count: agents.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/agents/discover', async (req: Request, res: Response) => {
  try {
    const capability = req.query.capability as string;
    const agents = await discoverAgents(capability);
    res.json({ agents, count: agents.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/agents/register', async (req: Request, res: Response) => {
  try {
    const { name, endpoint, description, category, capabilities, price } = req.body;
    const agentId = await registerAgentInRegistry({ name, endpoint, description, category, capabilities, price });
    if (agentId) {
      await publishAgentEvent('agent_registration', { agentId, name, category, price });
      broadcastSSE('agent_registered', { agentId, name, category });
      res.json({ success: true, agentId });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Core query orchestration ────────────────────────────────────────────────
async function runQuery(query: string, source: 'user' | 'autonomous' = 'user') {
  broadcastSSE('query_started', { query, source });
  const plan = await planTaskDecomposition(query);
  broadcastSSE('plan_created', { steps: plan.steps.length, query, source });

  const results: any[] = [];
  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    broadcastSSE('step_started', { index: i, agentId: step.agentId, description: step.description, source });
    await publishAgentEvent('task_created', { step: i, agentId: step.agentId, description: step.description });

    const result = await executeAgentTask(step.agentId, step.description, step.params, 0, step.depth);
    results.push(result);

    await publishAgentEvent('task_completed', {
      step: i, taskId: result.taskId, status: result.status,
      txHash: result.txHash, blockNumber: result.blockNumber,
    });
    broadcastSSE('step_completed', {
      index: i, taskId: result.taskId, status: result.status,
      result: result.result, agentName: result.agentName,
      txHash: result.txHash, explorerUrl: result.explorerUrl,
      blockNumber: result.blockNumber, durationMs: result.durationMs,
      fee: result.fee, source,
    });
  }

  broadcastSSE('query_completed', { results, source });
  return results;
}

app.post('/api/agent/query', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });
    const results = await runQuery(query, 'user');
    const summary = results.map(r => `[${r.agentName}] ${r.description}: ${JSON.stringify(r.result)}`).join('\n');
    res.json({ query, steps: results.length, results, summary });
  } catch (e: any) {
    broadcastSSE('query_error', { error: e.message });
    res.status(500).json({ error: e.message });
  }
});

// ── Individual agent endpoints ──────────────────────────────────────────────
app.post('/api/agent/research',  async (req: Request, res: Response) => { try { res.json(await executeAgentTask(1, `Research: ${req.body.topic || req.body.query}`, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.post('/api/agent/analyze',   async (req: Request, res: Response) => { try { res.json(await executeAgentTask(2, `Analyse: ${req.body.text}`, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.post('/api/agent/oracle',    async (req: Request, res: Response) => { try { res.json(await executeAgentTask(3, `Oracle: ${req.body.type || 'data'}`, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.post('/api/agent/summarize', async (req: Request, res: Response) => { try { res.json(await executeAgentTask(4, `Summarize: ${req.body.text?.slice(0, 80)}`, { ...req.body, task: 'summarize' })); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.post('/api/agent/code',      async (req: Request, res: Response) => { try { res.json(await executeAgentTask(5, `Code: ${req.body.description}`, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.post('/api/agent/translate', async (req: Request, res: Response) => { try { res.json(await executeAgentTask(6, `Translate: ${req.body.text?.slice(0, 50)}`, { ...req.body, task: 'translate' })); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.post('/api/agent/weather',   async (req: Request, res: Response) => { try { res.json(await executeAgentTask(7, `Weather: ${req.body.location}`, { type: 'weather', ...req.body })); } catch (e: any) { res.status(500).json({ error: e.message }); } });
app.post('/api/agent/sentiment', async (req: Request, res: Response) => { try { res.json(await executeAgentTask(8, `Sentiment: ${req.body.text?.slice(0, 80)}`, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });

// ── Stress test (God Mode) ──────────────────────────────────────────────────
const STRESS_QUERIES = [
  'Research quantum computing and explain latest breakthroughs',
  'Get Bitcoin price and analyze current market sentiment',
  'Research the Somnia blockchain and its Agentic L1 features',
  'Analyse AI agent trends in 2025 and provide insights',
  'Get Ethereum price and generate a Solidity ERC-20 contract',
  'Research climate change and summarize key scientific findings',
  'Translate "autonomous agents are the future of Web3" to Spanish',
  'Analyse sentiment in the DeFi community this week',
];

app.post('/api/agent/stress-test', async (req: Request, res: Response) => {
  res.json({ status: 'stress_test_started', queries: 5 });
  // Fire 5 concurrent autonomous swarms
  const selected = STRESS_QUERIES.sort(() => 0.5 - Math.random()).slice(0, 5);
  selected.forEach(async (query, i) => {
    await new Promise(r => setTimeout(r, i * 800));
    try { await runQuery(query, 'autonomous'); } catch {}
  });
});

// ── Autonomous mode ─────────────────────────────────────────────────────────
let autonomousLoop: NodeJS.Timeout | null = null;
let autonomousActive = false;

app.post('/api/autonomous/start', (_req: Request, res: Response) => {
  if (autonomousActive) return res.json({ status: 'already_running' });
  autonomousActive = true;
  let idx = 0;
  autonomousLoop = setInterval(async () => {
    const query = STRESS_QUERIES[idx % STRESS_QUERIES.length];
    idx++;
    try { await runQuery(query, 'autonomous'); } catch {}
  }, 25000);
  res.json({ status: 'autonomous_started', intervalMs: 25000 });
});

app.post('/api/autonomous/stop', (_req: Request, res: Response) => {
  if (autonomousLoop) { clearInterval(autonomousLoop); autonomousLoop = null; }
  autonomousActive = false;
  res.json({ status: 'autonomous_stopped' });
});

app.get('/api/autonomous/status', (_req: Request, res: Response) => {
  res.json({ active: autonomousActive });
});

// ── Data & stats ────────────────────────────────────────────────────────────
app.get('/api/tasks', (_req: Request, res: Response) => {
  const tasks = getTaskLog();
  res.json({ tasks, count: tasks.length });
});

// ── Payments (derived from task log) ────────────────────────────────────────
app.get('/api/payments', (_req: Request, res: Response) => {
  const tasks = getTaskLog();
  const payments = tasks
    .filter((t: any) => t.status === 'completed')
    .map((t: any) => ({
      id: String(t.id),
      timestamp: new Date(t.timestamp).getTime(),
      endpoint: t.agentName ? `/api/agent/${t.agentName.toLowerCase().replace('agent', '')}` : '/api/agent/unknown',
      payer: 'coordinator',
      worker: t.agentName || 'Unknown',
      transaction: t.txHash || `sim-${t.id}`,
      token: 'STT',
      amount: String(t.fee || 0),
      explorerUrl: t.explorerUrl,
      isA2A: t.depth > 0,
      parentJobId: t.parentTaskId ? String(t.parentTaskId) : undefined,
      depth: t.depth || 0,
    }));
  const a2aCount = payments.filter((p: any) => p.isA2A).length;
  res.json({ payments, a2aCount, count: payments.length });
});

app.get('/api/streams', async (req: Request, res: Response) => {
  try {
    const messages = await getMessages(req.query.type as string);
    res.json({ messages, count: messages.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/stats', async (_req: Request, res: Response) => {
  const agents = await discoverAgents();
  const tasks = getTaskLog();
  const completed = tasks.filter(t => t.status === 'completed');
  const onChain = completed.filter(t => !!t.txHash);
  res.json({
    totalAgents: agents.length,
    totalTasks: tasks.length,
    completedTasks: completed.length,
    onChainPayments: onChain.length,
    totalFees: completed.reduce((s, t) => s + (t.fee || 0), 0),
    categories: [...new Set(agents.map(a => a.category))],
    network: process.env.SOMNIA_NETWORK || 'testnet',
    autonomousActive,
    recentTxHashes: onChain.slice(-5).map(t => ({ txHash: t.txHash, agentName: t.agentName, explorerUrl: t.explorerUrl })),
  });
});

app.get('/api/tools', async (_req: Request, res: Response) => {
  const agents = await discoverAgents();
  const tools = agents.map(a => ({
    id: a.id, name: a.name, description: a.description,
    category: a.category, capabilities: a.capabilities,
    price: a.price, reputation: a.reputation,
    jobsCompleted: a.jobsCompleted,
    efficiency: (a.reputation * a.reputation) / (parseFloat(a.price || '1') * 10000),
  }));
  res.json({ tools });
});

// ── Boot ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║    SomniaSwarm — Autonomous Agent Swarm Engine  ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const somniaReady = await initSomniaClient();
  const streamsReady = await initDataStreams();
  const llmReady = !!process.env.GROQ_API_KEY;

  console.log(`[SOMNIA] Wallet/Kit:    ${somniaReady ? '✓ Connected' : '⚠ Simulation'}`);
  console.log(`[SOMNIA] Data Streams:  ${streamsReady ? '✓ Connected' : '⚠ Not available'}`);
  console.log(`[SOMNIA] LLM (Groq):    ${llmReady ? '✓ Ready' : '⚠ No API key — using simulated outputs'}\n`);

  app.listen(PORT, HOST, () => {
    console.log(`[SERVER] Running on http://${HOST}:${PORT}`);
    console.log(`[SERVER] POST /api/agent/query       — orchestrate agent swarm`);
    console.log(`[SERVER] POST /api/agent/stress-test — god mode (5 concurrent swarms)`);
    console.log(`[SERVER] POST /api/autonomous/start  — self-running agent loop`);
    console.log(`[SERVER] GET  /api/events             — SSE stream`);
    console.log(`[SERVER] GET  /api/stats              — live economy stats`);
  });
}

main().catch(console.error);
