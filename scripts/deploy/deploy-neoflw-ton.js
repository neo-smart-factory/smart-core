
import {
    TonClient,
    WalletContractV5R1,
    internal,
    beginCell,
    Address,
    toNano
} from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '/Users/nettomello/CODIGOS/neo-smart-token/smart-core/.env' });

// NEOFLW Token Configuration for TON
const TOKEN_CONFIG = {
    name: "NEOFlowOFF",
    symbol: "NEOFLW",
    description: "Official multichain token of NEO Protocol - Powered by NEO SMART FACTORY",
    decimals: 9,
    image: "https://raw.githubusercontent.com/neo-smart-factory/assets/main/neoflw-logo.png",

    maxSupply: toNano('1000000000'), // 1 billion
    mintPrice: toNano('0.1'),         // 0.1 TON per public mint
    mintAmount: toNano('1000')        // 1000 tokens per mint
};

const DEPLOY_AMOUNT = toNano('0.9'); // Funds needed for the factory call and gas
const WORKCHAIN = 0;
const OP_DEPLOY_JETTON = 0x61caf729; // op::deploy_jetton in JettonFactory

async function main() {
    console.log("🚀 $NEOFLW Token Deployment via Factory (TON)\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    try {
        const isTestnet = process.env.TON_NETWORK === 'testnet';
        // Usando OnFinality (Professional RPC) para evitar o erro 429 (Rate Limit) do TonCenter público
        const endpoint = isTestnet
            ? process.env.TON_RPC_URL_ONFINALITY_TESTNET
            : process.env.TON_RPC_URL_ONFINALITY_MAINNET;

        console.log(`📡 Usando RPC Profissional: ${endpoint.substring(0, 40)}...`);

        const client = new TonClient({ endpoint });

        const seed = process.env.TON_DEPLOYER_MNEMONIC;
        if (!seed) throw new Error("Need TON_DEPLOYER_MNEMONIC in .env");

        const mnemonics = seed.trim().split(/\s+/);
        const keyPair = await mnemonicToPrivateKey(mnemonics);
        const wallet = WalletContractV5R1.create({ workchain: WORKCHAIN, publicKey: keyPair.publicKey });
        const walletContract = client.open(wallet);

        const balance = await client.getBalance(wallet.address);
        console.log(`💼 Deployer: ${wallet.address.toString()}`);
        console.log(`💰 Balance: ${(Number(balance) / 1e9).toFixed(4)} TON\n`);

        const factoryAddress = Address.parse(process.env.VITE_NEO_JETTON_FACTORY_ADDRESS);
        console.log(`🏭 Factory: ${factoryAddress.toString()}\n`);

        // Build content cell (TEP-64 Off-chain content)
        // Usando o domínio oficial nsfactory.xyz informado pelo usuário
        const contentUri = `https://nsfactory.xyz/api/jetton/neoflw.json`;
        const contentCell = beginCell()
            .storeUint(0x01, 8)
            .storeStringTail(contentUri)
            .endCell();

        const queryId = Math.floor(Date.now() / 1000);
        const deployMessage = beginCell()
            .storeUint(OP_DEPLOY_JETTON, 32)
            .storeAddress(wallet.address) // owner
            .storeRef(contentCell)
            .storeCoins(TOKEN_CONFIG.maxSupply)
            .storeCoins(TOKEN_CONFIG.mintPrice)
            .storeCoins(TOKEN_CONFIG.mintAmount)
            .endCell();

        console.log("⏳ Sending transaction to factory...");
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

        console.log("✅ Transaction sent! Waiting for confirmation...");

        // Wait for seqno change
        let currentSeqno = seqno;
        while (currentSeqno === seqno) {
            await new Promise(r => setTimeout(r, 2000));
            currentSeqno = await walletContract.getSeqno();
        }

        console.log("\n🎉 $NEOFLW DEPLOYED ON TON!");
        console.log(`🔗 Monitor: https://tonscan.org/address/${factoryAddress.toString()}`);

    } catch (error) {
        console.error("\n❌ Deployment failed:", error.message);
        process.exit(1);
    }
}

main();
