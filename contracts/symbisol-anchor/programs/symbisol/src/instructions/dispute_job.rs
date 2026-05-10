use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(job_id: u64)]  // job_id declared so it can be used in PDA seeds
pub struct DisputeJob<'info> {
    #[account(mut)]
    pub requester: Signer<'info>,

    #[account(
        mut,
        seeds = [b"job", &job_id.to_le_bytes()],
        bump = job.bump,
        constraint = job.requester == requester.key() @ SymbisolError::Unauthorized,
        constraint = job.status == JobStatus::Pending @ SymbisolError::JobAlreadyComplete,
    )]
    pub job: Account<'info, Job>,

    #[account(
        seeds = [b"escrow", &job_id.to_le_bytes()],
        bump = escrow.bump,
        constraint = !escrow.settled @ SymbisolError::JobAlreadySettled,
    )]
    pub escrow: Account<'info, Escrow>,
}

pub fn handler(ctx: Context<DisputeJob>, _job_id: u64) -> Result<()> {
    let job = &mut ctx.accounts.job;
    job.status = JobStatus::Disputed;
    job.completed_at = 0;
    Ok(())
}
