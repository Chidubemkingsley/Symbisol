use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(job_id: u64)]
pub struct RefundEscrow<'info> {
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
        constraint = Clock::get()?.slot >= escrow.deadline_slot @ SymbisolError::DeadlineNotPassed,
    )]
    pub escrow: Account<'info, Escrow>,

    /// Must be the original requester
    #[account(
        mut,
        constraint = requester_recipient.key() == escrow.requester @ SymbisolError::Unauthorized,
    )]
    pub requester_recipient: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RefundEscrow>, _job_id: u64) -> Result<()> {
    let amount = ctx.accounts.escrow.amount;

    // Refund to requester by directly moving lamports (data-bearing PDA)
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

    Ok(())
}
