/* eslint-disable */
require('dotenv').config({ path: '.env' });
const {
    TonClient,
    WalletContractV5R1,
    internal,
    beginCell,
    Cell,
    Address,
    toNano
} = require('@ton/ton');
const { mnemonicToPrivateKey } = require('@ton/crypto');

// $NSF Token Configuration
const TOKEN_CONFIG = {
    name: "Neo Smart Factory",
    symbol: "NSF",
    description: "Official governance and utility token of NEO Protocol - Multichain token factory",
    decimals: 9,
    image: "https://raw.githubusercontent.com/neo-protocol/assets/main/nsf-logo.png", // Placeholder - Update with correct URL
    
    // V2 Features
    maxSupply: toNano('1000000000'), // 1 bilhão de tokens
    mintPrice: toNano('0.1'),         // 0.1 TON por mint público
    mintAmount: toNano('1000')        // 1000 tokens por mint
};

const DEPLOY_AMOUNT = toNano('0.9'); // 0.4 TON min + 0.5 TON para o contrato
const WORKCHAIN = 0;

// Op-code para deploy_jetton
const OP_DEPLOY_JETTON = 0x61caf729;

async function main() {
    console.log("🚀 $NSF Token Deployment via Factory\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

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
        console.log(`🌐 Endpoint: ${endpoint.substring(0, 60)}...\n`);
        
        const client = new TonClient({ endpoint, timeout: 30000 });

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
            
        } else {
            const seed = process.env.TON_DEPLOYER_MNEMONIC;
            if (!seed || seed.trim().split(/\s+/).length < 12) {
                throw new Error("Need TON_DEPLOYER_PRIVATE_KEY or TON_DEPLOYER_MNEMONIC");
            }

            const mnemonics = seed.trim().split(/\s+/);
            keyPair = await mnemonicToPrivateKey(mnemonics);
        }
        const publicKey = keyPair.publicKey;

        // Use v5r1 (já confirmado)
        const wallet = WalletContractV5R1.create({ workchain: WORKCHAIN, publicKey });
        const walletContract = client.open(wallet);
        
        const balance = await client.getBalance(wallet.address);
        console.log(`💼 Deployer: ${wallet.address.toString()}`);
        console.log(`💰 Balance: ${(Number(balance) / 1e9).toFixed(4)} TON\n`);

        if (balance < DEPLOY_AMOUNT) {
            throw new Error(`Insufficient balance! Need ${Number(DEPLOY_AMOUNT) / 1e9} TON`);
        }

        // 3. Get Factory Address
        const factoryAddress = Address.parse(process.env.VITE_NEO_JETTON_FACTORY_ADDRESS);
        console.log(`🏭 Factory: ${factoryAddress.toString()}\n`);

        // Verify factory is deployed
        const factoryDeployed = await client.isContractDeployed(factoryAddress);
        if (!factoryDeployed) {
            throw new Error("Factory not deployed!");
        }
        console.log(`✅ Factory verified\n`);

        // 4. Build Token Metadata (TEP-64)
        console.log("📦 Building token metadata...");
        console.log(`   Name: ${TOKEN_CONFIG.name}`);
        console.log(`   Symbol: ${TOKEN_CONFIG.symbol}`);
        console.log(`   Max Supply: ${Number(TOKEN_CONFIG.maxSupply) / 1e9} tokens`);
        console.log(`   Mint Price: ${Number(TOKEN_CONFIG.mintPrice) / 1e9} TON`);
        console.log(`   Mint Amount: ${Number(TOKEN_CONFIG.mintAmount) / 1e9} tokens\n`);

        // Build content cell (off-chain metadata)
        const contentUri = `https://neoprotocol.space/api/jetton/nsf/metadata.json`;
        
        const contentCell = beginCell()
            .storeUint(0x01, 8) // Off-chain content flag
            .storeStringTail(contentUri)
            .endCell();

        // 5. Build Deploy Message
        console.log("🔨 Building deploy message...\n");

        const ownerAddress = wallet.address; // Token owner = deployer

        // Build deploy message - match Factory expectations exactly
        const queryId = Math.floor(Date.now() / 1000); // Unix timestamp (segundos)
        
        const deployMessage = beginCell()
            .storeUint(OP_DEPLOY_JETTON, 32)           // op::deploy_jetton
            .storeUint(queryId, 64)                    // query_id
            .storeAddress(ownerAddress)                // owner_address
            .storeRef(contentCell)                     // content
            .storeCoins(TOKEN_CONFIG.maxSupply)        // max_supply
            .storeCoins(TOKEN_CONFIG.mintPrice)        // mint_price
            .storeCoins(TOKEN_CONFIG.mintAmount)       // mint_amount
            .endCell();
        
        // Debug: verificar tamanho da mensagem
        console.log(`📊 Message Stats:`);
        console.log(`   Bits: ${deployMessage.bits.length}`);
        console.log(`   Refs: ${deployMessage.refs.length}`);
        console.log(`   Query ID: ${queryId}\n`);

        // 6. Send Transaction
        console.log("⏳ Sending transaction...");

        const seqno = await walletContract.getSeqno();
        
        await walletContract.sendTransfer({
            seqno,
            secretKey: keyPair.secretKey,
            messages: [
                internal({
                    to: factoryAddress,
                    value: DEPLOY_AMOUNT,
                    bounce: true,
                    body: deployMessage
                })
            ]
        });

        console.log("🚀 Transaction sent!\n");

        // 7. Wait for confirmation
        console.log("⏱  Waiting for confirmation...");
        
        let currentSeqno = seqno;
        let attempts = 0;
        const maxAttempts = 30;
        
        while (currentSeqno === seqno && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                currentSeqno = await walletContract.getSeqno();
                process.stdout.write(`\r⏱  ${attempts * 2}s`);
                attempts++;
            } catch (e) {
                // Continue waiting
            }
        }

        if (currentSeqno === seqno) {
            throw new Error("Transaction timeout!");
        }

        console.log(`\n✅ Transaction confirmed!\n`);

        // 8. Calculate Jetton Minter Address (deterministic)
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🎉 $NSF TOKEN DEPLOYED!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        
        console.log("⚠️  Note: O endereço exato do Jetton Minter será");
        console.log("   calculado deterministicamente pela Factory.");
        console.log("   Aguarde ~30s e consulte:");
        console.log(`   🔗 https://tonscan.org/address/${factoryAddress.toString()}\n`);
        
        console.log("📋 Token Info:");
        console.log(`   Name:        ${TOKEN_CONFIG.name}`);
        console.log(`   Symbol:      ${TOKEN_CONFIG.symbol}`);
        console.log(`   Owner:       ${ownerAddress.toString()}`);
        console.log(`   Max Supply:  ${Number(TOKEN_CONFIG.maxSupply) / 1e9} tokens`);
        console.log(`   Mint Price:  ${Number(TOKEN_CONFIG.mintPrice) / 1e9} TON`);
        console.log(`   Mint Amount: ${Number(TOKEN_CONFIG.mintAmount) / 1e9} tokens per mint\n`);

        console.log("🔍 Next steps:");
        console.log("   1. Aguarde 30-60s para propagação");
        console.log("   2. Verifique transações da Factory no TonScan");
        console.log("   3. Localize o endereço do Jetton Minter");
        console.log("   4. Teste public_mint() se habilitado\n");

    } catch (error) {
        console.error("\n❌ Deployment failed:");
        console.error(error.message);
        if (error.stack) {
            console.error("\nStack trace:");
            console.error(error.stack);
        }
        process.exit(1);
    }
}

main();
