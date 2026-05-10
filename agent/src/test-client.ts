/**
 * Test Client — Manual verification that the backend endpoints work
 *
 * This script calls each paid endpoint using the x402 Solana client wrapper.
 * It automatically handles 402 responses (sign tx → retry with signature).
 *
 * Run: npx tsx agent/src/test-client.ts
 * Requires: AGENT_PRIVATE_KEY in .env and backend running on AGENT_SERVER_URL
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { Keypair, Connection, LAMPORTS_PER_SOL, SystemProgram, Transaction } from '@solana/web3.js';

dotenv.config({ path: '../.env' });
dotenv.config();

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;
const SERVER_URL = process.env.AGENT_SERVER_URL || 'http://localhost:4002';
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';

if (!PRIVATE_KEY) {
  console.error(
    'AGENT_PRIVATE_KEY not set. Run: npx tsx src/generate-wallet.ts'
  );
  process.exit(1);
}

const secretKey = Buffer.from(PRIVATE_KEY, 'hex');
const keypair = Keypair.fromSecretKey(secretKey);
const connection = new Connection(
  process.env.SOLANA_RPC_URL || `https://api.${NETWORK}.solana.com`,
  'confirmed'
);

// Create x402-aware HTTP client
async function x402Post(url: string, data: any, priceLamports: number, recipient: string) {
  // First try — expect 402
  const firstRes = await axios.post(url, data, {
    validateStatus: (status) => status === 402 || status === 200,
  });

  if (firstRes.status === 200) return firstRes;

  // Handle 402 — send SOL payment
  const payment = firstRes.data?.payment;
  if (!payment) throw new Error('No payment info in 402 response');

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: new PublicKey(recipient || payment.recipient),
      lamports: priceLamports || payment.amount,
    })
  );

  const sig = await connection.sendTransaction(tx, [keypair]);
  await connection.confirmTransaction(sig, 'confirmed');

  // Retry with signature
  const retryRes = await axios.post(url, data, {
    headers: { 'x-solana-signature': sig },
  });

  return retryRes;
}

function PublicKey(address: string): import('@solana/web3.js').PublicKey {
  return new (require('@solana/web3.js').PublicKey)(address);
}

console.log('');
console.log('================================================================');
console.log('  x402 SOLANA TEST CLIENT');
console.log('================================================================');
console.log(`  Server : ${SERVER_URL}`);
console.log(`  Payer  : ${keypair.publicKey.toBase58()}`);
console.log('================================================================');
console.log('');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function testHealth() {
  console.log('[1/4] Testing /health (free)...');
  const res = await axios.get(`${SERVER_URL}/health`);
  console.log('  Status:', res.status);
  console.log('  Data:', JSON.stringify(res.data, null, 2));
  console.log('');
}

async function testWeather() {
  console.log('[2/4] Testing POST /api/weather (0.001 SOL)...');
  try {
    const res = await x402Post('/api/weather', { city: 'Tokyo' }, 0.001 * LAMPORTS_PER_SOL, '');
    console.log('  Status:', res.status);
    console.log('  Data:', JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.log('  Error:', err.response?.status, err.response?.data || err.message);
  }
  console.log('');
}

async function testSummarize() {
  console.log('[3/4] Testing POST /api/summarize (0.003 SOL)...');
  try {
    const res = await x402Post('/api/summarize', {
      text: 'The x402 protocol enables automatic HTTP-level payments for APIs, AI agents, and digital services using SOL or USDC tokens on Solana. It works by returning a 402 Payment Required status when a client requests a protected resource. The client then signs a transaction and submits it to the Solana network. Once confirmed, the server grants access to the resource. This enables machine-to-machine micropayments without subscriptions or API keys.',
      maxLength: 100,
    }, 0.003 * LAMPORTS_PER_SOL, '');
    console.log('  Status:', res.status);
    console.log('  Data:', JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.log('  Error:', err.response?.status, err.response?.data || err.message);
  }
  console.log('');
}

async function testMathSolve() {
  console.log('[4/4] Testing POST /api/math-solve (0.005 SOL)...');
  try {
    const res = await x402Post('/api/math-solve', {
      expression: '(42 * 3) + (100 / 4) - 7',
    }, 0.005 * LAMPORTS_PER_SOL, '');
    console.log('  Status:', res.status);
    console.log('  Data:', JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.log('  Error:', err.response?.status, err.response?.data || err.message);
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  try {
    await testHealth();
    await testWeather();
    await testSummarize();
    await testMathSolve();

    console.log('================================================================');
    console.log('  All tests complete.');
    console.log('================================================================');
  } catch (err) {
    console.error('Test suite failed:', err);
    process.exit(1);
  }
}

main();
