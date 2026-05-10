use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::*;

/// We need the job_id bytes as a fixed-size array for PDA seeds.
/// Anchor macro constraints require seed expressions to be simple references,
/// so we pass job_id as an instruction arg and derive the seeds in the handler.
/// The accounts struct uses a placeholder — actual PDA init is done via CPI
/// in the handler using invoke_signed. Instead, we use a simpler pattern:
/// pass the job_id as an instruction argument and use it directly in seeds
/// via a workaround with a local const in the accounts struct.
///
/// Anchor 0.29+ supports `#[instruction(...)]` args in seeds via the
/// `seeds::program` feature. We use the standard pattern below.

#[derive(Accounts)]
#[instruction(category: String, parent_job_id: u64, job_id_seed: u64)]
pub struct CreateJob<'info> {
    #[account(mut)]
    pub requester: Signer<'info>,

    /// The worker's agent PDA — price is read from here
    #[account(
        seeds = [b"agent", worker_agent.owner.as_ref()],
        bump = worker_agent.bump,
    )]
    pub worker_agent: Account<'info, Agent>,

    /// Job PDA — initialized here, keyed by job_id_seed (= current next_job_id)
    #[account(
        init,
        payer = requester,
        space = Job::space(),
        seeds = [b"job", job_id_seed.to_le_bytes().as_ref()],
        bump,
    )]
    pub job: Account<'info, Job>,

    /// Escrow PDA — holds the SOL until settlement
    #[account(
        init,
        payer = requester,
        space = Escrow::space(),
        seeds = [b"escrow", job_id_seed.to_le_bytes().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mut,
        seeds = [b"global_stats"],
        bump = global_stats.bump,
    )]
    pub global_stats: Account<'info, GlobalStats>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateJob>,
    category: String,
    parent_job_id: u64,
    job_id_seed: u64,
) -> Result<()> {
    let requester = ctx.accounts.requester.key();
    let worker = ctx.accounts.worker_agent.owner;
    let amount = ctx.accounts.worker_agent.price_lamports;

    // job_id_seed must match the current next_job_id to prevent race conditions
    require!(
        job_id_seed == ctx.accounts.global_stats.next_job_id,
        SymbisolError::InvalidParams
    );
    require!(requester != worker, SymbisolError::SelfHire);
    require!(ctx.accounts.worker_agent.is_active, SymbisolError::InvalidParams);
    require!(amount > 0, SymbisolError::InvalidParams);
    require!(category.len() <= Job::MAX_CATEGORY_LEN, SymbisolError::CategoryTooLong);

    // Transfer SOL from requester into the escrow PDA
    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.requester.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
            },
        ),
        amount,
    )?;

    // Initialize escrow
    let escrow = &mut ctx.accounts.escrow;
    escrow.amount = amount;
    escrow.requester = requester;
    escrow.worker = worker;
    escrow.deadline_slot = Clock::get()?.slot + ESCROW_TIMEOUT_SLOTS;
    escrow.settled = false;
    escrow.bump = ctx.bumps.escrow;

    // Initialize job
    let job = &mut ctx.accounts.job;
    job.requester = requester;
    job.worker = worker;
    job.amount = amount;
    job.category = category.clone();
    job.status = JobStatus::Pending;
    job.parent_job_id = parent_job_id;
    job.created_at = Clock::get()?.unix_timestamp;
    job.completed_at = 0;
    job.bump = ctx.bumps.job;

    // Update global stats
    let stats = &mut ctx.accounts.global_stats;
    stats.next_job_id = stats.next_job_id.saturating_add(1);
    stats.total_jobs = stats.total_jobs.saturating_add(1);
    stats.total_volume = stats.total_volume.saturating_add(amount);

    emit!(JobCreated {
        job_id: job_id_seed,
        requester,
        worker,
        amount,
        category,
        parent_job_id,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct JobCreated {
    pub job_id: u64,
    pub requester: Pubkey,
    pub worker: Pubkey,
    pub amount: u64,
    pub category: String,
    pub parent_job_id: u64,
    pub timestamp: i64,
}
