// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentVault {
    address public authority;

    struct Vault {
        address owner;
        uint256 balance;
        uint256 dailyLimit;
        uint256 lastWithdrawalDay;
        uint256 withdrawnToday;
        bool isLocked;
    }

    mapping(uint256 => Vault) public vaults;
    mapping(address => uint256) public vaultByOwner;
    uint256 public vaultCount;

    event VaultCreated(uint256 indexed vaultId, address indexed owner);
    event Deposited(uint256 indexed vaultId, address indexed from, uint256 amount);
    event Withdrawn(uint256 indexed vaultId, address indexed to, uint256 amount);
    event DailyLimitSet(uint256 indexed vaultId, uint256 limit);

    modifier onlyAuthority() {
        require(msg.sender == authority, "Not authority");
        _;
    }

    modifier onlyVaultOwner(uint256 vaultId) {
        require(vaults[vaultId].owner == msg.sender, "Not vault owner");
        _;
    }

    constructor() {
        authority = msg.sender;
    }

    function createVault(address owner, uint256 dailyLimit) external onlyAuthority returns (uint256) {
        require(vaultByOwner[owner] == 0, "Vault exists");
        vaultCount++;
        vaults[vaultCount] = Vault({
            owner: owner,
            balance: 0,
            dailyLimit: dailyLimit,
            lastWithdrawalDay: 0,
            withdrawnToday: 0,
            isLocked: false
        });
        vaultByOwner[owner] = vaultCount;
        emit VaultCreated(vaultCount, owner);
        return vaultCount;
    }

    function deposit(uint256 vaultId) external payable {
        require(vaultId > 0 && vaultId <= vaultCount, "Invalid vault");
        vaults[vaultId].balance += msg.value;
        emit Deposited(vaultId, msg.sender, msg.value);
    }

    function withdraw(uint256 vaultId, uint256 amount, address payable to) external onlyVaultOwner(vaultId) {
        Vault storage v = vaults[vaultId];
        require(!v.isLocked, "Vault locked");
        require(v.balance >= amount, "Insufficient balance");

        uint256 day = block.timestamp / 1 days;
        if (day != v.lastWithdrawalDay) {
            v.lastWithdrawalDay = day;
            v.withdrawnToday = 0;
        }
        require(v.withdrawnToday + amount <= v.dailyLimit, "Daily limit exceeded");

        v.balance -= amount;
        v.withdrawnToday += amount;
        to.transfer(amount);

        emit Withdrawn(vaultId, to, amount);
    }

    function setDailyLimit(uint256 vaultId, uint256 limit) external onlyVaultOwner(vaultId) {
        vaults[vaultId].dailyLimit = limit;
        emit DailyLimitSet(vaultId, limit);
    }

    function lockVault(uint256 vaultId) external onlyAuthority {
        vaults[vaultId].isLocked = true;
    }

    function unlockVault(uint256 vaultId) external onlyAuthority {
        vaults[vaultId].isLocked = false;
    }

    function getBalance(uint256 vaultId) external view returns (uint256) {
        require(vaultId > 0 && vaultId <= vaultCount, "Invalid vault");
        return vaults[vaultId].balance;
    }

    function transferBetweenVaults(
        uint256 fromVaultId,
        uint256 toVaultId,
        uint256 amount
    ) external {
        require(
            vaults[fromVaultId].owner == msg.sender,
            "Not from-vault owner"
        );
        require(toVaultId > 0 && toVaultId <= vaultCount, "Invalid to-vault");
        require(vaults[fromVaultId].balance >= amount, "Insufficient");

        vaults[fromVaultId].balance -= amount;
        vaults[toVaultId].balance += amount;
    }
}
