import axios from 'axios';
import dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const SERVER_URL = process.env.AGENT_SERVER_URL || 'http://localhost:4002';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function printHeader() {
  console.clear();
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║     SomniaSwarm — Autonomous Agent CLI           ║');
  console.log('║     Built on Somnia Agentic L1                   ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  console.log('Commands:');
  console.log('  <query>          Ask the agent swarm to process your request');
  console.log('  agents           List all registered agents');
  console.log('  discover <cap>   Discover agents with a capability');
  console.log('  tasks            View recent task log');
  console.log('  stats            View swarm statistics');
  console.log('  tools            View tool catalog');
  console.log('  help             Show this menu');
  console.log('  exit             Quit');
  console.log('');
}

async function querySwarm(query: string) {
  console.log(`\n🤔 Processing: "${query}"\n`);
  try {
    const res = await axios.post(`${SERVER_URL}/api/agent/query`, { query });
    const data = res.data;

    console.log(`📋 Plan: ${data.steps} step(s)\n`);
    for (const result of data.results) {
      const icon = result.status === 'completed' ? '✅' : '❌';
      console.log(`${icon} [${result.agentName}] ${result.description}`);
      console.log(`   Task #${result.taskId} | Fee: ${result.fee} STT | Depth: ${result.depth}`);
      if (result.result) {
        const resultStr = JSON.stringify(result.result, null, 2);
        console.log(`   Result: ${resultStr.slice(0, 300)}${resultStr.length > 300 ? '...' : ''}`);
      }
      console.log('');
    }

    console.log('📝 Summary:');
    console.log(data.summary?.slice(0, 500));
    console.log('');
  } catch (error: any) {
    console.error(`❌ Error: ${error.response?.data?.error || error.message}\n`);
  }
}

async function listAgents() {
  try {
    const res = await axios.get(`${SERVER_URL}/api/agents`);
    const { agents } = res.data;
    console.log(`\n📋 Registered Agents (${agents.length}):\n`);
    for (const a of agents) {
      const repStars = '★'.repeat(Math.floor(a.reputation / 2000));
      console.log(`  #${a.id} ${a.name} [${a.category}]`);
      console.log(`     ${a.description}`);
      console.log(`     Capabilities: ${a.capabilities.join(', ')}`);
      console.log(`     Price: ${a.price} STT | Rep: ${a.reputation} ${repStars}`);
      console.log(`     Jobs: ${a.jobsCompleted} ✅ / ${a.jobsFailed} ❌\n`);
    }
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}\n`);
  }
}

async function discoverAgents(capability: string) {
  try {
    const res = await axios.get(`${SERVER_URL}/api/agents/discover`, { params: { capability } });
    const { agents } = res.data;
    console.log(`\n🔍 Agents with "${capability}" capability (${agents.length}):\n`);
    for (const a of agents) {
      console.log(`  #${a.id} ${a.name} — ${a.category} — ${a.price} STT`);
    }
    console.log('');
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}\n`);
  }
}

async function listTasks() {
  try {
    const res = await axios.get(`${SERVER_URL}/api/tasks`);
    const { tasks } = res.data;
    console.log(`\n📋 Recent Tasks (${tasks.length}):\n`);
    for (const t of tasks.slice(-10).reverse()) {
      const status = t.status === 'completed' ? '✅' : t.status === 'failed' ? '❌' : '⏳';
      console.log(`  ${status} #${t.id} ${t.agentName}: ${t.description.slice(0, 60)}`);
    }
    console.log('');
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}\n`);
  }
}

async function showStats() {
  try {
    const res = await axios.get(`${SERVER_URL}/api/stats`);
    const s = res.data;
    console.log('\n📊 Swarm Statistics:\n');
    console.log(`  Agents:           ${s.totalAgents}`);
    console.log(`  Total Tasks:      ${s.totalTasks}`);
    console.log(`  Completed:        ${s.completedTasks}`);
    console.log(`  Total Fees:       ${s.totalFees} STT`);
    console.log(`  Categories:       ${s.categories.join(', ')}`);
    console.log(`  Network:          Somnia ${s.network}\n`);
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}\n`);
  }
}

async function showTools() {
  try {
    const res = await axios.get(`${SERVER_URL}/api/tools`);
    const { tools } = res.data;
    console.log('\n🔧 Tool Catalog:\n');
    for (const t of tools) {
      console.log(`  ${t.name.padEnd(20)} ${t.price.padStart(6)} STT  ★${Math.floor(t.reputation / 1000)}  η${t.efficiency.toFixed(2)}`);
    }
    console.log('');
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}\n`);
  }
}

function prompt() {
  rl.question('⚡ ', async (input) => {
    const cmd = input.trim().toLowerCase();
    if (cmd === 'exit' || cmd === 'quit') { console.log('\nGoodbye!\n'); rl.close(); return; }
    if (cmd === 'help') { printHeader(); prompt(); return; }
    if (cmd === 'agents') { await listAgents(); prompt(); return; }
    if (cmd.startsWith('discover ')) { await discoverAgents(cmd.slice(9).trim()); prompt(); return; }
    if (cmd === 'tasks') { await listTasks(); prompt(); return; }
    if (cmd === 'stats') { await showStats(); prompt(); return; }
    if (cmd === 'tools') { await showTools(); prompt(); return; }
    if (cmd === '') { prompt(); return; }
    await querySwarm(input);
    prompt();
  });
}

async function main() {
  try {
    await axios.get(`${SERVER_URL}/health`);
  } catch {
    console.log(`⚠ Cannot reach server at ${SERVER_URL}`);
    console.log('  Make sure the backend is running.\n');
  }
  printHeader();
  prompt();
}

main();
