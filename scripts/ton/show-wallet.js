
import { TonClient, WalletContractV5R1 } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '/Users/nettomello/CODIGOS/neo-smart-token/smart-core/.env' });

async function main() {
    const seed = process.env.TON_DEPLOYER_MNEMONIC;
    if (!seed) {
        console.error('No mnemonic found in .env');
        return;
    }

    const mnemonics = seed.trim().split(/\s+/);
    const keyPair = await mnemonicToPrivateKey(mnemonics);
    const publicKey = keyPair.publicKey;

    // Use v5r1 as per the project standards
    const wallet = WalletContractV5R1.create({ workchain: 0, publicKey });

    console.log('--- WALLET INFO ---');
    console.log('Address (Bounceable):', wallet.address.toString({ bounceable: true }));
    console.log('Address (Non-bounceable):', wallet.address.toString({ bounceable: false }));
    console.log('Address (Raw):', wallet.address.toRawString());
}

main();
