/* eslint-disable */
require('dotenv').config();
const { TonClient, Address } = require('@ton/ton');

async function debugJettonAddress() {
    console.log("🔍 DEBUG: Analisando transação de deploy do Jetton\n");
    
    const client = new TonClient({
        endpoint: 'https://toncenter.com/api/v2/jsonRPC'
    });
    
    // Endereços conhecidos
    const FACTORY_ADDRESS = "EQBtxNPwrpX6Enzw3j7bjFkGFUpnFivLeRW9LVOeT-Yldalz"; // Última factory
    const DEPLOYER_ADDRESS = "EQBjbQzHjeV9UKgR_8SSUAmfXxnUAH6UDA5BqnhwCxEbo5VY";
    
    console.log("📍 Factory:", FACTORY_ADDRESS);
    console.log("👤 Deployer:", DEPLOYER_ADDRESS);
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    try {
        // 1. Buscar últimas transações da Factory
        console.log("📡 Buscando transações da Factory...");
        
        const transactions = await client.getTransactions(
            Address.parse(FACTORY_ADDRESS),
            { limit: 10 }
        );
        
        console.log(`✅ Encontradas ${transactions.length} transações\n`);
        
        // 2. Analisar cada transação
        for (let i = 0; i < transactions.length; i++) {
            const tx = transactions[i];
            const hash = tx.hash().toString('hex');
            const time = new Date(tx.now * 1000).toISOString();
            
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📋 Transação #${i + 1}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`Hash: ${hash}`);
            console.log(`Time: ${time}`);
            
            // Verificar mensagens de entrada
            const inMsg = tx.inMessage;
            if (inMsg && inMsg.info.type === 'internal') {
                const source = inMsg.info.src;
                console.log(`📥 IN  - Source: ${source}`);
                
                // Verificar se é do deployer
                if (source.equals(Address.parse(DEPLOYER_ADDRESS))) {
                    console.log(`   ✅ Mensagem do DEPLOYER detectada!`);
                }
            }
            
            // 🎯 CRÍTICO: Analisar mensagens de SAÍDA
            const outMsgs = tx.outMessages;
            console.log(`\n📤 OUT Messages: ${outMsgs.size}`);
            
            if (outMsgs.size > 0) {
                let idx = 0;
                for (const [key, msg] of outMsgs) {
                    if (msg.info.type === 'internal') {
                        const dest = msg.info.dest;
                        const value = msg.info.value.coins;
                        const bounce = msg.info.bounce;
                        
                        console.log(`\n   📨 Out Message #${idx}:`);
                        console.log(`      Destination: ${dest}`);
                        console.log(`      Value: ${Number(value) / 1e9} TON`);
                        console.log(`      Bounce: ${bounce}`);
                        
                        // 🎯 Este é provavelmente o Jetton Minter!
                        if (!dest.equals(Address.parse(DEPLOYER_ADDRESS))) {
                            console.log(`      🎯 POSSÍVEL JETTON MINTER!`);
                            console.log(`      ✅ Diferente do deployer`);
                            
                            // Verificar se tem StateInit
                            if (msg.init) {
                                console.log(`      ✅ StateInit presente`);
                                console.log(`      🔥 ESTE É O JETTON MINTER!`);
                            }
                        } else {
                            console.log(`      ⚠️  Mesmo endereço do deployer (não é o Jetton)`);
                        }
                    }
                    idx++;
                }
            }
            
            console.log(`\n`);
        }
        
        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📊 RESUMO");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        
        // 3. Buscar especificamente mensagens com StateInit
        console.log("🔍 Procurando mensagens com StateInit (deploy de contratos)...\n");
        
        let foundJetton = false;
        
        for (const tx of transactions) {
            const outMsgs = tx.outMessages;
            
            for (const [key, msg] of outMsgs) {
                if (msg.info.type === 'internal' && msg.init) {
                    const dest = msg.info.dest;
                    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    console.log("🎯 CONTRATO DEPLOYADO ENCONTRADO!");
                    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    console.log(`📍 Endereço: ${dest}`);
                    console.log(`⏰ Time: ${new Date(tx.now * 1000).toISOString()}`);
                    console.log(`💰 Value: ${Number(msg.info.value.coins) / 1e9} TON`);
                    console.log(`\n🔗 TonScan: https://tonscan.org/address/${dest}\n`);
                    
                    foundJetton = true;
                }
            }
        }
        
        if (!foundJetton) {
            console.log("⚠️  Nenhum contrato com StateInit encontrado nas últimas 10 transações");
            console.log("💡 Tente aumentar o limite ou verificar se o deploy foi mais antigo");
        }
        
    } catch (error) {
        console.error("\n❌ Erro:", error.message);
        if (error.stack) {
            console.error(error.stack);
        }
    }
}

