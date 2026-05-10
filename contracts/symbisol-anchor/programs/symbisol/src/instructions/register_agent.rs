use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = Agent::space(),
        seeds = [b"agent", owner.key().as_ref()],
        bump,
    )]
    pub agent: Account<'info, Agent>,

    #[account(
        mut,
        seeds = [b"global_stats"],
        bump = global_stats.bump,
    )]
    pub global_stats: Account<'info, GlobalStats>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterAgent>,
    name: String,
    endpoint: String,
    price_lamports: u64,
    category: String,
) -> Result<()> {
    require!(name.len() <= Agent::MAX_NAME_LEN, SymbisolError::NameTooLong);
    require!(endpoint.len() <= Agent::MAX_ENDPOINT_LEN, SymbisolError::EndpointTooLong);
    require!(category.len() <= Agent::MAX_CATEGORY_LEN, SymbisolError::CategoryTooLong);
    require!(price_lamports > 0, SymbisolError::InvalidParams);

    let agent = &mut ctx.accounts.agent;
    agent.owner = ctx.accounts.owner.key();
    agent.name = name;
    agent.endpoint = endpoint;
    agent.price_lamports = price_lamports;
    agent.category = category;
    agent.reputation = REPUTATION_INITIAL;
    agent.jobs_completed = 0;
    agent.jobs_failed = 0;
    agent.total_earned = 0;
    agent.is_active = true;
    agent.registered_at = Clock::get()?.unix_timestamp;
    agent.bump = ctx.bumps.agent;

    let stats = &mut ctx.accounts.global_stats;
    stats.total_agents = stats.total_agents.saturating_add(1);

    Ok(())
}
