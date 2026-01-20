/**
 * NΞØ SMART FACTORY — Deploy Manual Bridge
 * Script para deploy do sistema de bridge
 */

const hre = require("hardhat");

async function main() {
    console.log("🌉 Deploying Manual Bridge System...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    // Configuração inicial
    const initialSigners = [
        process.env.BRIDGE_SIGNER_1 || deployer.address,
        process.env.BRIDGE_SIGNER_2 || deployer.address,
        process.env.BRIDGE_SIGNER_3 || deployer.address
    ];

    const requiredSignatures = 2; // Multi-sig 2/3

    console.log("\nConfigurações:");
    console.log("  Signers:", initialSigners.length);
    console.log("  Required Signatures:", requiredSignatures);
    console.log("  Signers:");
    initialSigners.forEach((signer, i) => {
        console.log(`    ${i + 1}. ${signer}`);
    });

    // Deploy ManualBridge
    console.log("\n📦 Deploying ManualBridge...");
    const ManualBridge = await hre.ethers.getContractFactory("ManualBridge");
    const bridge = await ManualBridge.deploy(initialSigners, requiredSignatures);

    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();

    console.log("✅ ManualBridge deployed to:", bridgeAddress);

    // Configurações pós-deploy
    console.log("\n⚙️  Configurando bridge...");

    // Define bridge fee (0.001 ETH/POL)
    const bridgeFee = hre.ethers.parseEther("0.001");
    await bridge.setBridgeFee(bridgeFee);
    console.log("  Bridge fee set to:", hre.ethers.formatEther(bridgeFee), "ETH/POL");

    // Adiciona token de exemplo (se fornecido)
    if (process.env.TOKEN_ADDRESS) {
        await bridge.addSupportedToken(process.env.TOKEN_ADDRESS);
        console.log("  Token added:", process.env.TOKEN_ADDRESS);
    }

    // Salva informações de deploy
    const deployInfo = {
        network: hre.network.name,
        chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
        bridgeAddress: bridgeAddress,
        deployer: deployer.address,
        signers: initialSigners,
        requiredSignatures: requiredSignatures,
        bridgeFee: bridgeFee.toString(),
        deployedAt: new Date().toISOString(),
        blockNumber: await hre.ethers.provider.getBlockNumber()
    };

    const fs = require('fs');
    const path = require('path');
    const deployDir = path.join(__dirname, '../deployments');

    if (!fs.existsSync(deployDir)) {
        fs.mkdirSync(deployDir, { recursive: true });
    }

    const deployFile = path.join(deployDir, `bridge-${hre.network.name}.json`);
    fs.writeFileSync(deployFile, JSON.stringify(deployInfo, null, 2));

    console.log("\n📄 Deploy info saved to:", deployFile);

    // Instruções pós-deploy
    console.log("\n📋 Next Steps:");
    console.log("1. Verify contract:");
    console.log(`   npx hardhat verify --network ${hre.network.name} ${bridgeAddress} "[${initialSigners.map(s => `"${s}"`).join(',')}]" ${requiredSignatures}`);
    console.log("\n2. Configure token:");
    console.log(`   await token.setBridgeMinter("${bridgeAddress}")`);
    console.log("\n3. Start monitoring:");
    console.log(`   cd scripts/bridge && node monitor.js`);
    console.log("\n4. Setup relay (cron):");
    console.log(`   */5 * * * * cd /path/to/scripts/bridge && node relay.js all`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
