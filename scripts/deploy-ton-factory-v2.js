/* eslint-disable */
require('dotenv').config({ path: '.env' });
const {
    TonClient,
    WalletContractV5R1,
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

const DEPLOY_AMOUNT = toNano('0.25');
const GAS_BUFFER = toNano('0.05');
const WORKCHAIN = 0;

// Configure MULTIPLE ADMINS
// Option 1: Read from .env (recommended)
const ADMIN_ADDRESSES_FROM_ENV = process.env.FACTORY_ADMINS 
    ? process.env.FACTORY_ADMINS.split(',').map(a => a.trim()).filter(a => a.length > 0)
    : [];

// Option 2: Hardcode here (fallback)
const ADMIN_ADDRESSES_HARDCODED = [
    process.env.VITE_PROTOCOL_TREASURY_ADDRESS, // Admin 1 (deployer/treasury)
    // Add more admin addresses here:
    // "EQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    // "EQyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
];

// Use .env if configured, otherwise fallback to hardcoded
const ADMIN_ADDRESSES = ADMIN_ADDRESSES_FROM_ENV.length > 0 
    ? ADMIN_ADDRESSES_FROM_ENV 
    : ADMIN_ADDRESSES_HARDCODED;

async function main() {
    console.log("🚀 NΞØ Factory V2 Deployment\n");

    try {
        // 1. Setup Client
        const isTestnet = process.env.TON_NETWORK === 'testnet';
        
        // Prioridade: OnFinality (Professional) > TonCenter (Public Fallback)
        let endpoint;
        let provider;
        
        // Tentar OnFinality primeiro (melhor performance)
        const onfinalityEndpoint = isTestnet
            ? process.env.TON_RPC_URL_ONFINALITY_TESTNET
            : process.env.TON_RPC_URL_ONFINALITY_MAINNET;
        
        if (onfinalityEndpoint) {
            endpoint = onfinalityEndpoint;
            provider = `OnFinality ${isTestnet ? '(Testnet)' : '(Mainnet)'}`;
        } else {
            // Fallback para TonCenter
            endpoint = isTestnet
                ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
                : 'https://toncenter.com/api/v2/jsonRPC';
            provider = `TonCenter ${isTestnet ? '(Testnet)' : '(Mainnet)'} [Fallback]`;
        }
        
        console.log(`📡 Network: ${isTestnet ? 'Testnet' : 'Mainnet'}`);
        console.log(`🔌 Provider: ${provider}`);
        console.log(`🌐 Endpoint: ${endpoint.substring(0, 70)}...`);
        
        const client = new TonClient({ 
            endpoint,
            timeout: 30000
        });

        // 2. Setup Wallet
        let keyPair;
        
        // Try private key first, then mnemonic
        if (process.env.TON_DEPLOYER_PRIVATE_KEY) {
            const privateKeyHex = process.env.TON_DEPLOYER_PRIVATE_KEY.replace(/^0x/, '');
            const secretKey = Buffer.from(privateKeyHex, 'hex');
            
            if (secretKey.length !== 64) {
                throw new Error("Invalid TON_DEPLOYER_PRIVATE_KEY (must be 64 bytes hex)");
            }
            
            const publicKey = secretKey.slice(32);
            keyPair = { publicKey, secretKey };
            console.log("🔑 Using private key for deployment\n");
            
        } else {
            const seed = process.env.TON_DEPLOYER_MNEMONIC;
            if (!seed || seed.trim().split(/\s+/).length < 12) {
                throw new Error("Need TON_DEPLOYER_PRIVATE_KEY or TON_DEPLOYER_MNEMONIC");
            }

            const mnemonics = seed.trim().split(/\s+/);
            keyPair = await mnemonicToPrivateKey(mnemonics);
            console.log("🔑 Using mnemonic for deployment\n");
        }
        
        const publicKey = keyPair.publicKey;

        // Use v5r1 directly (já confirmado anteriormente)
        const activeWallet = WalletContractV5R1.create({ workchain: WORKCHAIN, publicKey });
        
        // Get balance once
        let maxBalance;
        try {
            maxBalance = await client.getBalance(activeWallet.address);
        } catch (e) {
            throw new Error(`Failed to get balance: ${e.message}`);
        }

        const requiredBalance = DEPLOY_AMOUNT + GAS_BUFFER;
        if (maxBalance < requiredBalance) {
            throw new Error(`Insufficient balance! Need ${Number(requiredBalance) / 1e9} TON`);
        }

        const walletContract = client.open(activeWallet);
        console.log(`✅ Deployer: ${activeWallet.address.toString()}`);
        console.log(`💰 Balance: ${(Number(maxBalance) / 1e9).toFixed(4)} TON\n`);

        // 3. Load Compiled Contracts
        const buildPath = path.join(__dirname, '../artifacts/ton');

        if (!fs.existsSync(buildPath)) {
            throw new Error(`Build directory not found: ${buildPath}\nRun compilation first!`);
        }

        console.log("📦 Loading contracts...");

        const loadCell = (filename) => {
            const filePath = path.join(buildPath, filename);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Contract file not found: ${filename}`);
            }
            return Cell.fromBoc(fs.readFileSync(filePath))[0];
        };

        const factoryCode = loadCell('NeoJettonFactoryV2.cell');
        const minterCode = loadCell('NeoJettonMinter.cell');
        const walletCode = loadCell('NeoJettonWallet.cell');

        console.log("   ✓ Factory (V2)");
        console.log("   ✓ Minter");
        console.log("   ✓ Wallet");

        // 4. Configure Admin (Simplified - single admin)
        console.log("\n🔐 Configuring admin...");
        
        const adminAddress = activeWallet.address; // Deployer is admin
        console.log(`   Admin: ${adminAddress.toString()}`);

        // 5. Treasury
        const treasuryEnv = process.env.VITE_PROTOCOL_TREASURY_ADDRESS;
        if (!treasuryEnv) {
            throw new Error("VITE_PROTOCOL_TREASURY_ADDRESS missing");
        }

        const treasuryAddress = Address.parse(treasuryEnv);
        console.log(`🏦 Treasury: ${treasuryAddress.toString()}`);

        // 6. Build Factory Data (Simplified)
        const dataCell = beginCell()
            .storeAddress(adminAddress)     // admin_address
            .storeRef(minterCode)           // jetton_minter_code
            .storeRef(walletCode)           // jetton_wallet_code
            .storeAddress(treasuryAddress)  // treasury_address
            .endCell();

        const stateInit = {
            code: factoryCode,
            data: dataCell
        };

        const factoryAddress = contractAddress(WORKCHAIN, stateInit);

        console.log(`\n🏭 Factory Address: ${factoryAddress.toString()}`);

        const scanUrl = isTestnet
            ? `https://testnet.tonscan.org/address/${factoryAddress.toString()}`
            : `https://tonscan.org/address/${factoryAddress.toString()}`;
        console.log(`🔗 ${scanUrl}`);

        // Check if deployed
        const isDeployed = await client.isContractDeployed(factoryAddress);

        if (isDeployed) {
            console.log("\n✅ Contract ALREADY deployed!");
            return;
        }

        // 7. Deploy
        console.log("\n⏳ Deploying...");

        const seqno = await walletContract.getSeqno();

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
                        .storeUint(0, 32)
                        .storeStringTail("NΞØ Factory V2 🚀")
                        .endCell()
                })
            ]
        });

        console.log("🚀 Transaction sent!");

        // Wait for confirmation
        let currentSeqno = seqno;
        let attempts = 0;
        const maxAttempts = 40;

        while (currentSeqno === seqno && attempts < maxAttempts) {
            process.stdout.write(`\r⏱  ${attempts * 2}s`);
            await new Promise(r => setTimeout(r, 2000));
            try {
                currentSeqno = await walletContract.getSeqno();
            } catch (e) {
                // Continue
            }
            attempts++;
        }

        console.log("\n");

        if (currentSeqno === seqno) {
            console.warn("⚠️  Timeout! Check manually:");
            console.warn(scanUrl);
            process.exit(1);
        }

        console.log("✅ Transaction confirmed!");

        await new Promise(r => setTimeout(r, 5000));

        const deployed = await client.isContractDeployed(factoryAddress);

        if (deployed) {
            console.log("\n✨ DEPLOYMENT SUCCESSFUL! ✨\n");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log(`Factory:  ${factoryAddress.toString()}`);
            console.log(`Admin:    ${adminAddress.toString()}`);
            console.log(`Treasury: ${treasuryAddress.toString()}`);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log(`\n🔗 View: ${scanUrl}\n`);
        } else {
            console.warn("\n⚠️  Not showing as deployed yet. Check in a few minutes:");
            console.warn(scanUrl);
        }

    } catch (error) {
        console.error("\n❌ Deployment failed:");
        console.error(error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
