import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers";

describe("SomniaSwarm Contracts", function () {
  let registry: any;
  let taskManager: any;
  let vault: any;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory("AgentRegistry");
    registry = await RegistryFactory.deploy();
    await registry.waitForDeployment();

    const TaskManagerFactory = await ethers.getContractFactory("TaskManager");
    taskManager = await TaskManagerFactory.deploy(await registry.getAddress());
    await taskManager.waitForDeployment();

    const VaultFactory = await ethers.getContractFactory("AgentVault");
    vault = await VaultFactory.deploy();
    await vault.waitForDeployment();
  });

  // ─── AgentRegistry ───────────────────────────────────────────────
  describe("AgentRegistry", function () {
    it("deploys with correct authority", async function () {
      expect(await registry.authority()).to.equal(owner.address);
    });

    it("registers an agent successfully", async function () {
      const price = parseEther("0.001");
      await expect(
        registry.connect(user1).registerAgent(
          "ResearchAgent",
          "/api/research",
          "research",
          "web-search,llm",
          price
        )
      )
        .to.emit(registry, "AgentRegistered")
        .withArgs(1, user1.address, "ResearchAgent", "research", price);

      const agent = await registry.getAgent(1);
      expect(agent.name).to.equal("ResearchAgent");
      expect(agent.owner).to.equal(user1.address);
      expect(agent.reputation).to.equal(5000);
      expect(agent.isActive).to.be.true;
    });

    it("rejects duplicate registration from same owner", async function () {
      const price = parseEther("0.001");
      await registry.connect(user1).registerAgent("Agent1", "/ep1", "nlp", "caps", price);
      await expect(
        registry.connect(user1).registerAgent("Agent2", "/ep2", "nlp", "caps", price)
      ).to.be.revertedWith("Already registered");
    });

    it("rejects registration with zero price", async function () {
      await expect(
        registry.connect(user1).registerAgent("Agent", "/ep", "nlp", "caps", 0)
      ).to.be.revertedWith("Price must be > 0");
    });

    it("records job completion and increases reputation", async function () {
      const price = parseEther("0.001");
      await registry.connect(user1).registerAgent("Agent", "/ep", "nlp", "caps", price);

      const before = (await registry.getAgent(1)).reputation;
      await registry.connect(owner).recordJobCompletion(1, price);
      const after = (await registry.getAgent(1)).reputation;

      expect(after).to.equal(before + BigInt(50));
      expect((await registry.getAgent(1)).jobsCompleted).to.equal(1);
    });

    it("records job failure and decreases reputation", async function () {
      const price = parseEther("0.001");
      await registry.connect(user1).registerAgent("Agent", "/ep", "nlp", "caps", price);

      const before = (await registry.getAgent(1)).reputation;
      await registry.connect(owner).recordJobFailure(1);
      const after = (await registry.getAgent(1)).reputation;

      expect(after).to.equal(before - BigInt(100));
    });

    it("allows agent owner to set active status", async function () {
      const price = parseEther("0.001");
      await registry.connect(user1).registerAgent("Agent", "/ep", "nlp", "caps", price);

      await registry.connect(user1).setActive(1, false);
      expect((await registry.getAgent(1)).isActive).to.be.false;

      await registry.connect(user1).setActive(1, true);
      expect((await registry.getAgent(1)).isActive).to.be.true;
    });

    it("allows rating an agent (1-5)", async function () {
      const price = parseEther("0.001");
      await registry.connect(user1).registerAgent("Agent", "/ep", "nlp", "caps", price);

      await expect(
        registry.connect(user2).rateAgent(1, 5, "Excellent!")
      ).to.emit(registry, "AgentRated");

      const ratings = await registry.getAgentRatings(1);
      expect(ratings.length).to.equal(1);
      expect(ratings[0].score).to.equal(5);
    });

    it("rejects out-of-range ratings", async function () {
      const price = parseEther("0.001");
      await registry.connect(user1).registerAgent("Agent", "/ep", "nlp", "caps", price);
      await expect(registry.connect(user2).rateAgent(1, 6, "bad")).to.be.revertedWith("Score 1-5");
    });

    it("returns all active agents", async function () {
      const price = parseEther("0.001");
      await registry.connect(user1).registerAgent("Agent1", "/ep1", "nlp", "caps", price);
      await registry.connect(user2).registerAgent("Agent2", "/ep2", "code", "caps", price);

      const all = await registry.getAllActiveAgents();
      expect(all.length).to.equal(2);
    });

    it("filters active agents by category", async function () {
      const price = parseEther("0.001");
      await registry.connect(user1).registerAgent("NLPAgent", "/ep1", "nlp", "caps", price);
      await registry.connect(user2).registerAgent("CodeAgent", "/ep2", "code", "caps", price);

      const nlpAgents = await registry.getActiveAgentsByCategory("nlp");
      expect(nlpAgents.length).to.equal(1);
      expect(nlpAgents[0].name).to.equal("NLPAgent");
    });
  });

  // ─── AgentVault ──────────────────────────────────────────────────
  describe("AgentVault", function () {
    let vaultId: bigint;

    beforeEach(async function () {
      const dailyLimit = parseEther("10");
      const tx = await vault.connect(owner).createVault(user1.address, dailyLimit);
      await tx.wait();
      vaultId = BigInt(1);
    });

    it("creates a vault with correct owner", async function () {
      const v = await vault.vaults(vaultId);
      expect(v.owner).to.equal(user1.address);
    });

    it("accepts deposits and updates balance", async function () {
      const amount = parseEther("1");
      await vault.connect(user2).deposit(vaultId, { value: amount });
      expect(await vault.getBalance(vaultId)).to.equal(amount);
    });

    it("allows owner to withdraw within daily limit", async function () {
      const deposit = parseEther("2");
      await vault.connect(user2).deposit(vaultId, { value: deposit });

      const withdraw = parseEther("1");
      await vault.connect(user1).withdraw(vaultId, withdraw, user1.address);
      expect(await vault.getBalance(vaultId)).to.equal(deposit - withdraw);
    });

    it("rejects withdrawal exceeding daily limit", async function () {
      const deposit = parseEther("20");
      await vault.connect(user2).deposit(vaultId, { value: deposit });

      const over = parseEther("11"); // daily limit is 10
      await expect(
        vault.connect(user1).withdraw(vaultId, over, user1.address)
      ).to.be.revertedWith("Daily limit exceeded");
    });

    it("authority can lock and unlock vault", async function () {
      await vault.connect(owner).lockVault(vaultId);
      const deposit = parseEther("1");
      await vault.connect(user2).deposit(vaultId, { value: deposit });

      await expect(
        vault.connect(user1).withdraw(vaultId, deposit, user1.address)
      ).to.be.revertedWith("Vault locked");

      await vault.connect(owner).unlockVault(vaultId);
      await vault.connect(user1).withdraw(vaultId, deposit, user1.address);
    });

    it("allows transfers between vaults", async function () {
      const dailyLimit = parseEther("10");
      await vault.connect(owner).createVault(user2.address, dailyLimit);

      const amount = parseEther("2");
      await vault.connect(user2).deposit(1, { value: amount });
      await vault.connect(user1).transferBetweenVaults(1, 2, parseEther("1"));

      expect(await vault.getBalance(1)).to.equal(parseEther("1"));
      expect(await vault.getBalance(2)).to.equal(parseEther("1"));
    });
  });

  // ─── TaskManager ─────────────────────────────────────────────────
  describe("TaskManager", function () {
    const AGENT_PRICE = parseEther("0.001");

    beforeEach(async function () {
      // Register an agent owned by user1
      await registry.connect(user1).registerAgent(
        "ResearchAgent", "/api/research", "research", "web-search", AGENT_PRICE
      );
      // Set registry authority to taskManager contract address for TaskManager tests
      await registry.connect(owner).setAuthority(await taskManager.getAddress());
    });

    it("creates a task with correct fee payment", async function () {
      await expect(
        taskManager.connect(user2).createTask(1, "Research AI trends", "{}", 0, 0, {
          value: AGENT_PRICE,
        })
      )
        .to.emit(taskManager, "TaskCreated")
        .withArgs(1, user2.address, 1, "Research AI trends", AGENT_PRICE);

      const task = await taskManager.getTask(1);
      expect(task.description).to.equal("Research AI trends");
      expect(task.fee).to.equal(AGENT_PRICE);
    });

    it("rejects task creation with insufficient fee", async function () {
      await expect(
        taskManager.connect(user2).createTask(1, "Task", "{}", 0, 0, {
          value: parseEther("0.0001"),
        })
      ).to.be.revertedWith("Insufficient fee");
    });

    it("rejects self-hire", async function () {
      await expect(
        taskManager.connect(user1).createTask(1, "Task", "{}", 0, 0, {
          value: AGENT_PRICE,
        })
      ).to.be.revertedWith("Cannot hire yourself");
    });

    it("authority can complete a task", async function () {
      await taskManager.connect(user2).createTask(1, "Task", "{}", 0, 0, {
        value: AGENT_PRICE,
      });

      await expect(taskManager.connect(owner).completeTask(1, "Done!"))
        .to.emit(taskManager, "TaskCompleted")
        .withArgs(1, "Done!");

      const task = await taskManager.getTask(1);
      expect(task.result).to.equal("Done!");
    });

    it("authority can fail a task", async function () {
      await taskManager.connect(user2).createTask(1, "Task", "{}", 0, 0, {
        value: AGENT_PRICE,
      });

      await expect(taskManager.connect(owner).failTask(1, "Timeout"))
        .to.emit(taskManager, "TaskFailed")
        .withArgs(1, "Timeout");
    });

    it("requester can dispute a task", async function () {
      await taskManager.connect(user2).createTask(1, "Task", "{}", 0, 0, {
        value: AGENT_PRICE,
      });

      await expect(taskManager.connect(user2).disputeTask(1))
        .to.emit(taskManager, "TaskDisputed")
        .withArgs(1);
    });

    it("non-authority cannot complete a task", async function () {
      await taskManager.connect(user2).createTask(1, "Task", "{}", 0, 0, {
        value: AGENT_PRICE,
      });

      await expect(
        taskManager.connect(user1).completeTask(1, "Hack!")
      ).to.be.revertedWith("Not authority");
    });

    it("returns recent tasks in reverse order", async function () {
      await taskManager.connect(user2).createTask(1, "Task A", "{}", 0, 0, { value: AGENT_PRICE });
      await taskManager.connect(user2).createTask(1, "Task B", "{}", 0, 0, { value: AGENT_PRICE });

      const recent = await taskManager.getRecentTasks(2);
      expect(recent[0].description).to.equal("Task B");
    });

    it("tracks task count correctly", async function () {
      await taskManager.connect(user2).createTask(1, "T1", "{}", 0, 0, { value: AGENT_PRICE });
      await taskManager.connect(user2).createTask(1, "T2", "{}", 0, 0, { value: AGENT_PRICE });
      expect(await taskManager.getTaskCount()).to.equal(2);
    });
  });
});
