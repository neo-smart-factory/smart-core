/**
 * NΞØ SMART FACTORY — Deploy NeoAttestationRegistry
 * Proof of Existence (PoE) registry — immutable on-chain event log
 *
 * First registration: FlowPay-Core visual identity approved 2026-02-21
 * Guardian: nsfactory.eth (0x470a8c640fFC2C16aEB6bE803a948420e2aE8456)
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// ─── Configuration ────────────────────────────────────────────────────────────

const NS_FACTORY_ETH = "0x470a8c640fFC2C16aEB6bE803a948420e2aE8456";

const CONFIG = {
  guardian: process.env.GUARDIAN_ADDRESS || NS_FACTORY_ETH,
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("📜 Deploying NeoAttestationRegistry...\n");

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("Deployer :", deployer.address);
  console.log("Balance  :", hre.ethers.formatEther(balance), "ETH");
  console.log("Network  :", hre.network.name);
  console.log("Guardian :", CONFIG.guardian);

  console.log("\n⚠️  Review config above. Deploying in 3 seconds...");
  await new Promise(r => setTimeout(r, 3000));

  // ─── Deploy ────────────────────────────────────────────────────────────────

  console.log("\n📦 Deploying...");
  const Factory = await hre.ethers.getContractFactory("NeoAttestationRegistry");
  const registry = await Factory.deploy(CONFIG.guardian);
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  console.log("✅ NeoAttestationRegistry deployed to:", registryAddress);

  // ─── Post-deploy verification ──────────────────────────────────────────────

  console.log("\n⏳ Waiting for network propagation (5 seconds)...");
  await new Promise(r => setTimeout(r, 5000));

  console.log("\n🔍 Verifying deployment...");
  const guardian = await registry.guardian();
  const module_ = await registry.MODULE();
  const version = await registry.VERSION();
  const protocol = await registry.PROTOCOL();

  console.log("  PROTOCOL :", protocol);
  console.log("  MODULE   :", module_);
  console.log("  VERSION  :", version);
  console.log("  guardian :", guardian);

  // ─── Save deployment info ──────────────────────────────────────────────────

  const network = await hre.ethers.provider.getNetwork();

  const deployInfo = {
    contract: "NeoAttestationRegistry",
    version: version,
    network: hre.network.name,
    chainId: network.chainId.toString(),
    address: registryAddress,
    guardian: guardian,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    txHash: registry.deploymentTransaction().hash,
  };

  const deployDir = path.join(__dirname, "../../deployments");
  if (!fs.existsSync(deployDir)) fs.mkdirSync(deployDir, { recursive: true });

  const deployFile = path.join(deployDir, `attestation-registry-${hre.network.name}.json`);
  fs.writeFileSync(deployFile, JSON.stringify(deployInfo, null, 2));
  console.log("\n📄 Deploy info saved to:", deployFile);

  // ─── Next steps ────────────────────────────────────────────────────────────

  console.log("\n📋 Next Steps:");
  console.log("\n1. Verify on explorer:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${registryAddress} "${CONFIG.guardian}"`);

  console.log("\n2. Add nsfactory.eth as attester (guardian must call):");
  console.log(`   await registry.addAttester("${NS_FACTORY_ETH}")`);

  console.log("\n3. Register FlowPay-Core PoE attestation:");
  console.log(`   poeHash = 0xc326ec80ec0b0f3f0b6884aea8233e2e0b7b523a29952790c210cb70df1756b8`);
  console.log(`   await registry.registerAttestation(poeHash, metadata)`);

  console.log("\n4. Update flowpay-core-genesis-metadata.json:");
  console.log(`   "PoE Registry": "${registryAddress}"`);

  console.log("\n5. Deploy NeoGenesisNFT:");
  console.log(`   npx hardhat run scripts/deploy/deploy-genesis-nft.js --network ${hre.network.name}`);

  console.log("\n🌐 Explorer:");
  if (hre.network.name === "base") {
    console.log(`   https://basescan.org/address/${registryAddress}`);
  } else if (hre.network.name === "baseSepolia") {
    console.log(`   https://sepolia.basescan.org/address/${registryAddress}`);
  }

  console.log("\n---");
  console.log("NEØ SMART FACTORY | NeoAttestationRegistry v1.0.0");
  console.log("nsfactory.eth — Expand until silence becomes structure.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });
