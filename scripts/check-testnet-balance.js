const { Address } = require('@ton/ton');
const { mnemonicToPrivateKey } = require('@ton/crypto');
const { WalletContractV4 } = require('@ton/ton');
const { createRpcClient } = require('./smart-rpc-selector');
require('dotenv').config();

async function checkBalance() {
    try {
        console.log('🔍 Verificando saldo da wallet na Testnet...\n');
        
        // Usar Smart RPC Selector com fallback automático
        const rpc = await createRpcClient(true); // true = testnet
        const client = rpc.client;
        
        console.log(`🔌 Provider: ${rpc.name} (${rpc.latency}ms)\n`);
        
        const mnemonic = process.env.TON_DEPLOYER_MNEMONIC.split(' ');
        const keyPair = await mnemonicToPrivateKey(mnemonic);
        
        const workchain = 0;
        const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
        const address = wallet.address;
        
        console.log('📍 Endereço da Wallet:', address.toString());
        console.log('   Formato Bounceable:', address.toString({ bounceable: true }));
        console.log('   Formato Non-Bounceable:', address.toString({ bounceable: false }));
        console.log();
        
        const balance = await client.getBalance(address);
        const balanceTON = Number(balance) / 1e9;
        
        console.log('💰 Saldo:', balanceTON, 'TON');
        
        if (balanceTON < 0.5) {
            console.log('\n⚠️  Saldo baixo! Você precisa de pelo menos 0.5 TON para deploy na testnet.');
            console.log('📱 Obtenha TON de teste em: https://t.me/testgiver_ton_bot');
            console.log('💬 Envie para o bot: /start e depois ' + address.toString({ bounceable: false }));
        } else {
            console.log('\n✅ Saldo suficiente para deploy!');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar saldo:', error.message);
    }
}

checkBalance().catch(console.error);
