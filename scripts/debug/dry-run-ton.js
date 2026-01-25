/* eslint-disable */
require('dotenv').config({ path: '.env' });
const {
    TonClient,
    WalletContractV5R1,
    WalletContractV4,
    WalletContractV3R2,
    WalletContractV3R1,
    beginCell,
    Cell,
    Address,
    toNano,
    contractAddress
} = require('@ton/ton');
const { mnemonicToPrivateKey } = require('@ton/crypto');
const fs = require('fs');
const path = require('path');

const DEPLOY_AMOUNT = toNano('0.25');
const GAS_BUFFER = toNano('0.05');
const WORKCHAIN = 0;

async function dryRun() {
    console.log("🔍 NΞØ Factory TON - DRY RUN\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    try {
        // 1. Network Setup
        const isTestnet = process.env.TON_NETWORK === 'testnet';
        
        // Priority: Chainstack > Custom URL > Default
        let endpoint;
        let provider = 'TonCenter';
        
        if (process.env.CHAINSTACK_API_KEY) {
            const chainstackUrl = process.env.TON_RPC_URL || (isTestnet 
                ? `https://ton-testnet.core.chainstack.com/${process.env.CHAINSTACK_API_KEY}/api/v2`
                : `https://ton-mainnet.core.chainstack.com/${process.env.CHAINSTACK_API_KEY}/api/v2`);
            endpoint = chainstackUrl;
            provider = 'Chainstack ⚡';
        } else if (process.env.TON_API_URL) {
            endpoint = process.env.TON_API_URL;
            provider = 'Custom';
        } else {
            const apiKey = process.env.TON_API_KEY || '';
            endpoint = isTestnet
                ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
                : apiKey
                    ? `https://toncenter.com/api/v2/jsonRPC?api_key=${apiKey}`
                    : 'https://toncenter.com/api/v2/jsonRPC';
        }

        console.log(`📡 Network: ${isTestnet ? '🧪 TESTNET' : '🔴 MAINNET'} via ${provider}`);
        console.log(`🔗 Endpoint: ${endpoint.split('?')[0].split('/').slice(0, -1).join('/')}/...\n`);

        const client = new TonClient({ endpoint });

        // 2. Wallet Detection
        const seed = process.env.TON_DEPLOYER_MNEMONIC;
        if (!seed || seed.trim().split(/\s+/).length < 12) {
            throw new Error("❌ Invalid TON_DEPLOYER_MNEMONIC (need 12 or 24 words)");
        }

        const mnemonics = seed.trim().split(/\s+/);
        console.log(`🔑 Mnemonic: ${mnemonics.length} palavras detectadas\n`);

        const keyPair = await mnemonicToPrivateKey(mnemonics);
        const publicKey = keyPair.publicKey;

        // Try all wallet versions
        const walletVersions = [
            { name: 'v5r1', contract: WalletContractV5R1.create({ workchain: WORKCHAIN, publicKey }) },
            { name: 'v4  ', contract: WalletContractV4.create({ workchain: WORKCHAIN, publicKey }) },
            { name: 'v3r2', contract: WalletContractV3R2.create({ workchain: WORKCHAIN, publicKey }) },
            { name: 'v3r1', contract: WalletContractV3R1.create({ workchain: WORKCHAIN, publicKey }) }
        ];

        console.log("🔍 Detectando wallets...\n");
        
        let activeWallet = null;
        let maxBalance = 0n;
        let allWallets = [];

        for (const { name, contract } of walletVersions) {
            try {
                const balance = await client.getBalance(contract.address);
                const balanceTON = Number(balance) / 1e9;
                const isDeployed = await client.isContractDeployed(contract.address);
                
                const status = balance > 0n ? '✅' : isDeployed ? '⚠️' : '❌';
                console.log(`   ${status} ${name}: ${balanceTON.toFixed(4)} TON`);
                console.log(`      ${contract.address.toString()}`);
                console.log(`      ${isDeployed ? 'Deployed' : 'Not deployed'}\n`);

                allWallets.push({ name, address: contract.address.toString(), balance: balanceTON, isDeployed });

                if (balance > maxBalance) {
                    maxBalance = balance;
                    activeWallet = contract;
                }
            } catch (e) {
                console.log(`   ❌ ${name}: Error (${e.message})\n`);
            }
        }

        if (!activeWallet) {
            throw new Error("❌ No wallet found! Create a wallet first.");
        }

        const walletContract = client.open(activeWallet);
        
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("💼 ACTIVE WALLET");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`Address: ${activeWallet.address.toString()}`);
        console.log(`Balance: ${(Number(maxBalance) / 1e9).toFixed(4)} TON`);
        
        try {
            const seqno = await walletContract.getSeqno();
            console.log(`Seqno:   ${seqno}`);
        } catch (e) {
            console.log(`Seqno:   Unable to fetch (${e.message})`);
        }

        // 3. Balance Check
        const requiredBalance = DEPLOY_AMOUNT + GAS_BUFFER;
        const hasEnough = maxBalance >= requiredBalance;

        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("💰 BALANCE CHECK");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`Required: ${(Number(requiredBalance) / 1e9).toFixed(4)} TON`);
        console.log(`  Deploy: ${(Number(DEPLOY_AMOUNT) / 1e9).toFixed(4)} TON`);
        console.log(`  Buffer: ${(Number(GAS_BUFFER) / 1e9).toFixed(4)} TON`);
        console.log(`Available: ${(Number(maxBalance) / 1e9).toFixed(4)} TON`);
        console.log(`Status: ${hasEnough ? '✅ SUFFICIENT' : '❌ INSUFFICIENT'}`);

        // 4. Load Compiled Contracts
        const buildPath = path.join(__dirname, '../artifacts/ton');

        if (!fs.existsSync(buildPath)) {
            throw new Error(`❌ Build directory not found: ${buildPath}\nRun: node scripts/compile-ton.js`);
        }

        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📦 COMPILED CONTRACTS");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        const loadCell = (filename) => {
            const filePath = path.join(buildPath, filename);
            if (!fs.existsSync(filePath)) {
                throw new Error(`❌ Contract file not found: ${filename}`);
            }
            const stats = fs.statSync(filePath);
            console.log(`   ✅ ${filename} (${stats.size} bytes)`);
            return Cell.fromBoc(fs.readFileSync(filePath))[0];
        };

        const factoryCode = loadCell('NeoJettonFactory.cell');
        const minterCode = loadCell('NeoJettonMinter.cell');
        const walletCode = loadCell('NeoJettonWallet.cell');

        // 5. Treasury Setup
        const treasuryEnv = process.env.VITE_PROTOCOL_TREASURY_ADDRESS;
        if (!treasuryEnv) {
            throw new Error("❌ VITE_PROTOCOL_TREASURY_ADDRESS missing in .env");
        }

        const adminAddress = activeWallet.address;
        const treasuryAddress = Address.parse(treasuryEnv);

        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🔐 ADDRESSES");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`Admin:    ${adminAddress.toString()}`);
        console.log(`Treasury: ${treasuryAddress.toString()}`);

        // 6. Calculate Factory Address
        const dataCell = beginCell()
            .storeAddress(adminAddress)
            .storeRef(minterCode)
            .storeRef(walletCode)
            .storeAddress(treasuryAddress)
            .endCell();

        const stateInit = {
            code: factoryCode,
            data: dataCell
        };

        const factoryAddress = contractAddress(WORKCHAIN, stateInit);

        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🏭 FACTORY CONTRACT");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`Address: ${factoryAddress.toString()}`);

        const scanUrl = isTestnet
            ? `https://testnet.tonscan.org/address/${factoryAddress.toString()}`
            : `https://tonscan.org/address/${factoryAddress.toString()}`;
        console.log(`Explorer: ${scanUrl}`);

        // Check if already deployed
        console.log("\n🔍 Checking deployment status...");
        const isDeployed = await client.isContractDeployed(factoryAddress);
        
        if (isDeployed) {
            console.log("✅ Status: ALREADY DEPLOYED");
            
            try {
                const balance = await client.getBalance(factoryAddress);
                console.log(`💰 Contract Balance: ${(Number(balance) / 1e9).toFixed(4)} TON`);
            } catch (e) {
                console.log(`⚠️  Unable to fetch contract balance: ${e.message}`);
            }
        } else {
            console.log("❌ Status: NOT DEPLOYED");
        }

        // 7. Summary
        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📊 DEPLOYMENT READINESS");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        const checks = [
            { name: 'Wallet Found', status: !!activeWallet },
            { name: 'Sufficient Balance', status: hasEnough },
            { name: 'Contracts Compiled', status: true },
            { name: 'Treasury Configured', status: !!treasuryEnv },
            { name: 'Not Yet Deployed', status: !isDeployed }
        ];

        checks.forEach(({ name, status }) => {
            console.log(`${status ? '✅' : '❌'} ${name}`);
        });

        const canDeploy = checks.every(c => c.status);

        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        if (canDeploy) {
            console.log("✅ READY TO DEPLOY!");
            console.log("\nNext step:");
            console.log("  node scripts/deploy-ton-factory.js");
        } else if (isDeployed) {
            console.log("ℹ️  FACTORY ALREADY DEPLOYED");
            console.log("\nYou can create Jettons using this factory.");
        } else {
            console.log("⚠️  NOT READY TO DEPLOY");
            console.log("\nPlease fix the issues above before deploying.");
        }
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    } catch (error) {
        console.error("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ DRY RUN FAILED");
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error(error.message);
        
        if (error.stack && process.env.DEBUG) {
            console.error("\nStack trace:");
            console.error(error.stack);
        }
        
        process.exit(1);
    }
}

if (require.main === module) {
    dryRun().catch(error => {
        console.error("\n💥 Fatal error:");
        console.error(error);
        process.exit(1);
    });
}

module.exports = { dryRun };
