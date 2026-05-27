import { ethers } from "hardhat";

async function main() {
  console.log("Deploying SomniaSwarm contracts to Somnia Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} STT\n`);

  // Deploy AgentRegistry
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`AgentRegistry deployed: ${registryAddress}`);

  // Deploy TaskManager
  const TaskManager = await ethers.getContractFactory("TaskManager");
  const taskManager = await TaskManager.deploy(registryAddress);
  await taskManager.waitForDeployment();
  const taskManagerAddress = await taskManager.getAddress();
  console.log(`TaskManager deployed:  ${taskManagerAddress}`);

  // Set TaskManager as AgentRegistry authority
  const setAuthTx = await registry.setAuthority(taskManagerAddress);
  await setAuthTx.wait();
  console.log("AgentRegistry authority set to TaskManager\n");

  // Deploy AgentVault
  const AgentVault = await ethers.getContractFactory("AgentVault");
  const vault = await AgentVault.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`AgentVault deployed:   ${vaultAddress}\n`);

  // Register initial agents
  const agents = [
    { name: "ResearchAgent", endpoint: "/api/agent/research", category: "research", capabilities: "web-search,data-collection", price: "1000000000000000000" },
    { name: "AnalysisAgent", endpoint: "/api/agent/analyze", category: "analysis", capabilities: "llm,text-analysis,sentiment", price: "500000000000000000" },
    { name: "DataOracleAgent", endpoint: "/api/agent/oracle", category: "oracle", capabilities: "json-api,price-feed,weather", price: "300000000000000000" },
    { name: "SummaryAgent", endpoint: "/api/agent/summarize", category: "nlp", capabilities: "summarization,text-generation", price: "200000000000000000" },
    { name: "CodeAgent", endpoint: "/api/agent/code", category: "code", capabilities: "code-generation,code-review", price: "1500000000000000000" },
    { name: "TranslationAgent", endpoint: "/api/agent/translate", category: "nlp", capabilities: "translation,multi-language", price: "400000000000000000" },
  ];

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    let signer;
    if (i === 0) {
      signer = deployer;
    } else {
      const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
      const fundTx = await deployer.sendTransaction({
        to: wallet.address,
        value: ethers.parseEther("0.5"), // 0.5 STT is plenty for gas and base fees
      });
      await fundTx.wait();
      signer = wallet;
    }

    const tx = await registry.connect(signer).registerAgent(
      agent.name,
      agent.endpoint,
      agent.category,
      agent.capabilities,
      agent.price
    );
    await tx.wait();
    console.log(`  ✓ ${agent.name} registered (${agent.category}) by ${signer.address}`);
  }

  console.log("\n=== Deployment Summary ===");
  console.log(`AgentRegistry: ${registryAddress}`);
  console.log(`TaskManager:   ${taskManagerAddress}`);
  console.log(`AgentVault:    ${vaultAddress}`);
  console.log(`Agents:        ${agents.length} registered`);
  console.log(`Network:       Somnia Testnet (chain ID: 50312)`);
  console.log(`Explorer:      https://shannon-explorer.somnia.network`);
}

main().catch(console.error);
