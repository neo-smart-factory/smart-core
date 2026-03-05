/* eslint-disable */
require('dotenv').config();
const { TonClient, Address, Cell } = require('@ton/ton');
const fs = require('fs');
const path = require('path');

async function debugFactory() {
    console.log("🔍 DEBUG DETALHADO DA FACTORY\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const apiKey = process.env.TON_API_URL || '';
    const endpoint = apiKey
        ? `https://toncenter.com/api/v2/jsonRPC?api_key=${apiKey}`
        : 'https://toncenter.com/api/v2/jsonRPC';

    const client = new TonClient({ endpoint, timeout: 30000 });

    const FACTORY_ADDRESS = process.env.VITE_NEO_JETTON_FACTORY_ADDRESS;

    console.log(`🏭 Factory: ${FACTORY_ADDRESS}\n`);

    try {
        const factoryAddr = Address.parse(FACTORY_ADDRESS);

        // Buscar TODAS as transações
        console.log("📡 Buscando transações detalhadas...\n");

        const transactions = await client.getTransactions(factoryAddr, { limit: 5 });

        for (let i = 0; i < transactions.length; i++) {
            const tx = transactions[i];
            const time = new Date(tx.now * 1000).toLocaleString('pt-BR');
            const hash = tx.hash().toString('hex');

            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📋 TX #${i + 1} - ${time}`);
            console.log(`   Hash: ${hash}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

            // Mensagem de entrada
            if (tx.inMessage && tx.inMessage.info.type === 'internal') {
                const inMsg = tx.inMessage;
                const source = inMsg.info.src;
                const value = Number(inMsg.info.value.coins) / 1e9;
                const bounced = inMsg.info.bounced || false;

                console.log(`📥 IN Message:`);
                console.log(`   From: ${source.toString()}`);
                console.log(`   Value: ${value} TON`);
                console.log(`   Bounced: ${bounced}`);

                // Verificar se tem body
                if (inMsg.body) {
                    const body = inMsg.body.beginParse();
                    if (!body.remainingBits === 0) {
                        try {
                            const op = body.loadUint(32);
                            console.log(`   OP Code: 0x${op.toString(16)}`);

                            // OP deploy_jetton = 0x61caf729
                            if (op === 0x61caf729) {
                                console.log(`   ✅ OP = deploy_jetton`);
                            }
                        } catch (e) {
                            console.log(`   Body parse error: ${e.message}`);
                        }
                    }
                }
                console.log('');
            }

            // Compute Phase
            if (tx.description.type === 'generic') {
                const compute = tx.description.computePhase;
                if (compute.type === 'vm') {
                    console.log(`💻 Compute Phase:`);
                    console.log(`   Success: ${compute.success}`);
                    console.log(`   Exit Code: ${compute.exitCode}`);
                    console.log(`   Gas Used: ${compute.gasUsed}`);

                    if (!compute.success) {
                        console.log(`   ❌ VM FAILED!`);
                    }
                    console.log('');
                }
            }

            // Action Phase
            if (tx.description.type === 'generic' && tx.description.actionPhase) {
                const action = tx.description.actionPhase;
                console.log(`🎬 Action Phase:`);
                console.log(`   Success: ${action.success}`);
                console.log(`   Result Code: ${action.resultCode}`);
                console.log(`   Total Actions: ${action.totalActions}`);
                console.log(`   Valid Actions: ${action.valid || 0}`);
                console.log('');
            }

            // Mensagens de saída
            if (tx.outMessages.size > 0) {
                console.log(`📤 OUT Messages (${tx.outMessages.size}):\n`);

                let msgIdx = 0;
                for (const [key, msg] of tx.outMessages) {
                    if (msg.info.type === 'internal') {
                        const dest = msg.info.dest;
                        const value = Number(msg.info.value.coins) / 1e9;
                        const bounce = msg.info.bounce;
                        const bounced = msg.info.bounced || false;

                        console.log(`   ${msgIdx + 1}. ${dest.toString()}`);
                        console.log(`      Value: ${value} TON`);
                        console.log(`      Bounce: ${bounce} | Bounced: ${bounced}`);

                        if (msg.init) {
                            console.log(`      ✅ StateInit presente - NOVO CONTRATO!`);
                            console.log(`      🎯 ESTE É O JETTON MINTER!`);
                        }

                        if (bounced) {
                            console.log(`      ⚠️  BOUNCE BACK - Deploy falhou!`);
                        }

                        console.log('');
                        msgIdx++;
                    }
                }
            }

            console.log('\n');
        }

    } catch (error) {
        console.error("\n❌ Erro:");
        console.error(error.message);
        if (error.stack) {
            console.error(error.stack);
        }
    }
}

debugFactory();
