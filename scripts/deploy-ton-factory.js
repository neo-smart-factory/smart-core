/* eslint-disable */
require('dotenv').config({ path: '.env' });
const {
    TonClient,
    WalletContractV4,
    WalletContractV3R2,
    WalletContractV3R1,
    internal,
    beginCell,
    Cell,
    Address,
    toNano,
    contractAddress
} = require('@ton/ton');
const { mnemonicToPrivateKey } = require('@ton/crypto');
const fs = require('fs');
const path = require('path');

// Constants
const DEPLOY_AMOUNT = toNano('0.25'); // 0.25 TON for storage + initialization
const GAS_BUFFER = toNano('0.05');
const WORKCHAIN = 0;

async function main() {
    console.log("🚀 Starting NΞØ Factory Deployment to TON...\n");

    try {
        // 1. Setup Client
        const isTestnet = process.env.TON_NETWORK === 'testnet';
        const apiKey = process.env.TON_API_KEY || '';

        const endpoint = isTestnet
            ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
            : apiKey
                ? `https://toncenter.com/api/v2/jsonRPC?api_key=${apiKey}`
                : 'https://toncenter.com/api/v2/jsonRPC';

        console.log(`📡 Network: ${isTestnet ? 'Testnet' : 'Mainnet'}`);
        const client = new TonClient({ endpoint });

        // 2. Setup Wallet with Version Detection
        const seed = process.env.TON_DEPLOYER_MNEMONIC;
        if (!seed || seed.trim().split(/\s+/).length < 12) {
            throw new Error("Invalid TON_DEPLOYER_MNEMONIC (need 12 or 24 words)");
        }

        const mnemonics = seed.trim().split(/\s+/);
        const keyPair = await mnemonicToPrivateKey(mnemonics);
        const publicKey = keyPair.publicKey;

        // Try multiple wallet versions
        const walletVersions = [
            { name: 'v4', contract: WalletContractV4.create({ workchain: WORKCHAIN, publicKey }) },
            { name: 'v3r2', contract: WalletContractV3R2.create({ workchain: WORKCHAIN, publicKey }) },
            { name: 'v3r1', contract: WalletContractV3R1.create({ workchain: WORKCHAIN, publicKey }) }
        ];

        console.log("🔍 Detecting wallet version...");
        let activeWallet = null;
        let maxBalance = 0n;

        for (const { name, contract } of walletVersions) {
            try {
                const balance = await client.getBalance(contract.address);
                const balanceTON = Number(balance) / 1e9;
                console.log(`   ${name}: ${contract.address.toString()} - ${balanceTON.toFixed(4)} TON`);

                if (balance > maxBalance) {
                    maxBalance = balance;
                    activeWallet = contract;
                }
            } catch (e) {
                console.log(`   ${name}: Unable to check (${e.message})`);
            }
        }

        if (!activeWallet) {
            throw new Error("No wallet found! Please create a wallet first.");
        }

        const requiredBalance = DEPLOY_AMOUNT + GAS_BUFFER;
        if (maxBalance < requiredBalance) {
            throw new Error(
                `Insufficient balance! Need ${Number(requiredBalance) / 1e9} TON, ` +
                `have ${Number(maxBalance) / 1e9} TON`
            );
        }

        const walletContract = client.open(activeWallet);
        console.log(`\n✅ Active wallet: ${activeWallet.address.toString()}`);
        console.log(`💰 Balance: ${(Number(maxBalance) / 1e9).toFixed(4)} TON\n`);

        // 3. Load Compiled Contracts
        const buildPath = path.join(__dirname, '../artifacts/ton');

        if (!fs.existsSync(buildPath)) {
            throw new Error(`Build directory not found: ${buildPath}\nRun compilation first!`);
        }

        console.log("📦 Loading compiled contracts...");

        const loadCell = (filename) => {
            const filePath = path.join(buildPath, filename);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Contract file not found: ${filename}`);
            }
            return Cell.fromBoc(fs.readFileSync(filePath))[0];
        };

        const factoryCode = loadCell('NeoJettonFactory.cell');
        const minterCode = loadCell('NeoJettonMinter.cell');
        const walletCode = loadCell('NeoJettonWallet.cell');

        console.log("   ✓ Factory code");
        console.log("   ✓ Minter code");
        console.log("   ✓ Wallet code");

        // 4. Prepare Initial Data
        const treasuryEnv = process.env.VITE_PROTOCOL_TREASURY_ADDRESS;
        if (!treasuryEnv) {
            throw new Error("VITE_PROTOCOL_TREASURY_ADDRESS missing in .env");
        }

        const adminAddress = activeWallet.address;
        const treasuryAddress = Address.parse(treasuryEnv);

        console.log(`\n🔐 Admin: ${adminAddress.toString()}`);
        console.log(`🏦 Treasury: ${treasuryAddress.toString()}`);

        // Build storage cell according to contract spec
        const dataCell = beginCell()
            .storeAddress(adminAddress)       // admin_address
            .storeRef(minterCode)              // jetton_minter_code
            .storeRef(walletCode)              // jetton_wallet_code
            .storeAddress(treasuryAddress)     // treasury_address
            .endCell();

        // 5. Calculate Factory Address (CORRECT METHOD)
        const stateInit = {
            code: factoryCode,
            data: dataCell
        };

        // Use official TON SDK method - this is the CORRECT way
        const factoryAddress = contractAddress(WORKCHAIN, stateInit);

        console.log(`\n🏭 Factory Address: ${factoryAddress.toString()}`);

        const scanUrl = isTestnet
            ? `https://testnet.tonscan.org/address/${factoryAddress.toString()}`
            : `https://tonscan.org/address/${factoryAddress.toString()}`;
        console.log(`🔗 ${scanUrl}`);

        // Check if already deployed
        const isDeployed = await client.isContractDeployed(factoryAddress);

        if (isDeployed) {
            console.log("\n✅ Contract is ALREADY deployed!");
            saveDeploymentInfo(factoryAddress.toString(), adminAddress.toString(),
                treasuryAddress.toString(), isTestnet, buildPath);
            return;
        }

        // 6. Deploy Transaction
        console.log("\n⏳ Sending deployment transaction...");

        const seqno = await walletContract.getSeqno();
        console.log(`📝 Current seqno: ${seqno}`);

        await walletContract.sendTransfer({
            seqno,
            secretKey: keyPair.secretKey,
            messages: [
                internal({
                    to: factoryAddress,
                    value: DEPLOY_AMOUNT,
                    init: stateInit,
                    bounce: false,
                    body: beginCell()
                        .storeUint(0, 32) // op = 0 (text comment)
                        .storeStringTail("NΞØ Factory V1 🚀")
                        .endCell()
                })
            ]
        });

        console.log("🚀 Transaction sent! Waiting for confirmation...");

        // Wait for seqno increment (transaction confirmation)
        let currentSeqno = seqno;
        let attempts = 0;
        const maxAttempts = 40; // 80 seconds max

        while (currentSeqno === seqno && attempts < maxAttempts) {
            process.stdout.write(`\r⏱  Waiting... ${attempts * 2}s`);
            await new Promise(r => setTimeout(r, 2000));
            try {
                currentSeqno = await walletContract.getSeqno();
            } catch (e) {
                console.warn(`\nWarning: Failed to check seqno (${e.message})`);
            }
            attempts++;
        }

        console.log("\n");

        if (currentSeqno === seqno) {
            console.warn("⚠️  Transaction timeout!");
            console.warn("Check manually on Tonscan:");
            console.warn(scanUrl);
            process.exit(1);
        }

        console.log("✅ Transaction confirmed in blockchain!");

        // Wait for state propagation
        console.log("⏳ Verifying contract deployment...");
        await new Promise(r => setTimeout(r, 5000));

        const deployed = await client.isContractDeployed(factoryAddress);

        if (deployed) {
            console.log("\n✨ DEPLOYMENT SUCCESSFUL! ✨\n");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log(`Factory:  ${factoryAddress.toString()}`);
            console.log(`Admin:    ${adminAddress.toString()}`);
            console.log(`Treasury: ${treasuryAddress.toString()}`);
            console.log(`Cost:     ${Number(DEPLOY_AMOUNT) / 1e9} TON`);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log(`\n🔗 View: ${scanUrl}\n`);

            saveDeploymentInfo(
                factoryAddress.toString(),
                adminAddress.toString(),
                treasuryAddress.toString(),
                isTestnet,
                buildPath
            );

        } else {
            console.warn("\n⚠️  Contract not showing as deployed yet.");
            console.warn("This is normal - state propagation can take time.");
            console.warn("Check status in a few minutes:");
            console.warn(scanUrl);
        }

    } catch (error) {
        console.error("\n❌ Deployment failed:");
        console.error(error.message);

        if (error.stack && process.env.DEBUG) {
            console.error("\nStack trace:");
            console.error(error.stack);
        }

        process.exit(1);
    }
}

function saveDeploymentInfo(factoryAddr, adminAddr, treasuryAddr, isTestnet, buildPath) {
    const info = {
        network: isTestnet ? 'testnet' : 'mainnet',
        factoryAddress: factoryAddr,
        adminAddress: adminAddr,
        treasuryAddress: treasuryAddr,
        deployedAt: new Date().toISOString(),
        deployer: "NΞØ Smart Token Protocol",
        version: "1.0.0"
    };

    const outputPath = path.join(buildPath, 'deployment.json');
    fs.writeFileSync(outputPath, JSON.stringify(info, null, 2));

    console.log(`💾 Deployment info saved: ${outputPath}`);
}

// Execute
if (require.main === module) {
    main().catch(error => {
        console.error("\n💥 Fatal error:");
        console.error(error);
        process.exit(1);
    });
}

module.exports = { main };