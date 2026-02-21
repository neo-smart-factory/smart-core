/* eslint-disable */
require('dotenv').config();
const { TonClient, Address } = require('@ton/ton');

async function checkFactoryState() {
    console.log("🔍 Verificando estado da Factory\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    const apiKey = process.env.TON_API_URL || '';
    const endpoint = apiKey
        ? `https://toncenter.com/api/v2/jsonRPC?api_key=${apiKey}`
        : 'https://toncenter.com/api/v2/jsonRPC';
    
    const client = new TonClient({ endpoint, timeout: 30000 });
    
    const FACTORY_ADDRESS = process.env.VITE_NEO_JETTON_FACTORY_ADDRESS;
    const DEPLOYER_ADDRESS = process.env.VITE_PROTOCOL_TREASURY_ADDRESS;
    
    console.log(`🏭 Factory: ${FACTORY_ADDRESS}`);
    console.log(`👤 Deployer: ${DEPLOYER_ADDRESS}\n`);
    
    try {
        const factoryAddr = Address.parse(FACTORY_ADDRESS);
        
        // Verificar se está deployada
        const isDeployed = await client.isContractDeployed(factoryAddr);
        console.log(`✅ Deployada: ${isDeployed ? 'SIM' : 'NÃO'}\n`);
        
        if (!isDeployed) {
            console.log("❌ Factory não está deployada!");
            return;
        }
        
        // Verificar estado
        const state = await client.getContractState(factoryAddr);
        console.log(`📊 Estado do Contrato:`);
        console.log(`   Balance: ${Number(state.balance) / 1e9} TON`);
        console.log(`   Last Transaction: ${new Date(state.lastTransaction.lt * 1000).toLocaleString('pt-BR')}\n`);
        
        // Tentar chamar get_is_admin
        try {
            console.log("🔑 Testando get_is_admin...");
            const deployerAddr = Address.parse(DEPLOYER_ADDRESS);
            
            const result = await client.runMethod(factoryAddr, 'get_is_admin', [{
                type: 'slice',
                cell: deployerAddr.toCell()
            }]);
            
            console.log(`   Deployer é admin: ${result.stack.readBoolean() ? 'SIM' : 'NÃO'}\n`);
        } catch (e) {
            console.log(`   ⚠️  Erro ao chamar get_is_admin: ${e.message}\n`);
        }
        
        // Verificar últimas 3 transações
        console.log("📋 Últimas Transações:\n");
        const transactions = await client.getTransactions(factoryAddr, { limit: 3 });
        
        for (let i = 0; i < transactions.length; i++) {
            const tx = transactions[i];
            const time = new Date(tx.now * 1000).toLocaleString('pt-BR');
            const hash = tx.hash().toString('hex');
            
            console.log(`   ${i + 1}. ${time}`);
            console.log(`      Hash: ${hash.substring(0, 16)}...`);
            
            // Verificar se houve bounce
            if (tx.inMessage && tx.inMessage.info.type === 'internal' && tx.inMessage.info.bounced) {
                console.log(`      ⚠️  BOUNCED MESSAGE`);
            }
            
            // Verificar mensagens de saída
            console.log(`      Mensagens de saída: ${tx.outMessages.size}`);
            
            if (tx.outMessages.size > 0) {
                for (const [key, msg] of tx.outMessages) {
                    if (msg.info.type === 'internal') {
                        const dest = msg.info.dest;
                        const value = Number(msg.info.value.coins) / 1e9;
                        const bounced = msg.info.bounced || false;
                        
                        console.log(`         → ${dest.toString().substring(0, 20)}... (${value} TON)${bounced ? ' [BOUNCE]' : ''}`);
                        
                        if (msg.init) {
                            console.log(`         ✅ StateInit presente - Novo contrato deployado!`);
                        }
                    }
                }
            }
            console.log('');
        }
        
    } catch (error) {
        console.error("\n❌ Erro:");
        console.error(error.message);
        if (error.stack) {
            console.error(error.stack);
        }
    }
}

checkFactoryState();
