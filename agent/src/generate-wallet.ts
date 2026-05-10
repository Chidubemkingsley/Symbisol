/**
 * Generate Wallet — Create a devnet Solana keypair for the agent
 *
 * Run: npx tsx src/generate-wallet.ts
 *
 * Fund it: solana airdrop 2 <PUBKEY> --url devnet
 */

import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

function main() {
  const keypair = Keypair.generate();
  const pubkey = keypair.publicKey.toBase58();
  const secret = Buffer.from(keypair.secretKey).toString('hex');

  console.log('');
  console.log('===============================================================');
  console.log('  SYMBISOL — Agent Wallet Generated');
  console.log('===============================================================');
  console.log(`  Public Key : ${pubkey}`);
  console.log(`  Secret (hex): ${secret.slice(0, 32)}...${secret.slice(-8)}`);
  console.log('===============================================================');
  console.log('');
  console.log('  Add to your .env:');
  console.log(`  AGENT_PRIVATE_KEY=${secret}`);
  console.log('');
  console.log('  Get devnet SOL from:');
  console.log(`  https://faucet.solana.com`);
  console.log(`  solana airdrop 2 ${pubkey} --url devnet`);
  console.log('');
}

main();
