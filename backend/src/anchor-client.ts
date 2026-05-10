/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYMBISOL — Anchor On-Chain Client
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Bridges the x402 payment flow to the deployed Anchor program.
 * After each successful x402 payment, this module:
 *   1. Ensures the worker agent is registered on-chain (register_agent)
 *   2. Creates a job PDA (create_job)
 *   3. Marks it complete (complete_job) → updates reputation on-chain
 *
 * Program ID: 5383AVU3XCHu2L4dEVZVGtitekZEuaFBFoxgnFQJJmmB (devnet)
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

// ── Program constants ────────────────────────────────────────────────────────
const PROGRAM_ID = new PublicKey('5383AVU3XCHu2L4dEVZVGtitekZEuaFBFoxgnFQJJmmB');

// Minimal IDL — only the instructions we call at runtime
const MINIMAL_IDL: anchor.Idl = {
  address: '5383AVU3XCHu2L4dEVZVGtitekZEuaFBFoxgnFQJJmmB',
  metadata: { name: 'symbisol', version: '1.0.0', spec: '0.1.0' },
  instructions: [
    {
      name: 'initializeGlobalStats',
      discriminator: [0, 0, 0, 0, 0, 0, 0, 0], // filled by Anchor
      accounts: [
        { name: 'authority', writable: true, signer: true },
        { name: 'globalStats', writable: true, pda: { seeds: [{ kind: 'const', value: [103, 108, 111, 98, 97, 108, 95, 115, 116, 97, 116, 115] }] } },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [],
    },
    {
      name: 'registerAgent',
      discriminator: [0, 0, 0, 0, 0, 0, 0, 0],
      accounts: [
        { name: 'owner', writable: true, signer: true },
        { name: 'agent', writable: true, pda: { seeds: [{ kind: 'const', value: [97, 103, 101, 110, 116] }, { kind: 'account', path: 'owner' }] } },
        { name: 'globalStats', writable: true, pda: { seeds: [{ kind: 'const', value: [103, 108, 111, 98, 97, 108, 95, 115, 116, 97, 116, 115] }] } },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'name', type: 'string' },
        { name: 'endpoint', type: 'string' },
        { name: 'priceLamports', type: 'u64' },
        { name: 'category', type: 'string' },
      ],
    },
    {
      name: 'createJob',
      discriminator: [0, 0, 0, 0, 0, 0, 0, 0],
      accounts: [
        { name: 'requester', writable: true, signer: true },
        { name: 'workerAgent', pda: { seeds: [{ kind: 'const', value: [97, 103, 101, 110, 116] }, { kind: 'account', path: 'workerAgent.owner' }] } },
        { name: 'job', writable: true },
        { name: 'escrow', writable: true },
        { name: 'globalStats', writable: true, pda: { seeds: [{ kind: 'const', value: [103, 108, 111, 98, 97, 108, 95, 115, 116, 97, 116, 115] }] } },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'category', type: 'string' },
        { name: 'parentJobId', type: 'u64' },
        { name: 'jobIdSeed', type: 'u64' },
      ],
    },
    {
      name: 'completeJob',
      discriminator: [0, 0, 0, 0, 0, 0, 0, 0],
      accounts: [
        { name: 'worker', writable: true, signer: true },
        { name: 'workerAgent', writable: true },
        { name: 'job', writable: true },
        { name: 'escrow', writable: true },
        { name: 'categoryLeader', writable: true },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [{ name: 'jobId', type: 'u64' }],
    },
  ],
  accounts: [
    {
      name: 'GlobalStats',
      discriminator: [0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      name: 'Agent',
      discriminator: [0, 0, 0, 0, 0, 0, 0, 0],
    },
  ],
  types: [],
  events: [],
  errors: [],
};

// ── PDA helpers ──────────────────────────────────────────────────────────────
export function globalStatsPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('global_stats')],
    PROGRAM_ID
  );
}

export function agentPda(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('agent'), owner.toBuffer()],
    PROGRAM_ID
  );
}

export function jobPda(jobId: bigint): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(jobId);
  return PublicKey.findProgramAddressSync([Buffer.from('job'), buf], PROGRAM_ID);
}

export function escrowPda(jobId: bigint): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(jobId);
  return PublicKey.findProgramAddressSync([Buffer.from('escrow'), buf], PROGRAM_ID);
}

export function categoryLeaderPda(category: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('category_leader'), Buffer.from(category)],
    PROGRAM_ID
  );
}

// ── AnchorClient ─────────────────────────────────────────────────────────────
export class AnchorClient {
  private program: anchor.Program;
  private provider: anchor.AnchorProvider;
  private connection: Connection;
  private authority: Keypair;

