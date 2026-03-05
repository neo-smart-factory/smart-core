
import { TonClient, WalletContractV5R1 } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import dotenv from 'dotenv';
import { fromNano } from '@ton/core';

dotenv.config({ path: '/Users/nettomello/CODIGOS/neo-smart-token/smart-core/.env' });

async function main() {
    const seed = process.env.TON_DEPLOYER_MNEMONIC;
    if (!seed) {
        console.error('No mnemonic found in .env');
        return;
    }

    const isTestnet = process.env.TON_NETWORK === 'testnet';
    const endpoint = isTestnet
        ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
        : 'https://toncenter.com/api/v2/jsonRPC';

    // TonCenter API Key if provided
    const apiKey = process.env.TON_API_KEY || ''; // Adjust if the env var name is different in your .env

    const client = new TonClient({ endpoint, apiKey });
    const mnemonics = seed.trim().split(/\s+/);
    const keyPair = await mnemonicToPrivateKey(mnemonics);
    const wallet = WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey });

    console.log(`Checking balance for: ${wallet.address.toString()} (${isTestnet ? 'Testnet' : 'Mainnet'})`);

    try {
        const balance = await client.getBalance(wallet.address);
        console.log(`Current Balance: ${fromNano(balance)} TON`);
    } catch (e) {
        console.error('Error fetching balance:', e.message);
    }
}

main();
