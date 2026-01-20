/**
 * NΞØ SMART FACTORY — Deploy NeoTokenV2
 * Deploy do token com suporte a Multichain & Account Abstraction
 */

const hre = require("hardhat");

async function main() {
    console.log("🪙 Deploying NeoTokenV2...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

    // ========================================
    // CONFIGURAÇÃO DO TOKEN
    // ========================================

    const TOKEN_CONFIG = {
        name: process.env.TOKEN_NAME || "Neo Protocol",
        symbol: process.env.TOKEN_SYMBOL || "NEO",
        mintPrice: process.env.MINT_PRICE || hre.ethers.parseEther("0.003"),      // 0.003 ETH
        mintAmount: process.env.MINT_AMOUNT || hre.ethers.parseEther("1000"),   // 1000 tokens
        initialOwner: process.env.INITIAL_OWNER || "0x470a8c640fFC2C16aEB6bE803a948420e2aE8456" // NODE NEØ
    };

    console.log("\n📋 Token Configuration:");
    console.log("  Name:", TOKEN_CONFIG.name);
    console.log("  Symbol:", TOKEN_CONFIG.symbol);
    console.log("  Mint Price:", hre.ethers.formatEther(TOKEN_CONFIG.mintPrice), "ETH");
    console.log("  Mint Amount:", hre.ethers.formatEther(TOKEN_CONFIG.mintAmount), "tokens");
    console.log("  Initial Owner:", TOKEN_CONFIG.initialOwner);
    console.log("  Max Supply: 1,000,000,000 tokens (hardcoded)");

    // Confirmação
    console.log("\n⚠️  Review the configuration above before proceeding...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ========================================
    // DEPLOY
    // ========================================

    console.log("\n📦 Deploying NeoTokenV2...");
    const NeoTokenV2 = await hre.ethers.getContractFactory("NeoTokenV2");
    const token = await NeoTokenV2.deploy(
        TOKEN_CONFIG.name,
        TOKEN_CONFIG.symbol,
        TOKEN_CONFIG.mintPrice,
        TOKEN_CONFIG.mintAmount,
        TOKEN_CONFIG.initialOwner
    );

    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    console.log("✅ NeoTokenV2 deployed to:", tokenAddress);

    // ========================================
    // VERIFICAÇÃO PÓS-DEPLOY
    // ========================================

    console.log("\n⏳ Waiting for network propagation (5 seconds)...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("\n🔍 Verifying deployment...");

    const owner = await token.owner();
    const maxSupply = await token.MAX_SUPPLY();
    const mintPrice = await token.MINT_PRICE();
    const mintAmount = await token.MINT_AMOUNT();
    const publicMintEnabled = await token.publicMintEnabled();

    console.log("  Owner:", owner);
    console.log("  Max Supply:", hre.ethers.formatEther(maxSupply), "tokens");
    console.log("  Mint Price:", hre.ethers.formatEther(mintPrice), "ETH");
    console.log("  Mint Amount:", hre.ethers.formatEther(mintAmount), "tokens");
    console.log("  Public Mint:", publicMintEnabled ? "ENABLED ✅" : "DISABLED ❌");

    // ========================================
    // SALVAR INFORMAÇÕES
    // ========================================

    const deployInfo = {
        network: hre.network.name,
        chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
        tokenAddress: tokenAddress,
        tokenName: TOKEN_CONFIG.name,
        tokenSymbol: TOKEN_CONFIG.symbol,
        owner: owner,
        deployer: deployer.address,
        mintPrice: TOKEN_CONFIG.mintPrice.toString(),
        mintAmount: TOKEN_CONFIG.mintAmount.toString(),
        maxSupply: maxSupply.toString(),
        publicMintEnabled: publicMintEnabled,
        deployedAt: new Date().toISOString(),
        blockNumber: await hre.ethers.provider.getBlockNumber(),
        txHash: token.deploymentTransaction().hash
    };

    const fs = require('fs');
    const path = require('path');
    const deployDir = path.join(__dirname, '../deployments');

    if (!fs.existsSync(deployDir)) {
        fs.mkdirSync(deployDir, { recursive: true });
    }

    const deployFile = path.join(deployDir, `neotokenv2-${hre.network.name}.json`);
    fs.writeFileSync(deployFile, JSON.stringify(deployInfo, null, 2));

    console.log("\n📄 Deploy info saved to:", deployFile);

    // ========================================
    // INSTRUÇÕES PÓS-DEPLOY
    // ========================================

    console.log("\n📋 Next Steps:");
    console.log("\n1. Verify contract on explorer:");
    console.log(`   npx hardhat verify --network ${hre.network.name} ${tokenAddress} \\`);
    console.log(`     "${TOKEN_CONFIG.name}" \\`);
    console.log(`     "${TOKEN_CONFIG.symbol}" \\`);
    console.log(`     "${TOKEN_CONFIG.mintPrice}" \\`);
    console.log(`     "${TOKEN_CONFIG.mintAmount}" \\`);
    console.log(`     "${TOKEN_CONFIG.initialOwner}"`);

    console.log("\n2. Configure bridge (when ready):");
    console.log(`   await token.setBridgeMinter("0xBridgeAddress")`);

    console.log("\n3. Test public mint:");
    console.log(`   await token.publicMint({ value: ethers.parseEther("0.003") })`);

    console.log("\n4. Disable public mint (if needed):");
    console.log(`   await token.setPublicMintStatus(false)`);

    console.log("\n5. Withdraw accumulated fees:");
    console.log(`   await token.withdraw()`);

    console.log("\n✅ Deployment complete!");
    console.log("\n🌐 Explorer URL:");

    if (hre.network.name === "polygon") {
        console.log(`   https://polygonscan.com/address/${tokenAddress}`);
    } else if (hre.network.name === "base") {
        console.log(`   https://basescan.org/address/${tokenAddress}`);
    } else if (hre.network.name === "amoy") {
        console.log(`   https://amoy.polygonscan.com/address/${tokenAddress}`);
    } else {
        console.log(`   Check your network's explorer`);
    }

    console.log("\n---");
    console.log("Project Lead: NODE NEØ");
    console.log("Web3: neoprotocol.eth");
    console.log("Expand until silence becomes structure.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
