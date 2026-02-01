
import {
    Address,
    beginCell,
    contractAddress,
    toNano
} from '@ton/ton';
import { TonClient4 } from '@ton/ton'; // Using v4 for better data access if needed
import { JettonFactory } from './contracts/ton/build/factory/factory_NeoJettonFactory';
import { JettonMinter } from './contracts/ton/build/factory/factory_NeoJettonMinter';
import dotenv from 'dotenv';

dotenv.config({ path: '/Users/nettomello/CODIGOS/neo-smart-token/smart-core/.env' });

async function main() {
    const owner = Address.parse('EQC26-onECecaokHwQ8cDXb8ap82oSqfmhlknYGjhDNYSSdB'); // Deployer wallet
    const treasury = Address.parse('UQBSi9T1-iPqrVvs8dDFIlOxQ7qZYTYFT4ocF7wK1syBevlj');

    // Config used in deploy script
    const contentUri = `https://nsfactory.xyz/api/jetton/neoflw.json`;
    const contentCell = beginCell()
        .storeUint(0x01, 8)
        .storeStringTail(contentUri)
        .endCell();

    const maxSupply = toNano('1000000000');
    const mintPrice = toNano('0.1');
    const mintAmount = toNano('1000');

    console.log('--- DETERMINISTIC ADDRESS CALCULATION ---');

    // We need to match the init() parameters of JettonMinter.tact:
    // init(owner: Address, content: Cell, max: Int, price: Int, amount: Int, treasury: Address)

    // In Tact, we use the build classes to get the initOf
    // Since I'm running this in the node environment, I'll use the generated code if available
    // or simulate the StateInit.

    console.log('Inputs:');
    console.log('Owner:', owner.toString());
    console.log('Max Supply:', maxSupply.toString());
    console.log('Mint Price:', mintPrice.toString());
    console.log('Mint Amount:', mintAmount.toString());
    console.log('Treasury:', treasury.toString());
}

main();