// Função alternativa: Calcular endereço esperado do Jetton
async function calculateExpectedJettonAddress() {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🧮 CÁLCULO DO ENDEREÇO ESPERADO");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    const fs = require('fs');
    const path = require('path');
    const { Cell, beginCell, contractAddress } = require('@ton/ton');
    
    try {
        // Carregar códigos compilados
        const buildPath = path.join(__dirname, '../artifacts/ton');
        
        const minterCode = Cell.fromBoc(
            fs.readFileSync(path.join(buildPath, 'NeoJettonMinter.cell'))
        )[0];
        
        const walletCode = Cell.fromBoc(
            fs.readFileSync(path.join(buildPath, 'NeoJettonWallet.cell'))
        )[0];
        
        // Parâmetros do deploy (mesmos usados no deploy real)
        const owner = Address.parse("EQBjbQzHjeV9UKgR_8SSUAmfXxnUAH6UDA5BqnhwCxEbo5VY");
        const maxSupply = 1000000000n * 1000000000n; // 1B tokens
        const mintPrice = 100000000n; // 0.1 TON
        const mintAmount = 1000n * 1000000000n; // 1000 tokens
        
        // Construir metadata (mesmo do deploy)
        const metadata = beginCell()
            .storeUint(0, 8) // off-chain tag
            .storeStringTail("https://neoprotocol.space/nsf-metadata.json")
            .endCell();
        
        // V2 extra data
        const v2Extra = beginCell()
            .storeCoins(maxSupply)
            .storeCoins(mintPrice)
            .storeCoins(mintAmount)
            .storeUint(1, 1) // public_mint_enabled
            .storeUint(0, 2) // bridge_minter = addr_none
            .storeDict(null) // empty minters_dict
            .endCell();
        
        // Minter initial data
        const minterData = beginCell()
            .storeCoins(0) // total_supply
            .storeAddress(owner)
            .storeRef(metadata)
            .storeRef(walletCode)
            .storeRef(v2Extra)
            .endCell();
        
        // StateInit
        const stateInit = {
            code: minterCode,
            data: minterData
        };
        
        // Calcular endereço
        const jettonAddress = contractAddress(0, stateInit);
        
        console.log("📍 Endereço Calculado do Jetton Minter:");
        console.log(`   ${jettonAddress}\n`);
        console.log("🔗 TonScan:", `https://tonscan.org/address/${jettonAddress}\n`);
        
        console.log("💡 Este deveria ser o endereço correto!");
        console.log("   Compare com o endereço retornado pelo script.\n");
        
    } catch (error) {
        console.error("❌ Erro ao calcular endereço:", error.message);
    }
}

// Executar
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔧 JETTON MINTER ADDRESS DEBUGGER");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

debugJettonAddress()
    .then(() => calculateExpectedJettonAddress())
    .then(() => {
        console.log("\n✅ Debug concluído!");
        process.exit(0);
    })
    .catch(error => {
        console.error("\n❌ Erro fatal:", error);
        process.exit(1);
    });
