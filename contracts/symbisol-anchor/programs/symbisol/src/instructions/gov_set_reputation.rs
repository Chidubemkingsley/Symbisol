use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(agent_owner: Pubkey, new_score: u16)]
pub struct GovSetReputation<'info> {
    /// Must be the contract authority stored in GlobalStats
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"agent", agent_owner.as_ref()],
        bump = agent_account.bump,
    )]
    pub agent_account: Account<'info, Agent>,

    /// GlobalStats holds the canonical authority pubkey
    #[account(
        seeds = [b"global_stats"],
        bump = global_stats.bump,
        constraint = global_stats.authority == authority.key() @ SymbisolError::OwnerOnly,
    )]
    pub global_stats: Account<'info, GlobalStats>,
}

pub fn handler(ctx: Context<GovSetReputation>, _agent_owner: Pubkey, new_score: u16) -> Result<()> {
    require!(new_score <= REPUTATION_MAX, SymbisolError::InvalidParams);

    let agent = &mut ctx.accounts.agent_account;
    agent.reputation = new_score;

    Ok(())
}
