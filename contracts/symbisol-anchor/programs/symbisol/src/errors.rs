use anchor_lang::prelude::*;

#[error_code]
pub enum SymbisolError {
    #[msg("Only the contract owner can call this")]
    OwnerOnly,
    #[msg("Agent already registered")]
    AgentExists,
    #[msg("Agent not found")]
    AgentNotFound,
    #[msg("Job not found")]
    JobNotFound,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid parameters")]
    InvalidParams,
    #[msg("Job already complete")]
    JobAlreadyComplete,
    #[msg("Cannot hire yourself")]
    SelfHire,
    #[msg("Escrow not found")]
    EscrowNotFound,
    #[msg("Deadline not passed")]
    DeadlineNotPassed,
    #[msg("Job already settled")]
    JobAlreadySettled,
    #[msg("Not disputable")]
    NotDisputable,
    #[msg("Category exceeds max length")]
    CategoryTooLong,
    #[msg("Name exceeds max length")]
    NameTooLong,
    #[msg("Endpoint exceeds max length")]
    EndpointTooLong,
}
