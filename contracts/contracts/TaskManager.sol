// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAgentRegistry {
    function recordJobCompletion(uint256 agentId, uint256 fee) external;
    function recordJobFailure(uint256 agentId) external;
    function agents(uint256) external view returns (address owner, string memory name, string memory endpoint, string memory category, string memory capabilities, uint256 price, uint256 reputation, uint256 jobsCompleted, uint256 jobsFailed, uint256 totalEarned, bool isActive, uint256 registeredAt);
}

contract TaskManager {
    address public authority;

    enum TaskStatus { Pending, Assigned, InProgress, Completed, Failed, Disputed }

    struct Task {
        uint256 id;
        address requester;
        uint256 agentId;
        string description;
        string params;
        string result;
        TaskStatus status;
        uint256 fee;
        uint256 createdAt;
        uint256 completedAt;
        uint256 parentTaskId;
        uint256 depth;
    }

    IAgentRegistry public registry;
    uint256 public taskCount;
    mapping(uint256 => Task) public tasks;
    mapping(address => uint256[]) public requesterTasks;

    event TaskCreated(uint256 indexed taskId, address indexed requester, uint256 indexed agentId, string description, uint256 fee);
    event TaskAssigned(uint256 indexed taskId, uint256 indexed agentId);
    event TaskCompleted(uint256 indexed taskId, string result);
    event TaskFailed(uint256 indexed taskId, string reason);
    event TaskDisputed(uint256 indexed taskId);

    modifier onlyAuthority() {
        require(msg.sender == authority, "Not authority");
        _;
    }

    constructor(address registryAddress) {
        authority = msg.sender;
        registry = IAgentRegistry(registryAddress);
    }

    function createTask(
        uint256 agentId,
        string calldata description,
        string calldata params,
        uint256 parentTaskId,
        uint256 depth
    ) external payable returns (uint256 taskId) {
        (address owner,,,,, uint256 price,,,,, bool isActive,) = registry.agents(agentId);
        require(isActive, "Agent not active");
        require(msg.value >= price, "Insufficient fee");
        require(owner != msg.sender, "Cannot hire yourself");

        taskCount++;
        taskId = taskCount;

        tasks[taskId] = Task({
            id: taskId,
            requester: msg.sender,
            agentId: agentId,
            description: description,
            params: params,
            result: "",
            status: TaskStatus.Assigned,
            fee: price,
            createdAt: block.timestamp,
            completedAt: 0,
            parentTaskId: parentTaskId,
            depth: depth
        });

        requesterTasks[msg.sender].push(taskId);

        emit TaskCreated(taskId, msg.sender, agentId, description, price);
    }

    function completeTask(uint256 taskId, string calldata result) external onlyAuthority {
        require(taskId > 0 && taskId <= taskCount, "Invalid task");
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Assigned, "Wrong status");

        task.status = TaskStatus.Completed;
        task.result = result;
        task.completedAt = block.timestamp;

        registry.recordJobCompletion(task.agentId, task.fee);

        emit TaskCompleted(taskId, result);
    }

    function failTask(uint256 taskId, string calldata reason) external onlyAuthority {
        require(taskId > 0 && taskId <= taskCount, "Invalid task");
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Assigned, "Wrong status");

        task.status = TaskStatus.Failed;
        registry.recordJobFailure(task.agentId);

        emit TaskFailed(taskId, reason);
    }

    function disputeTask(uint256 taskId) external {
        require(taskId > 0 && taskId <= taskCount, "Invalid task");
        Task storage task = tasks[taskId];
        require(task.requester == msg.sender, "Not requester");
        require(task.status == TaskStatus.Assigned, "Wrong status");

        task.status = TaskStatus.Disputed;
        emit TaskDisputed(taskId);
    }

    function getTask(uint256 taskId) external view returns (Task memory) {
        require(taskId > 0 && taskId <= taskCount, "Invalid task");
        return tasks[taskId];
    }

    function getRequesterTasks(address requester) external view returns (Task[] memory) {
        uint256[] memory ids = requesterTasks[requester];
        Task[] memory result = new Task[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = tasks[ids[i]];
        }
        return result;
    }

    function getRecentTasks(uint256 limit) external view returns (Task[] memory) {
        uint256 count = limit < taskCount ? limit : taskCount;
        Task[] memory result = new Task[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tasks[taskCount - i];
        }
        return result;
    }

    function getTaskCount() external view returns (uint256) {
        return taskCount;
    }
}
