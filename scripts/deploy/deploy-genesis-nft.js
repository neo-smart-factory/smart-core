/**
 * NΞØ SMART FACTORY — Deploy NeoGenesisNFT
 * Soulbound 1/1 Genesis NFT (ERC-721 + ERC-5192)
 * Linked to NeoAttestationRegistry PoE
 *
 * Project:  FlowPay-Core
 * Event:    Visual identity approved — 2026-02-21
 * Recipient: nsfactory.eth (0x470a8c640fFC2C16aEB6bE803a948420e2aE8456)
 *
 * Run AFTER deploy-attestation-registry.js and after PoE is registered.
 */

const hre  = require("hardhat");
const fs   = require("fs");
const path = require("path");

// ─── Configuration ────────────────────────────────────────────────────────────

const NS_FACTORY_ETH = "0x470a8c640fFC2C16aEB6bE803a948420e2aE8456";

// Load registry address from previous deployment (or set via env)
function getRegistryAddress(network) {
  const envAddr = process.env.POE_REGISTRY_ADDRESS;
  if (envAddr) return envAddr;

  const deployFile = path.join(__dirname, `../../deployments/attestation-registry-${network}.json`);
  if (fs.existsSync(deployFile)) {
    const data = JSON.parse(fs.readFileSync(deployFile, "utf8"));
    return data.address;
  }
  throw new Error(
    `NeoAttestationRegistry address not found.\n` +
    `Set POE_REGISTRY_ADDRESS env var or run deploy-attestation-registry.js first.`
  );
}

const CONFIG = {
  projectName:   "FlowPay-Core",
  projectSymbol: "FLOWGEN",
  poeHash:       "0xc326ec80ec0b0f3f0b6884aea8233e2e0b7b523a29952790c210cb70df1756b8",
  // tokenURI: set via env or hardcoded after IPFS upload of metadata JSON
  tokenURI:      process.env.TOKEN_URI || "ipfs://REPLACE_WITH_METADATA_CID",
  initialOwner:  process.env.INITIAL_OWNER || NS_FACTORY_ETH,
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🎨 Deploying NeoGenesisNFT — FlowPay-Core\n");

  const [deployer] = await hre.ethers.getSigners();
  const balance    = await hre.ethers.provider.getBalance(deployer.address);
  const registry   = getRegistryAddress(hre.network.name);

  console.log("Deployer      :", deployer.address);
  console.log("Balance       :", hre.ethers.formatEther(balance), "ETH");
  console.log("Network       :", hre.network.name);
  console.log("Project       :", CONFIG.projectName, `(${CONFIG.projectSymbol})`);
  console.log("PoE Hash      :", CONFIG.poeHash);
  console.log("PoE Registry  :", registry);
  console.log("Token URI     :", CONFIG.tokenURI);
  console.log("Initial Owner :", CONFIG.initialOwner);

  if (CONFIG.tokenURI.includes("REPLACE_WITH")) {
    console.log("\n❌ ERROR: TOKEN_URI is still a placeholder.");
    console.log("   Set TOKEN_URI env var with the IPFS CID of the metadata JSON.");
    console.log("   Example: TOKEN_URI=ipfs://QmXXX... npx hardhat run ...");
    process.exit(1);
  }

  console.log("\n⚠️  Review config above. Deploying in 3 seconds...");
  await new Promise(r => setTimeout(r, 3000));

  // ─── Deploy ────────────────────────────────────────────────────────────────

  console.log("\n📦 Deploying NeoGenesisNFT...");
  const Factory = await hre.ethers.getContractFactory("NeoGenesisNFT");
  const nft     = await Factory.deploy(
    CONFIG.projectName,
    CONFIG.projectSymbol,
    CONFIG.poeHash,
    registry,
    CONFIG.tokenURI,
    CONFIG.initialOwner
  );
  await nft.waitForDeployment();

  const nftAddress = await nft.getAddress();
  console.log("✅ NeoGenesisNFT deployed to:", nftAddress);

  // ─── Post-deploy verification ──────────────────────────────────────────────

  console.log("\n⏳ Waiting for network propagation (5 seconds)...");
  await new Promise(r => setTimeout(r, 5000));

  console.log("\n🔍 Verifying deployment...");
  const owner_      = await nft.owner();
  const projectName = await nft.projectName();
  const poeHash_    = await nft.poeHash();
  const poeReg_     = await nft.poeRegistry();
  const minted_     = await nft.minted();
  const supply_     = await nft.totalSupply();
  const module_     = await nft.MODULE();
  const version_    = await nft.VERSION();

  console.log("  MODULE      :", module_);
  console.log("  VERSION     :", version_);
  console.log("  projectName :", projectName);
  console.log("  poeHash     :", poeHash_);
  console.log("  poeRegistry :", poeReg_);
  console.log("  owner       :", owner_);
  console.log("  minted      :", minted_);
  console.log("  totalSupply :", supply_.toString());

  // ─── Save deployment info ──────────────────────────────────────────────────

  const network = await hre.ethers.provider.getNetwork();

  const deployInfo = {
    contract:     "NeoGenesisNFT",
    version:      version_,
    project:      CONFIG.projectName,
    symbol:       CONFIG.projectSymbol,
    network:      hre.network.name,
    chainId:      network.chainId.toString(),
    address:      nftAddress,
    poeHash:      CONFIG.poeHash,
    poeRegistry:  registry,
    tokenURI:     CONFIG.tokenURI,
    owner:        owner_,
    deployer:     deployer.address,
    minted:       minted_,
    deployedAt:   new Date().toISOString(),
    blockNumber:  await hre.ethers.provider.getBlockNumber(),
    txHash:       nft.deploymentTransaction().hash,
  };

  const deployDir  = path.join(__dirname, "../../deployments");
  if (!fs.existsSync(deployDir)) fs.mkdirSync(deployDir, { recursive: true });

  const deployFile = path.join(deployDir, `genesis-nft-flowpay-core-${hre.network.name}.json`);
  fs.writeFileSync(deployFile, JSON.stringify(deployInfo, null, 2));
  console.log("\n📄 Deploy info saved to:", deployFile);

  // ─── Next steps ────────────────────────────────────────────────────────────

  console.log("\n📋 Next Steps:");
  console.log("\n1. Verify on explorer:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${nftAddress} \\`);
  console.log(`     "${CONFIG.projectName}" "${CONFIG.projectSymbol}" \\`);
  console.log(`     "${CONFIG.poeHash}" "${registry}" \\`);
  console.log(`     "${CONFIG.tokenURI}" "${CONFIG.initialOwner}"`);

  console.log("\n2. Mint the Genesis NFT (owner must call):");
  console.log(`   npx hardhat run scripts/deploy/mint-genesis-nft.js --network ${hre.network.name}`);
  console.log(`   (ensure PoE is registered in NeoAttestationRegistry first)`);

  console.log("\n🌐 Explorer:");
  if (hre.network.name === "base") {
    console.log(`   https://basescan.org/address/${nftAddress}`);
  } else if (hre.network.name === "baseSepolia") {
    console.log(`   https://sepolia.basescan.org/address/${nftAddress}`);
  }

  console.log("\n---");
  console.log("NEØ SMART FACTORY | NeoGenesisNFT v1.0.0");
  console.log("nsfactory.eth — Expand until silence becomes structure.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });
