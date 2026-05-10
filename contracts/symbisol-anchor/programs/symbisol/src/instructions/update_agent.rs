use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct UpdateAgent<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"agent", owner.key().as_ref()],
        bump = agent.bump,
        constraint = agent.owner == owner.key() @ SymbisolError::Unauthorized,
    )]
    pub agent: Account<'info, Agent>,
}

pub fn handler(ctx: Context<UpdateAgent>, endpoint: String, price_lamports: u64) -> Result<()> {
    require!(endpoint.len() <= Agent::MAX_ENDPOINT_LEN, SymbisolError::EndpointTooLong);
    require!(price_lamports > 0, SymbisolError::InvalidParams);

    let agent = &mut ctx.accounts.agent;
    agent.endpoint = endpoint;
    agent.price_lamports = price_lamports;

    Ok(())
}
