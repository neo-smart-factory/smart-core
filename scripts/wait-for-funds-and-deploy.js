/**
 * Script que monitora a wallet e inicia deploy automaticamente quando receber fundos
 */

const { TonClient, WalletContractV4 } = require('@ton/ton');
const { mnemonicToPrivateKey } = require('@ton/crypto');
const { spawn } = require('child_process');
require('dotenv').config();

const REQUIRED_BALANCE = 0.5; // TON necessário para deploy
const CHECK_INTERVAL = 10000; // Verificar a cada 10 segundos

async function checkBalance() {
    const client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        timeout: 30000
    });
    
    const mnemonic = process.env.TON_DEPLOYER_MNEMONIC.split(' ');
    const keyPair = await mnemonicToPrivateKey(mnemonic);
    
    const workchain = 0;
    const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
    const address = wallet.address;
    
    const balance = await client.getBalance(address);
    const balanceTON = Number(balance) / 1e9;
    
    return { address, balanceTON };
}

async function runDeploy() {
    console.log('\n🚀 Iniciando deploy da Factory V2.3.0...\n');
    
    return new Promise((resolve, reject) => {
        const deploy = spawn('node', ['scripts/deploy-ton-factory-v2.js'], {
            stdio: 'inherit'
        });
        
        deploy.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Deploy falhou com código ${code}`));
            }
        });
    });
}

async function main() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏳ Aguardando Fundos na Testnet');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    try {
        const { address, balanceTON } = await checkBalance();
        
        console.log('📍 Endereço da Wallet:', address.toString({ bounceable: false }));
        console.log('💰 Saldo Requerido:', REQUIRED_BALANCE, 'TON');
        console.log('💰 Saldo Atual:', balanceTON, 'TON\n');
        
        if (balanceTON >= REQUIRED_BALANCE) {
            console.log('✅ Saldo suficiente detectado!\n');
            await runDeploy();
            console.log('\n✅ Deploy concluído com sucesso!');
            process.exit(0);
        }
        
        console.log('⚠️  Saldo insuficiente. Aguardando fundos...');
        console.log('📱 Obtenha TON de teste em: https://t.me/testgiver_ton_bot');
        console.log('💬 Envie para o bot:');
        console.log('   /start');
        console.log('   ' + address.toString({ bounceable: false }));
        console.log('\n🔄 Verificando saldo a cada 10 segundos...\n');
        
        let checks = 0;
        const interval = setInterval(async () => {
            try {
                checks++;
                const { balanceTON: currentBalance } = await checkBalance();
                
                process.stdout.write(`\r⏳ Check #${checks} - Saldo: ${currentBalance.toFixed(4)} TON`);
                
                if (currentBalance >= REQUIRED_BALANCE) {
                    clearInterval(interval);
                    console.log('\n\n✅ Fundos recebidos! Iniciando deploy...\n');
                    
                    await runDeploy();
                    console.log('\n✅ Deploy concluído com sucesso!');
                    process.exit(0);
                }
            } catch (error) {
                console.error('\n❌ Erro ao verificar saldo:', error.message);
            }
        }, CHECK_INTERVAL);
        
        // Timeout após 30 minutos
        setTimeout(() => {
            clearInterval(interval);
            console.log('\n\n⏱️  Timeout: 30 minutos sem receber fundos.');
            console.log('Execute novamente quando tiver fundos ou rode manualmente:');
            console.log('   node scripts/deploy-ton-factory-v2.js');
            process.exit(1);
        }, 30 * 60 * 1000);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

// Lidar com Ctrl+C
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Processo interrompido pelo usuário.');
    console.log('Execute novamente quando tiver fundos:');
    console.log('   node scripts/wait-for-funds-and-deploy.js');
    process.exit(0);
});

main();
