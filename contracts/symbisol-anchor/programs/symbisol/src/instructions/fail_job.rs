use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(job_id: u64)]
pub struct FailJob<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    /// The worker's agent PDA — reputation will be penalized
    #[account(
        mut,
        seeds = [b"agent", job.worker.as_ref()],
        bump = worker_agent.bump,
    )]
    pub worker_agent: Account<'info, Agent>,

    #[account(
        mut,
        seeds = [b"job", &job_id.to_le_bytes()],
        bump = job.bump,
        constraint = job.status == JobStatus::Pending @ SymbisolError::JobAlreadyComplete,
    )]
    pub job: Account<'info, Job>,

    #[account(
        mut,
        seeds = [b"escrow", &job_id.to_le_bytes()],
        bump = escrow.bump,
        constraint = !escrow.settled @ SymbisolError::JobAlreadySettled,
    )]
    pub escrow: Account<'info, Escrow>,

    /// Receives the refunded lamports (must be the original requester)
    #[account(
        mut,
        constraint = requester_recipient.key() == job.requester @ SymbisolError::Unauthorized,
    )]
    pub requester_recipient: SystemAccount<'info>,

    /// GlobalStats holds the canonical authority pubkey
    #[account(
        seeds = [b"global_stats"],
        bump = global_stats.bump,
    )]
    pub global_stats: Account<'info, GlobalStats>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<FailJob>, _job_id: u64) -> Result<()> {
    let caller = ctx.accounts.caller.key();

    // Only the requester OR the contract authority can fail a job
    require!(
        caller == ctx.accounts.job.requester || caller == ctx.accounts.global_stats.authority,
        SymbisolError::Unauthorized
    );

    let amount = ctx.accounts.escrow.amount;

    // Refund escrow to requester by directly moving lamports (data-bearing PDA)
    {
        let escrow_info = ctx.accounts.escrow.to_account_info();
        let recipient_info = ctx.accounts.requester_recipient.to_account_info();
        **escrow_info.try_borrow_mut_lamports()? -= amount;
        **recipient_info.try_borrow_mut_lamports()? += amount;
    }

    ctx.accounts.escrow.settled = true;

    let job = &mut ctx.accounts.job;
    job.status = JobStatus::Failed;
    job.completed_at = Clock::get()?.unix_timestamp;

    // Penalize worker reputation
    let agent = &mut ctx.accounts.worker_agent;
    let current_rep = agent.reputation as u32;
    agent.reputation = if current_rep >= REPUTATION_FAILURE_PENALTY as u32 {
        (current_rep - REPUTATION_FAILURE_PENALTY as u32) as u16
    } else {
        0
    };
    agent.jobs_failed = agent.jobs_failed.saturating_add(1);

    Ok(())
}
