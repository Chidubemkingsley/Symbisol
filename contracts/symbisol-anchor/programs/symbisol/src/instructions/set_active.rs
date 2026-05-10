use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct SetActive<'info> {
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

pub fn handler(ctx: Context<SetActive>, active: bool) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    agent.is_active = active;
    Ok(())
}
