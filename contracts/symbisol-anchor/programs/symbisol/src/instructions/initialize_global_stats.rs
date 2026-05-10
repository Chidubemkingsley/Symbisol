use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeGlobalStats<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = GlobalStats::space(),
        seeds = [b"global_stats"],
        bump,
    )]
    pub global_stats: Account<'info, GlobalStats>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeGlobalStats>) -> Result<()> {
    let stats = &mut ctx.accounts.global_stats;
    stats.authority = ctx.accounts.authority.key();  // store contract owner
    stats.total_agents = 0;
    stats.total_jobs = 0;
    stats.total_volume = 0;
    stats.next_job_id = 1;
    stats.bump = ctx.bumps.global_stats;
    Ok(())
}
