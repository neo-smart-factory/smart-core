import { config } from 'dotenv';
config({ path: '.env' });
import { TonClient, WalletContractV4, WalletContractV3R2, WalletContractV3R1, WalletContractV5R1, internal, toNano, Address, OpenedContract, beginCell } from '@ton/ton';
import { mnemonicToPrivateKey, keyPairFromSecretKey } from '@ton/crypto';
import * as fs from 'fs';
import * as path from 'path';
import { NeoJettonFactory, storeDeploy } from '../contracts/ton/build/factory/factory_NeoJettonFactory';

// Constants
const DEPLOY_AMOUNT = toNano('0.5'); // 0.5 TON for deploy + storage
const WORKCHAIN = 0;

async function main() {
    console.log("🚀 Starting NΞØ Tact Factory Deployment...\n");

    try {
        // 1. Setup Client
        const isTestnet = process.env.TON_NETWORK === 'testnet';
        const apiKey = process.env.TON_API_KEY || '';

        const endpoint = isTestnet
            ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
            : 'https://toncenter.com/api/v2/jsonRPC';

        const client = new TonClient({
            endpoint: apiKey ? `${endpoint}?api_key=${apiKey}` : endpoint
        });

        console.log(`📡 Network: ${isTestnet ? 'Testnet' : 'Mainnet'}`);

        // 2. Setup Wallet (Private Key or Mnemonic)
        let keyPair;
        if (process.env.TON_DEPLOYER_PRIVATE_KEY) {
            console.log("🔑 Using TON_DEPLOYER_PRIVATE_KEY");
            const privKeyHex = process.env.TON_DEPLOYER_PRIVATE_KEY;
            const privKeyBuffer = Buffer.from(privKeyHex, 'hex');
            // ton-crypto keyPairFromSecretKey expects the full 64-byte secret key (which includes public key)
            keyPair = keyPairFromSecretKey(privKeyBuffer);
        } else {
            console.log("📝 Using TON_DEPLOYER_MNEMONIC");
            const seed = process.env.TON_DEPLOYER_MNEMONIC;
            if (!seed) throw new Error("Missing TON_DEPLOYER_MNEMONIC in .env");
            keyPair = await mnemonicToPrivateKey(seed.split(" "));
        }

        const publicKey = keyPair.publicKey;

        const walletVersions = [
            { name: 'v5r1', contract: WalletContractV5R1.create({ workchain: WORKCHAIN, publicKey }) },
            { name: 'v4', contract: WalletContractV4.create({ workchain: WORKCHAIN, publicKey }) },
            { name: 'v3r2', contract: WalletContractV3R2.create({ workchain: WORKCHAIN, publicKey }) },
            { name: 'v3r1', contract: WalletContractV3R1.create({ workchain: WORKCHAIN, publicKey }) }
        ];

        console.log("🔍 Detecting wallet version...");
        let walletContract: OpenedContract<WalletContractV5R1 | WalletContractV4 | WalletContractV3R2 | WalletContractV3R1> | null = null;
        let maxBalance = 0n;
        let selectedWalletName = "";

        // Check specific wallet if requested (UQBSi9T1...)
        const targetWallet = "UQBSi9T1-iPqrVvs8dDFIlOxQ7qZYTYFT4ocF7wK1syBevlj";
        let targetAddress: Address | null = null;
        try { targetAddress = Address.parse(targetWallet); } catch { }

        const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

        const retry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
            try {
                return await fn();
            } catch (e) {
                if (retries <= 0) throw e;
                console.log(`      ⚠️  Rate limit? Retrying in ${delay / 1000}s...`);
                await sleep(delay);
                return retry(fn, retries - 1, delay * 2);
            }
        };

        for (const { name, contract } of walletVersions) {
            await sleep(1500); // Rate limit protection
            try {
                const balance = await retry(() => client.getBalance(contract.address));
                const balanceTON = Number(balance) / 1e9;
                console.log(`   ${name}: ${contract.address.toString()} - ${balanceTON.toFixed(4)} TON`);

                // Prioritize the requested wallet or highest balance
                const isTarget = targetAddress && contract.address.equals(targetAddress);

                if (isTarget) {
                    maxBalance = balance;
                    walletContract = client.open(contract) as any;
                    selectedWalletName = name;
                    break;
                }

                if (balance > maxBalance) {
                    maxBalance = balance;
                    walletContract = client.open(contract) as any;
                    selectedWalletName = name;
                }
            } catch (e) {
                console.log(`   ${name}: Unable to check`);
            }
        }

        if (!walletContract || maxBalance < DEPLOY_AMOUNT) {
            throw new Error(`Insufficient funds. Need ${Number(DEPLOY_AMOUNT) / 1e9} TON`);
        }

        console.log(`\n✅ Using ${selectedWalletName} wallet: ${walletContract.address.toString()}`);
        console.log(`💰 Balance: ${(Number(maxBalance) / 1e9).toFixed(4)} TON`);

        const walletAddress = walletContract.address;

        // 3. Prepare Factory Init Data
        const treasuryEnv = process.env.VITE_PROTOCOL_TREASURY_ADDRESS;
        if (!treasuryEnv) throw new Error("Missing VITE_PROTOCOL_TREASURY_ADDRESS");

        const owner = walletAddress;
        const treasury = Address.parse(treasuryEnv);

        console.log(`\n⚙️  Init Params:`);
        console.log(`   Owner: ${owner}`);
        console.log(`   Treasury: ${treasury}`);

        // 4. Initialize Contract
        const factory = await NeoJettonFactory.fromInit(owner, treasury);

        // Check if already deployed
        if (await client.isContractDeployed(factory.address)) {
            console.log(`\n⚠️  Factory already deployed at: ${factory.address}`);
            return;
        }

        const contract = client.open(factory);

        // 5. Send Deploy Transaction
        console.log(`\n🚀 Deploying to: ${factory.address}`);

        await sleep(2000); // Wait before getSeqno
        const seqno = await retry(() => walletContract.getSeqno());

        await sleep(1000); // Wait before sendTransfer
        await retry(() => walletContract.sendTransfer({
            seqno,
            secretKey: keyPair.secretKey,
            sendMode: 1, // SendMode.PAY_GAS_SEPARATELY = 1. Used for all wallets safely.
            messages: [
                internal({
                    to: factory.address,
                    value: DEPLOY_AMOUNT,
                    init: factory.init, // Important: Send StateInit
                    bounce: false,
                    body: beginCell().store(storeDeploy({ $$type: 'Deploy', queryId: 0n })).endCell()
                })
            ]
        }));

        console.log(`\n✅ Transaction sent! Waiting for confirmation...`);

        // Wait for deployment
        let attempts = 0;
        while (attempts < 30) {
            await new Promise(r => setTimeout(r, 2000));
            if (await client.isContractDeployed(factory.address)) {
                console.log(`\n✨ Factory successfully deployed!`);
                console.log(`🔗 Explorer: https://${isTestnet ? 'testnet.' : ''}tonscan.org/address/${factory.address}`);
                return;
            }
            process.stdout.write(".");
            attempts++;
        }

        console.log("\n⚠️  Timeout waiting for deployment. Check explorer.");

    } catch (e) {
        console.error(`\n❌ Error: ${(e as Error).message}`);
        process.exit(1);
    }
}

main();
