use anchor_lang::prelude::*;

declare_id!("5383AVU3XCHu2L4dEVZVGtitekZEuaFBFoxgnFQJJmmB");

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

pub use constants::*;
pub use errors::*;
pub use instructions::*;
pub use state::*;

#[program]
pub mod symbisol {
    use super::*;

    pub fn initialize_global_stats(ctx: Context<InitializeGlobalStats>) -> Result<()> {
        instructions::initialize_global_stats::handler(ctx)
    }

    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        name: String,
        endpoint: String,
        price_lamports: u64,
        category: String,
    ) -> Result<()> {
        instructions::register_agent::handler(ctx, name, endpoint, price_lamports, category)
    }

    pub fn update_agent(
        ctx: Context<UpdateAgent>,
        endpoint: String,
        price_lamports: u64,
    ) -> Result<()> {
        instructions::update_agent::handler(ctx, endpoint, price_lamports)
    }

    pub fn set_active(ctx: Context<SetActive>, active: bool) -> Result<()> {
        instructions::set_active::handler(ctx, active)
    }

    pub fn create_job(
        ctx: Context<CreateJob>,
        category: String,
        parent_job_id: u64,
        job_id_seed: u64,
    ) -> Result<()> {
        instructions::create_job::handler(ctx, category, parent_job_id, job_id_seed)
    }

    pub fn complete_job(ctx: Context<CompleteJob>, job_id: u64) -> Result<()> {
        instructions::complete_job::handler(ctx, job_id)
    }

    pub fn fail_job(ctx: Context<FailJob>, job_id: u64) -> Result<()> {
        instructions::fail_job::handler(ctx, job_id)
    }

    pub fn refund_escrow(ctx: Context<RefundEscrow>, job_id: u64) -> Result<()> {
        instructions::refund_escrow::handler(ctx, job_id)
    }

    pub fn dispute_job(ctx: Context<DisputeJob>, job_id: u64) -> Result<()> {
        instructions::dispute_job::handler(ctx, job_id)
    }

    /// Governance: set an agent's reputation directly.
    /// `agent_owner` is the wallet that owns the agent PDA.
    pub fn gov_set_reputation(
        ctx: Context<GovSetReputation>,
        agent_owner: Pubkey,
        new_score: u16,
    ) -> Result<()> {
        instructions::gov_set_reputation::handler(ctx, agent_owner, new_score)
    }
}
