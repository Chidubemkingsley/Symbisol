// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentRegistry {
    struct Agent {
        address owner;
        string name;
        string endpoint;
        string category;
        string capabilities;
        uint256 price; // in SOMI wei
        uint256 reputation;
        uint256 jobsCompleted;
        uint256 jobsFailed;
        uint256 totalEarned;
        bool isActive;
        uint256 registeredAt;
    }

    struct Rating {
        address rater;
        uint8 score;
        string comment;
        uint256 timestamp;
    }

    mapping(uint256 => Agent) public agents;
    mapping(address => uint256) public agentByOwner;
    mapping(uint256 => Rating[]) public agentRatings;
    uint256 public agentCount;
    address public authority;

    event AgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        string name,
        string category,
        uint256 price
    );
    event AgentUpdated(uint256 indexed agentId);
    event AgentStatusChanged(uint256 indexed agentId, bool isActive);
    event AgentRated(uint256 indexed agentId, address indexed rater, uint8 score);

    modifier onlyAuthority() {
        require(msg.sender == authority, "Not authority");
        _;
    }

    modifier onlyAgentOwner(uint256 agentId) {
        require(agents[agentId].owner == msg.sender, "Not agent owner");
        _;
    }

    constructor() {
        authority = msg.sender;
    }

    function setAuthority(address _authority) external onlyAuthority {
        authority = _authority;
    }

    function registerAgent(
        string calldata name,
        string calldata endpoint,
        string calldata category,
        string calldata capabilities,
        uint256 price
    ) external returns (uint256 agentId) {
        require(agentByOwner[msg.sender] == 0, "Already registered");
        require(bytes(name).length > 0, "Name required");
        require(bytes(endpoint).length > 0, "Endpoint required");
        require(bytes(category).length > 0, "Category required");
        require(price > 0, "Price must be > 0");

        agentCount++;
        agentId = agentCount;

        agents[agentId] = Agent({
            owner: msg.sender,
            name: name,
            endpoint: endpoint,
            category: category,
            capabilities: capabilities,
            price: price,
            reputation: 5000,
            jobsCompleted: 0,
            jobsFailed: 0,
            totalEarned: 0,
            isActive: true,
            registeredAt: block.timestamp
        });

        agentByOwner[msg.sender] = agentId;

        emit AgentRegistered(agentId, msg.sender, name, category, price);
    }

    function updateAgent(
        uint256 agentId,
        string calldata endpoint,
        uint256 price
    ) external onlyAgentOwner(agentId) {
        agents[agentId].endpoint = endpoint;
        agents[agentId].price = price;
        emit AgentUpdated(agentId);
    }

    function setActive(uint256 agentId, bool active) external onlyAgentOwner(agentId) {
        agents[agentId].isActive = active;
        emit AgentStatusChanged(agentId, active);
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        require(agentId > 0 && agentId <= agentCount, "Invalid ID");
        return agents[agentId];
    }

    function getAgentByOwner(address owner) external view returns (Agent memory) {
        uint256 agentId = agentByOwner[owner];
        require(agentId > 0, "Agent not found");
        return agents[agentId];
    }

    function getAgentCount() external view returns (uint256) {
        return agentCount;
    }

    function getActiveAgentsByCategory(
        string calldata category
    ) external view returns (Agent[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= agentCount; i++) {
            if (
                keccak256(bytes(agents[i].category)) == keccak256(bytes(category)) &&
                agents[i].isActive
            ) {
                count++;
            }
        }

        Agent[] memory result = new Agent[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= agentCount; i++) {
            if (
                keccak256(bytes(agents[i].category)) == keccak256(bytes(category)) &&
                agents[i].isActive
            ) {
                result[idx] = agents[i];
                idx++;
            }
        }
        return result;
    }

    function getAllActiveAgents() external view returns (Agent[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= agentCount; i++) {
            if (agents[i].isActive) count++;
        }

        Agent[] memory result = new Agent[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= agentCount; i++) {
            if (agents[i].isActive) {
                result[idx] = agents[i];
                idx++;
            }
        }
        return result;
    }

    function recordJobCompletion(uint256 agentId, uint256 fee) external onlyAuthority {
        agents[agentId].jobsCompleted++;
        agents[agentId].totalEarned += fee;
        agents[agentId].reputation += 50;
        if (agents[agentId].reputation > 10000) agents[agentId].reputation = 10000;
    }

    function recordJobFailure(uint256 agentId) external onlyAuthority {
        agents[agentId].jobsFailed++;
        if (agents[agentId].reputation >= 100) {
            agents[agentId].reputation -= 100;
        } else {
            agents[agentId].reputation = 0;
        }
    }

    function rateAgent(uint256 agentId, uint8 score, string calldata comment) external {
        require(agentId > 0 && agentId <= agentCount, "Invalid ID");
        require(score >= 1 && score <= 5, "Score 1-5");

        agentRatings[agentId].push(Rating({
            rater: msg.sender,
            score: score,
            comment: comment,
            timestamp: block.timestamp
        }));

        emit AgentRated(agentId, msg.sender, score);
    }

    function getAgentRatings(uint256 agentId) external view returns (Rating[] memory) {
        require(agentId > 0 && agentId <= agentCount, "Invalid ID");
        return agentRatings[agentId];
    }

    function discoverAgents(
        string calldata capabilityFilter
    ) external view returns (Agent[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= agentCount; i++) {
            if (
                agents[i].isActive &&
                _hasCapability(agents[i].capabilities, capabilityFilter)
            ) {
                count++;
            }
        }

        Agent[] memory result = new Agent[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= agentCount; i++) {
            if (
                agents[i].isActive &&
                _hasCapability(agents[i].capabilities, capabilityFilter)
            ) {
                result[idx] = agents[i];
                idx++;
            }
        }
        return result;
    }

    function _hasCapability(
        string memory capabilities,
        string memory filter
    ) internal pure returns (bool) {
        bytes memory caps = bytes(capabilities);
        bytes memory f = bytes(filter);
        for (uint256 i = 0; i <= caps.length - f.length; i++) {
            bool match_ = true;
            for (uint256 j = 0; j < f.length; j++) {
                if (caps[i + j] != f[j]) {
                    match_ = false;
                    break;
                }
            }
            if (match_) return true;
        }
        return false;
    }
}
