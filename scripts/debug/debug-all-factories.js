/* eslint-disable */
require('dotenv').config();
const { TonClient, Address } = require('@ton/ton');

const FACTORIES = [
    {
        name: "Factory #1",
        address: "EQAqoO4t8NKfjXQ1mEeBwqqjEON6zwECv-haaX__pGp_C2ZM",
        timestamp: "2026-01-25T02:26:59.000Z"
    },
    {
        name: "Factory #2",
        address: "EQCFOkAK28g0uhy_D3t2SpRhHDtjFjAkouGdh0qatW7RXMz9",
        timestamp: "2026-01-25T02:35:00.000Z"
    },
    {
        name: "Factory #3",
        address: "EQBtxNPwrpX6Enzw3j7bjFkGFUpnFivLeRW9LVOeT-Yldalz",
        timestamp: "2026-01-25T02:41:11.000Z"
    }
];

const DEPLOYER_ADDRESS = "EQBjbQzHjeV9UKgR_8SSUAmfXxnUAH6UDA5BqnhwCxEbo5VY";

async function debugFactory(factory) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🏭 ${factory.name}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📍 Address: ${factory.address}`);
    console.log(`⏰ Deployed: ${factory.timestamp}\n`);
    
    const client = new TonClient({
        endpoint: 'https://toncenter.com/api/v2/jsonRPC'
    });
    
    try {
        const transactions = await client.getTransactions(
            Address.parse(factory.address),
            { limit: 10 }
        );
        
        console.log(`📡 Transações encontradas: ${transactions.length}\n`);
        
        let jettonFound = false;
        
        for (let i = 0; i < transactions.length; i++) {
            const tx = transactions[i];
            const hash = tx.hash().toString('hex');
            const time = new Date(tx.now * 1000).toISOString();
            
            // Verificar se tem mensagem de entrada do deployer
            const inMsg = tx.inMessage;
            let isFromDeployer = false;
            
            if (inMsg && inMsg.info.type === 'internal') {
                const source = inMsg.info.src;
                isFromDeployer = source.equals(Address.parse(DEPLOYER_ADDRESS));
            }
            
            // Verificar mensagens de saída com StateInit
            const outMsgs = tx.outMessages;
            
            for (const [key, msg] of outMsgs) {
                if (msg.info.type === 'internal' && msg.init) {
                    const dest = msg.info.dest;
                    const value = msg.info.value.coins;
                    
                    console.log("🎯 JETTON MINTER ENCONTRADO!");
                    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    console.log(`📍 Jetton Minter: ${dest}`);
                    console.log(`⏰ Time: ${time}`);
                    console.log(`💰 Value: ${Number(value) / 1e9} TON`);
                    console.log(`📋 Tx Hash: ${hash}`);
                    console.log(`🔗 TonScan: https://tonscan.org/address/${dest}`);
                    console.log(`🔗 Jetton: https://tonscan.org/jetton/${dest}`);
                    
                    if (isFromDeployer) {
                        console.log(`✅ Deploy request veio do DEPLOYER`);
                    }
                    
                    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
                    
                    jettonFound = true;
                }
            }
        }
        
        if (!jettonFound) {
            console.log("⚠️  Nenhum Jetton Minter deployado por esta Factory\n");
            
            // Mostrar resumo das transações
            console.log("📊 Resumo das transações:\n");
            for (let i = 0; i < Math.min(3, transactions.length); i++) {
                const tx = transactions[i];
                const time = new Date(tx.now * 1000).toISOString();
                const outMsgs = tx.outMessages;
                
                console.log(`   ${i + 1}. ${time}`);
                console.log(`      Out Messages: ${outMsgs.size}`);
                
                if (outMsgs.size > 0) {
                    for (const [key, msg] of outMsgs) {
                        if (msg.info.type === 'internal') {
                            const dest = msg.info.dest;
                            const value = msg.info.value.coins;
                            console.log(`      → ${dest.toString().slice(0, 20)}... (${Number(value) / 1e9} TON)`);
                            
                            if (dest.equals(Address.parse(DEPLOYER_ADDRESS))) {
                                console.log(`        (Devolução para deployer)`);
                            }
                        }
                    }
                }
                console.log();
            }
        }
        
    } catch (error) {
        console.error(`❌ Erro ao buscar transações: ${error.message}\n`);
    }
}

async function main() {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 AUDITORIA: Verificando TODAS as Factories");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`👤 Deployer: ${DEPLOYER_ADDRESS}\n`);
    
    for (const factory of FACTORIES) {
        await debugFactory(factory);
        // Pequeno delay para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 CONCLUSÃO");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("Se nenhum Jetton foi encontrado, significa que:");
    console.log("1. ❌ Deploy falhou silenciosamente (Factory não criou contrato)");
    console.log("2. ❌ StateInit está incorreto no contrato Factory");
    console.log("3. ❌ O op::deploy_jetton não está funcionando\n");
}

main()
    .then(() => {
        console.log("✅ Auditoria concluída!");
        process.exit(0);
    })
    .catch(error => {
        console.error("❌ Erro fatal:", error);
        process.exit(1);
    });
