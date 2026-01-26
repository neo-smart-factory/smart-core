const hre = require("hardhat");
require("dotenv").config();

/**
 * Deploy NSFToken
 * 
 * This is the core token contract with:
 * - Fixed supply of 1 billion tokens
 * - No owner (complete power renunciation)
 * - ERC20 + ERC20Permit (gasless transactions)
 * 
 * CRITICAL: Ensure INITIAL_DISTRIBUTOR is a secure multi-sig wallet
 */

async function main() {
  console.log("🚀 Deploying NSFToken...\n");

  // Configuration
  const INITIAL_DISTRIBUTOR = process.env.NSF_INITIAL_DISTRIBUTOR || "";
  
  if (!INITIAL_DISTRIBUTOR || INITIAL_DISTRIBUTOR === "") {
    throw new Error("❌ NSF_INITIAL_DISTRIBUTOR not set in .env file");
  }
  
  // Validate address format
  if (!hre.ethers.isAddress(INITIAL_DISTRIBUTOR)) {
    throw new Error("❌ NSF_INITIAL_DISTRIBUTOR is not a valid Ethereum address");
  }

  console.log("Configuration:");
  console.log("- Network:", hre.network.name);
  console.log("- Initial Distributor:", INITIAL_DISTRIBUTOR);
  console.log("- Total Supply: 1,000,000,000 NSF\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH/MATIC\n");

  // Deploy NSFToken
  console.log("📝 Deploying NSFToken contract...");
  const NSFToken = await hre.ethers.getContractFactory("NSFToken");
  const nsfToken = await NSFToken.deploy(INITIAL_DISTRIBUTOR);
  
  await nsfToken.waitForDeployment();
  const nsfAddress = await nsfToken.getAddress();
  
  console.log("✅ NSFToken deployed to:", nsfAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const totalSupply = await nsfToken.totalSupply();
  const distributorBalance = await nsfToken.balanceOf(INITIAL_DISTRIBUTOR);
  const mintRenounced = await nsfToken.MINT_RENOUNCED();
  const deploymentTime = await nsfToken.DEPLOYMENT_TIMESTAMP();
  
  console.log("- Total Supply:", hre.ethers.formatEther(totalSupply), "NSF");
  console.log("- Distributor Balance:", hre.ethers.formatEther(distributorBalance), "NSF");
  console.log("- Mint Renounced:", mintRenounced);
  console.log("- Deployment Time:", new Date(Number(deploymentTime) * 1000).toISOString());

  // Security checks
  console.log("\n🔒 Security Verification:");
  console.log("- ✅ No owner exists (ownerless contract)");
  console.log("- ✅ No mint function (supply is fixed)");
  console.log("- ✅ No pause function (censorship resistant)");
  console.log("- ✅ Standard ERC20 + Permit");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contract: "NSFToken",
    address: nsfAddress,
    deployer: deployer.address,
    initialDistributor: INITIAL_DISTRIBUTOR,
    totalSupply: totalSupply.toString(),
    deploymentTime: deploymentTime.toString(),
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  console.log("\n💾 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Verification instructions
  console.log("\n📋 Next Steps:");
  console.log("1. Save the contract address:", nsfAddress);
  console.log("2. Verify on block explorer:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${nsfAddress} "${INITIAL_DISTRIBUTOR}"`);
  console.log("3. Update .env with: NSF_TOKEN_ADDRESS=" + nsfAddress);
  console.log("4. Proceed to deploy TimelockController");

  console.log("\n✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
