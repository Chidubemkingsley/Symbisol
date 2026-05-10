import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Symbisol } from '../target/types/symbisol';
import { expect } from 'chai';

describe('symbisol', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Symbisol as Program<Symbisol>;

  // Shared state across tests
  let globalStatsPda: anchor.web3.PublicKey;
  let worker: anchor.web3.Keypair;
  let workerAgentPda: anchor.web3.PublicKey;
  let currentJobId: anchor.BN;

  // ─── Helper: derive job/escrow PDAs from a job id ───────────────────────
  function jobPda(jobId: anchor.BN) {
    const idBytes = Buffer.alloc(8);
    idBytes.writeBigUInt64LE(BigInt(jobId.toString()));
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('job'), idBytes],
      program.programId
    )[0];
  }

  function escrowPda(jobId: anchor.BN) {
    const idBytes = Buffer.alloc(8);
    idBytes.writeBigUInt64LE(BigInt(jobId.toString()));
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), idBytes],
      program.programId
    )[0];
  }

  function categoryLeaderPda(category: string) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('category_leader'), Buffer.from(category)],
      program.programId
    )[0];
  }

  // ─── 1. Initialize Global Stats ─────────────────────────────────────────
  it('initializes global stats', async () => {
    [globalStatsPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('global_stats')],
      program.programId
    );

    try {
      const tx = await program.methods
        .initializeGlobalStats()
        .accounts({
          authority: provider.wallet.publicKey,
          globalStats: globalStatsPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      console.log(`  ✔ GlobalStats initialized. Tx: ${tx}`);
    } catch (err: any) {
      if (err.message?.includes('already in use')) {
        console.log('  ✔ GlobalStats already initialized (idempotent)');
      } else {
        throw err;
      }
    }

    const stats = await program.account.globalStats.fetch(globalStatsPda);
    expect(stats.nextJobId.toNumber()).to.be.gte(1);
    console.log(`  ✔ next_job_id = ${stats.nextJobId}`);
  });

  // ─── 2. Register Requester Agent ─────────────────────────────────────────
  it('registers the requester agent', async () => {
    const owner = provider.wallet.publicKey;
    const [agentPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('agent'), owner.toBuffer()],
      program.programId
    );

    try {
      const tx = await program.methods
        .registerAgent('Manager Agent', '/api/manager', new anchor.BN(1_000_000), 'management')
        .accounts({
          owner,
          agent: agentPda,
          globalStats: globalStatsPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      console.log(`  ✔ Requester agent registered. Tx: ${tx}`);
    } catch (err: any) {
      if (err.message?.includes('already in use')) {
        console.log('  ✔ Requester agent already registered (idempotent)');
      } else {
        throw err;
      }
    }

    const agent = await program.account.agent.fetch(agentPda);
    expect(agent.name).to.equal('Manager Agent');
    expect(agent.reputation).to.equal(5000);
    expect(agent.isActive).to.equal(true);
    console.log(`  ✔ reputation = ${agent.reputation}, isActive = ${agent.isActive}`);
  });

  // ─── 3. Register Worker Agent ────────────────────────────────────────────
  it('registers a worker agent', async () => {
    worker = anchor.web3.Keypair.generate();

    // Fund the worker from the provider wallet (avoids devnet airdrop rate limits)
    const transferTx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: worker.publicKey,
        lamports: 1 * anchor.web3.LAMPORTS_PER_SOL,
      })
    );
    const sig = await provider.sendAndConfirm(transferTx);
    console.log(`  ✔ Funded worker from provider. Tx: ${sig}`);

    [workerAgentPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('agent'), worker.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .registerAgent('Worker Bot', '/api/work', new anchor.BN(500_000), 'utility')
      .accounts({
        owner: worker.publicKey,
        agent: workerAgentPda,
        globalStats: globalStatsPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([worker])
      .rpc();

    console.log(`  ✔ Worker agent registered. Tx: ${tx}`);

    const agent = await program.account.agent.fetch(workerAgentPda);
    expect(agent.name).to.equal('Worker Bot');
    expect(agent.priceLamports.toNumber()).to.equal(500_000);
    expect(agent.reputation).to.equal(5000);
    console.log(`  ✔ price = ${agent.priceLamports}, reputation = ${agent.reputation}`);
  });

  // ─── 4. Update Agent ─────────────────────────────────────────────────────
  it('updates agent endpoint and price', async () => {
    const [agentPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('agent'), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .updateAgent('/api/manager/v2', new anchor.BN(2_000_000))
      .accounts({
        owner: provider.wallet.publicKey,
        agent: agentPda,
      })
      .rpc();

    console.log(`  ✔ Agent updated. Tx: ${tx}`);

    const agent = await program.account.agent.fetch(agentPda);
    expect(agent.endpoint).to.equal('/api/manager/v2');
    expect(agent.priceLamports.toNumber()).to.equal(2_000_000);
    console.log(`  ✔ new endpoint = ${agent.endpoint}, new price = ${agent.priceLamports}`);
  });

  // ─── 5. Set Active ───────────────────────────────────────────────────────
  it('toggles agent active status', async () => {
    const [agentPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('agent'), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    // Deactivate
    await program.methods.setActive(false)
      .accounts({ owner: provider.wallet.publicKey, agent: agentPda })
      .rpc();
    let agent = await program.account.agent.fetch(agentPda);
    expect(agent.isActive).to.equal(false);
    console.log('  ✔ Agent deactivated');

    // Reactivate
    await program.methods.setActive(true)
      .accounts({ owner: provider.wallet.publicKey, agent: agentPda })
      .rpc();
    agent = await program.account.agent.fetch(agentPda);
    expect(agent.isActive).to.equal(true);
    console.log('  ✔ Agent reactivated');
  });

  // ─── 6. Create Job ───────────────────────────────────────────────────────
  it('creates a job with escrow', async () => {
    const stats = await program.account.globalStats.fetch(globalStatsPda);
    currentJobId = stats.nextJobId;

    const job = jobPda(currentJobId);
    const escrow = escrowPda(currentJobId);

    const tx = await program.methods
      .createJob('utility', new anchor.BN(0), currentJobId)
      .accounts({
        requester: provider.wallet.publicKey,
        workerAgent: workerAgentPda,
        job,
        escrow,
        globalStats: globalStatsPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`  ✔ Job created. Tx: ${tx}`);

    const jobAccount = await program.account.job.fetch(job);
    expect(jobAccount.worker.toBase58()).to.equal(worker.publicKey.toBase58());
    expect(jobAccount.amount.toNumber()).to.equal(500_000);
    expect(jobAccount.status).to.deep.equal({ pending: {} });
    expect(jobAccount.category).to.equal('utility');

    const escrowAccount = await program.account.escrow.fetch(escrow);
    expect(escrowAccount.amount.toNumber()).to.equal(500_000);
    expect(escrowAccount.settled).to.equal(false);

    const statsAfter = await program.account.globalStats.fetch(globalStatsPda);
    expect(statsAfter.nextJobId.toNumber()).to.equal(currentJobId.toNumber() + 1);
    expect(statsAfter.totalJobs.toNumber()).to.be.gte(1);

    console.log(`  ✔ escrow holds ${escrowAccount.amount} lamports, settled = ${escrowAccount.settled}`);
    console.log(`  ✔ next_job_id bumped to ${statsAfter.nextJobId}`);
  });

  // ─── 7. Complete Job ─────────────────────────────────────────────────────
  it('completes the job and releases escrow to worker', async () => {
    const job = jobPda(currentJobId);
    const escrow = escrowPda(currentJobId);
    const categoryLeader = categoryLeaderPda('utility');

    const workerBefore = await provider.connection.getBalance(worker.publicKey);

    const tx = await program.methods
      .completeJob(currentJobId)
      .accounts({
        worker: worker.publicKey,
        workerAgent: workerAgentPda,
        job,
        escrow,
        categoryLeader,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([worker])
      .rpc();

    console.log(`  ✔ Job completed. Tx: ${tx}`);

    const workerAfter = await provider.connection.getBalance(worker.publicKey);
    expect(workerAfter).to.be.gt(workerBefore);
    console.log(`  ✔ Worker balance increased by ${workerAfter - workerBefore} lamports`);

    const jobAccount = await program.account.job.fetch(job);
    expect(jobAccount.status).to.deep.equal({ complete: {} });

    const escrowAccount = await program.account.escrow.fetch(escrow);
    expect(escrowAccount.settled).to.equal(true);

    const agentAccount = await program.account.agent.fetch(workerAgentPda);
    expect(agentAccount.reputation).to.equal(5050); // 5000 + 50 bonus
    expect(agentAccount.jobsCompleted.toNumber()).to.equal(1);
    console.log(`  ✔ Worker reputation = ${agentAccount.reputation}, jobs_completed = ${agentAccount.jobsCompleted}`);

    // Category leader should now point to a worker with boosted reputation
    const leader = await program.account.categoryLeader.fetch(categoryLeader);
    expect(leader.reputation).to.be.gte(5050); // at least one success bonus applied
    console.log(`  ✔ Category leader for 'utility' = ${leader.leader.toBase58()}, rep = ${leader.reputation}`);
  });

  // ─── 8. Create + Fail Job ────────────────────────────────────────────────
  it('creates a second job and fails it (refunds requester)', async () => {
    const stats = await program.account.globalStats.fetch(globalStatsPda);
    const jobId = stats.nextJobId;

    const job = jobPda(jobId);
    const escrow = escrowPda(jobId);

    await program.methods
      .createJob('utility', new anchor.BN(0), jobId)
      .accounts({
        requester: provider.wallet.publicKey,
        workerAgent: workerAgentPda,
        job,
        escrow,
        globalStats: globalStatsPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log('  ✔ Second job created');

    const requesterBefore = await provider.connection.getBalance(provider.wallet.publicKey);

    const tx = await program.methods
      .failJob(jobId)
      .accounts({
        caller: provider.wallet.publicKey,
        workerAgent: workerAgentPda,
        job,
        escrow,
        requesterRecipient: provider.wallet.publicKey,
        globalStats: globalStatsPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`  ✔ Job failed. Tx: ${tx}`);

    const requesterAfter = await provider.connection.getBalance(provider.wallet.publicKey);
    expect(requesterAfter).to.be.gt(requesterBefore);
    console.log(`  ✔ Requester refunded ${requesterAfter - requesterBefore} lamports`);

    const jobAccount = await program.account.job.fetch(job);
    expect(jobAccount.status).to.deep.equal({ failed: {} });

    const agentAccount = await program.account.agent.fetch(workerAgentPda);
    expect(agentAccount.reputation).to.equal(4950); // 5050 - 100 penalty
    expect(agentAccount.jobsFailed.toNumber()).to.equal(1);
    console.log(`  ✔ Worker reputation penalized to ${agentAccount.reputation}`);
  });

  // ─── 9. Create + Dispute Job ─────────────────────────────────────────────
  it('creates a third job and disputes it', async () => {
    const stats = await program.account.globalStats.fetch(globalStatsPda);
    const jobId = stats.nextJobId;

    const job = jobPda(jobId);
    const escrow = escrowPda(jobId);

    await program.methods
      .createJob('utility', new anchor.BN(0), jobId)
      .accounts({
        requester: provider.wallet.publicKey,
        workerAgent: workerAgentPda,
        job,
        escrow,
        globalStats: globalStatsPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const tx = await program.methods
      .disputeJob(jobId)
      .accounts({
        requester: provider.wallet.publicKey,
        job,
        escrow,
      })
      .rpc();

    console.log(`  ✔ Job disputed. Tx: ${tx}`);

    const jobAccount = await program.account.job.fetch(job);
    expect(jobAccount.status).to.deep.equal({ disputed: {} });
    console.log('  ✔ Job status = disputed, funds locked in escrow');
  });

  // ─── 10. Gov Set Reputation ──────────────────────────────────────────────
  it('governance sets agent reputation directly', async () => {
    const tx = await program.methods
      .govSetReputation(worker.publicKey, 8000)
      .accounts({
        authority: provider.wallet.publicKey,
        agentAccount: workerAgentPda,
        globalStats: globalStatsPda,
      })
      .rpc();

    console.log(`  ✔ Gov set reputation. Tx: ${tx}`);

    const agent = await program.account.agent.fetch(workerAgentPda);
    expect(agent.reputation).to.equal(8000);
    console.log(`  ✔ Worker reputation overridden to ${agent.reputation}`);
  });

  // ─── 11. Final Stats ─────────────────────────────────────────────────────
  it('verifies final global stats', async () => {
    const stats = await program.account.globalStats.fetch(globalStatsPda);
    expect(stats.totalJobs.toNumber()).to.be.gte(3);
    expect(stats.totalVolume.toNumber()).to.be.gte(1_500_000); // 3 × 500_000
    expect(stats.totalAgents.toNumber()).to.be.gte(2);
    console.log(`  ✔ total_jobs = ${stats.totalJobs}, total_volume = ${stats.totalVolume}, total_agents = ${stats.totalAgents}`);
  });
});