  constructor(connection: Connection, authority: Keypair) {
    this.connection = connection;
    this.authority = authority;

    const wallet = new anchor.Wallet(authority);
    this.provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });

    // Use the full IDL from the generated types file
    this.program = new anchor.Program(MINIMAL_IDL as anchor.Idl, this.provider);
  }

  /**
   * Ensure GlobalStats is initialized. Safe to call multiple times.
   */
  async ensureGlobalStats(): Promise<void> {
    const [statsPda] = globalStatsPda();
    try {
      await this.connection.getAccountInfo(statsPda);
      // If account exists, we're good
    } catch {
      // Initialize if missing
      try {
        await this.program.methods
          .initializeGlobalStats()
          .accounts({
            authority: this.authority.publicKey,
            globalStats: statsPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        console.log('[ANCHOR] GlobalStats initialized');
      } catch (e: any) {
        if (!e.message?.includes('already in use')) {
          console.warn('[ANCHOR] GlobalStats init warning:', e.message);
        }
      }
    }
  }

  /**
   * Fetch the current next_job_id from GlobalStats.
   */
  async getNextJobId(): Promise<bigint> {
    const [statsPda] = globalStatsPda();
    try {
      const stats = await (this.program.account as any)['globalStats'].fetch(statsPda);
      return BigInt((stats as any).nextJobId.toString());
    } catch {
      return BigInt(1);
    }
  }

  /**
   * Ensure a worker agent is registered on-chain.
   * Uses the authority keypair as the agent owner (server-side agents).
   */
  async ensureAgentRegistered(
    agentName: string,
    endpoint: string,
    priceLamports: number,
    category: string
  ): Promise<PublicKey> {
    const owner = this.authority.publicKey;
    const [aPda] = agentPda(owner);
    const [statsPda] = globalStatsPda();

    const existing = await this.connection.getAccountInfo(aPda);
    if (existing) return aPda;

    try {
      await this.program.methods
        .registerAgent(
          agentName.slice(0, 64),
          endpoint.slice(0, 256),
          new anchor.BN(priceLamports),
          category.slice(0, 32)
        )
        .accounts({
          owner,
          agent: aPda,
          globalStats: statsPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log(`[ANCHOR] Agent registered: ${agentName}`);
    } catch (e: any) {
      if (!e.message?.includes('already in use')) {
        console.warn(`[ANCHOR] Register agent warning (${agentName}):`, e.message);
      }
    }
    return aPda;
  }

  /**
   * Record a completed job on-chain.
   * This is the key integration point — called after every successful x402 payment.
   * It creates a job PDA and immediately marks it complete, updating worker reputation.
   */
  async recordCompletedJob(
    workerOwner: PublicKey,
    category: string,
    priceLamports: number
  ): Promise<{ jobId: bigint; txSignature: string } | null> {
    try {
      const [statsPda] = globalStatsPda();
      const jobId = await this.getNextJobId();

      const [jPda] = jobPda(jobId);
      const [ePda] = escrowPda(jobId);
      const [wAgentPda] = agentPda(workerOwner);
      const [catLeaderPda] = categoryLeaderPda(category.slice(0, 32));

      // Step 1: Create the job (locks funds in escrow)
      await this.program.methods
        .createJob(
          category.slice(0, 32),
          new anchor.BN(0), // top-level job
          new anchor.BN(jobId.toString())
        )
        .accounts({
          requester: this.authority.publicKey,
          workerAgent: wAgentPda,
          job: jPda,
          escrow: ePda,
          globalStats: statsPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Step 2: Complete the job (releases escrow, boosts reputation)
      const completeTx = await this.program.methods
        .completeJob(new anchor.BN(jobId.toString()))
        .accounts({
          worker: this.authority.publicKey,
          workerAgent: wAgentPda,
          job: jPda,
          escrow: ePda,
          categoryLeader: catLeaderPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log(`[ANCHOR] Job ${jobId} completed on-chain. Tx: ${completeTx}`);
      return { jobId, txSignature: completeTx };
    } catch (e: any) {
      // Non-fatal — x402 payment already succeeded, on-chain update is best-effort
      console.warn('[ANCHOR] recordCompletedJob failed (non-fatal):', e.message?.slice(0, 120));
      return null;
    }
  }
}

// ── Singleton factory ────────────────────────────────────────────────────────
let _client: AnchorClient | null = null;

export function getAnchorClient(
  connection: Connection,
  keypair: Keypair
): AnchorClient {
  if (!_client) {
    _client = new AnchorClient(connection, keypair);
  }
  return _client;
}
