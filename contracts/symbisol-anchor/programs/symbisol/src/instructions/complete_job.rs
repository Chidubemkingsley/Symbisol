use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(job_id: u64)]
pub struct CompleteJob<'info> {
    #[account(mut)]
    pub worker: Signer<'info>,

    #[account(
        mut,
        seeds = [b"agent", worker.key().as_ref()],
        bump = worker_agent.bump,
        constraint = worker_agent.owner == worker.key() @ SymbisolError::Unauthorized,
    )]
    pub worker_agent: Account<'info, Agent>,

    #[account(
        mut,
        seeds = [b"job", &job_id.to_le_bytes()],
        bump = job.bump,
        constraint = job.worker == worker.key() @ SymbisolError::Unauthorized,
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

    /// Category leader PDA — updated if worker now has highest reputation
    #[account(
        init_if_needed,
        payer = worker,
        space = CategoryLeader::space(),
        seeds = [b"category_leader", job.category.as_bytes()],
        bump,
    )]
    pub category_leader: Account<'info, CategoryLeader>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CompleteJob>, _job_id: u64) -> Result<()> {
    let amount = ctx.accounts.escrow.amount;
    let worker_key = ctx.accounts.worker.key();

    // Release escrow: move lamports directly from escrow PDA to worker.
    // Data-bearing PDAs cannot use system_program::transfer as `from`.
    // Instead we manipulate lamports directly — the standard Anchor pattern.
    {
        let escrow_info = ctx.accounts.escrow.to_account_info();
        let worker_info = ctx.accounts.worker.to_account_info();
        **escrow_info.try_borrow_mut_lamports()? -= amount;
        **worker_info.try_borrow_mut_lamports()? += amount;
    }

    ctx.accounts.escrow.settled = true;

    // Update job status
    let job = &mut ctx.accounts.job;
    job.status = JobStatus::Complete;
    job.completed_at = Clock::get()?.unix_timestamp;

    // Boost worker reputation
    let agent = &mut ctx.accounts.worker_agent;
    let new_rep = (agent.reputation as u32)
        .saturating_add(REPUTATION_SUCCESS_BONUS as u32)
        .min(REPUTATION_MAX as u32) as u16;
    agent.reputation = new_rep;
    agent.jobs_completed = agent.jobs_completed.saturating_add(1);
    agent.total_earned = agent.total_earned.saturating_add(amount);

    // Update category leader if this worker now has the highest reputation
    let leader = &mut ctx.accounts.category_leader;
    if leader.leader == Pubkey::default() || new_rep > leader.reputation {
        leader.category = job.category.clone();
        leader.leader = worker_key;
        leader.reputation = new_rep;
        leader.bump = ctx.bumps.category_leader;
    }

    Ok(())
}
