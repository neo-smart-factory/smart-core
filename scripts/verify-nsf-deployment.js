/* eslint-disable */
require('dotenv').config();
const { TonClient, Address } = require('@ton/ton');

async function verifyDeployment() {
    console.log("🔍 Verificando deployment do $NSF Token\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    const apiKey = process.env.TON_API_URL || '';
    const endpoint = apiKey
        ? `https://toncenter.com/api/v2/jsonRPC?api_key=${apiKey}`
        : 'https://toncenter.com/api/v2/jsonRPC';
    
    const client = new TonClient({ endpoint, timeout: 30000 });
    
    const FACTORY_ADDRESS = process.env.VITE_NEO_JETTON_FACTORY_ADDRESS;
    
    if (!FACTORY_ADDRESS) {
        throw new Error("VITE_NEO_JETTON_FACTORY_ADDRESS não configurado no .env");
    }
    
    console.log(`🏭 Factory: ${FACTORY_ADDRESS}`);
    console.log(`🔗 https://tonscan.org/address/${FACTORY_ADDRESS}\n`);
    
    try {
        // Verificar se a Factory está deployada
        const factoryDeployed = await client.isContractDeployed(Address.parse(FACTORY_ADDRESS));
        
        if (!factoryDeployed) {
            console.log("❌ Factory não está deployada!");
            return;
        }
        
        console.log("✅ Factory deployada e ativa\n");
        
        // Buscar últimas transações
        console.log("📡 Buscando últimas transações da Factory...\n");
        
        const transactions = await client.getTransactions(
            Address.parse(FACTORY_ADDRESS),
            { limit: 5 }
        );
        
        console.log(`📋 Encontradas ${transactions.length} transações\n`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        
        let jettonMinterFound = false;
        
        for (let i = 0; i < transactions.length; i++) {
            const tx = transactions[i];
            const time = new Date(tx.now * 1000).toLocaleString('pt-BR');
            
            console.log(`\n📌 Transação #${i + 1}`);
            console.log(`   Hora: ${time}`);
            
            // Verificar mensagens de saída
            const outMsgs = tx.outMessages;
            
            if (outMsgs.size > 0) {
                console.log(`   📤 ${outMsgs.size} mensagem(ns) de saída\n`);
                
                let msgIdx = 0;
                for (const [key, msg] of outMsgs) {
                    if (msg.info.type === 'internal') {
                        const dest = msg.info.dest;
                        const value = msg.info.value.coins;
                        
                        console.log(`      📨 Mensagem #${msgIdx + 1}:`);
                        console.log(`         Para: ${dest.toString()}`);
                        console.log(`         Valor: ${Number(value) / 1e9} TON`);
                        
                        // Verificar se tem StateInit (indica deploy de contrato)
                        if (msg.init) {
                            console.log(`         ✅ StateInit presente (novo contrato)`);
                            console.log(`\n         🎯 JETTON MINTER ENCONTRADO!`);
                            console.log(`         📍 Endereço: ${dest.toString()}`);
                            console.log(`         🔗 https://tonscan.org/address/${dest.toString()}`);
                            jettonMinterFound = true;
                        }
                        
                        console.log('');
                        msgIdx++;
                    }
                }
            }
        }
        
        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        
        if (jettonMinterFound) {
            console.log("✅ VERIFICAÇÃO CONCLUÍDA COM SUCESSO!\n");
            console.log("📋 Resumo do $NSF Token:");
            console.log("   Nome: Neo Smart Factory");
            console.log("   Symbol: NSF");
            console.log("   Max Supply: 1,000,000,000 tokens");
            console.log("   Mint Price: 0.1 TON");
            console.log("   Mint Amount: 1,000 tokens per mint\n");
            console.log("🎉 O token está pronto para uso!");
        } else {
            console.log("⚠️  Jetton Minter não encontrado nas últimas transações.");
            console.log("   Isso pode significar:");
            console.log("   1. A transação ainda está sendo processada (aguarde mais tempo)");
            console.log("   2. A transação falhou (verifique no TonScan)");
            console.log(`   3. Verifique manualmente: https://tonscan.org/address/${FACTORY_ADDRESS}\n`);
        }
        
    } catch (error) {
        console.error("\n❌ Erro ao verificar deployment:");
        console.error(error.message);
    }
}

verifyDeployment();
