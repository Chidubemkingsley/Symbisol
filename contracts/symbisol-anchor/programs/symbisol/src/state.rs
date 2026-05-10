use anchor_lang::prelude::*;

/// Agent profile account
#[account]
pub struct Agent {
    pub owner: Pubkey,
    pub name: String,            // max 64 chars
    pub endpoint: String,        // max 256 chars
    pub price_lamports: u64,     // price in lamports
    pub category: String,        // max 32 chars
    pub reputation: u16,         // 0-10000 (basis points)
    pub jobs_completed: u64,
    pub jobs_failed: u64,
    pub total_earned: u64,       // lamports earned lifetime
    pub is_active: bool,
    pub registered_at: i64,      // unix timestamp
    pub bump: u8,
}

impl Agent {
    pub const MAX_NAME_LEN: usize = 64;
    pub const MAX_ENDPOINT_LEN: usize = 256;
    pub const MAX_CATEGORY_LEN: usize = 32;

    pub fn space() -> usize {
        8 +                              // discriminator
        32 +                             // owner
        4 + Self::MAX_NAME_LEN +         // name
        4 + Self::MAX_ENDPOINT_LEN +     // endpoint
        8 +                              // price_lamports
        4 + Self::MAX_CATEGORY_LEN +     // category
        2 +                              // reputation
        8 +                              // jobs_completed
        8 +                              // jobs_failed
        8 +                              // total_earned
        1 +                              // is_active
        8 +                              // registered_at
        1                                // bump
    }
}

/// Job record account
#[account]
pub struct Job {
    pub requester: Pubkey,
    pub worker: Pubkey,
    pub amount: u64,             // lamports held in escrow
    pub category: String,        // max 32 chars
    pub status: JobStatus,
    pub parent_job_id: u64,      // 0 if top-level
    pub created_at: i64,
    pub completed_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum JobStatus {
    Pending,
    Complete,
    Failed,
    Disputed,
}

impl Job {
    pub const MAX_CATEGORY_LEN: usize = 32;

    pub fn space() -> usize {
        8 +                              // discriminator
        32 +                             // requester
        32 +                             // worker
        8 +                              // amount
        4 + Self::MAX_CATEGORY_LEN +     // category
        1 +                              // status variant
        8 +                              // parent_job_id
        8 +                              // created_at
        8 +                              // completed_at
        1                                // bump
    }
}

/// Escrow account — SOL held by program until job settlement
#[account]
pub struct Escrow {
    pub amount: u64,
    pub requester: Pubkey,
    pub worker: Pubkey,
    pub deadline_slot: u64,
    pub settled: bool,
    pub bump: u8,
}

impl Escrow {
    pub fn space() -> usize {
        8 +  // discriminator
        8 +  // amount
        32 + // requester
        32 + // worker
        8 +  // deadline_slot
        1 +  // settled
        1    // bump
    }
}

/// Category leader tracker — one PDA per category string
#[account]
pub struct CategoryLeader {
    pub category: String,   // max 32 chars
    pub leader: Pubkey,
    pub reputation: u16,    // cached reputation of the current leader
    pub bump: u8,
}

impl CategoryLeader {
    pub const MAX_CATEGORY_LEN: usize = 32;

    pub fn space() -> usize {
        8 +                              // discriminator
        4 + Self::MAX_CATEGORY_LEN +     // category
        32 +                             // leader
        2 +                              // reputation
        1                                // bump
    }
}

/// Global stats account (single PDA) — also stores the contract authority
#[account]
pub struct GlobalStats {
    pub authority: Pubkey,    // contract owner / governance key
    pub total_agents: u64,
    pub total_jobs: u64,
    pub total_volume: u64,    // lamports
    pub next_job_id: u64,
    pub bump: u8,
}

impl GlobalStats {
    pub fn space() -> usize {
        8 +  // discriminator
        32 + // authority
        8 +  // total_agents
        8 +  // total_jobs
        8 +  // total_volume
        8 +  // next_job_id
        1    // bump
    }
}
