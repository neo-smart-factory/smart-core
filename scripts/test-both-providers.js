/**
 * Testa ambos providers: Chainstack e TonCenter
 * Para verificar qual está funcionando melhor
 */

const { TonClient, Address } = require('@ton/ton');
const { WalletContractV4 } = require('@ton/ton');
const { mnemonicToPrivateKey } = require('@ton/crypto');
require('dotenv').config();

async function testProvider(name, endpoint) {
    console.log(`\n🧪 Testando: ${name}`);
    console.log(`   Endpoint: ${endpoint}`);
    
    try {
        const startTime = Date.now();
        const client = new TonClient({
            endpoint,
            timeout: 10000
        });
        
        // Teste 1: Get Masterchain Info
        const info = await client.getMasterchainInfo();
        const latency = Date.now() - startTime;
        
        console.log(`   ✅ Sucesso! Latência: ${latency}ms`);
        console.log(`   📊 Last Block: ${info.last.seqno}`);
        
        return { success: true, latency, error: null };
    } catch (error) {
        console.log(`   ❌ Falha: ${error.message}`);
        return { success: false, latency: 0, error: error.message };
    }
}

async function main() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔌 Teste Comparativo de Providers TON');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const providers = [
        {
            name: 'Chainstack Testnet (ND-262-658-290)',
            endpoint: process.env.TON_RPC_URL_TESTNET || 'https://ton-testnet.core.chainstack.com/532306380d3efcbfb82657bfeea32cee/api/v2/jsonRPC'
        },
        {
            name: 'TonCenter Testnet (Público)',
            endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC'
        },
        {
            name: 'TonCenter Testnet (Com API Key)',
            endpoint: process.env.TON_API_URL 
                ? `https://testnet.toncenter.com/api/v2/jsonRPC?api_key=${process.env.TON_API_URL}`
                : 'https://testnet.toncenter.com/api/v2/jsonRPC'
        }
    ];
    
    const results = [];
    
    for (const provider of providers) {
        const result = await testProvider(provider.name, provider.endpoint);
        results.push({ ...provider, ...result });
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Resumo dos Testes');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const successfulProviders = results.filter(r => r.success);
    
    if (successfulProviders.length === 0) {
        console.log('❌ Nenhum provider está funcionando no momento!');
        console.log('\n⚠️  Sugestões:');
        console.log('   1. Verifique sua conexão com a internet');
        console.log('   2. Aguarde alguns minutos e tente novamente');
        console.log('   3. Verifique o status do Chainstack: https://status.chainstack.com/');
        return;
    }
    
    // Ordenar por latência
    successfulProviders.sort((a, b) => a.latency - b.latency);
    
    console.log('✅ Providers Operacionais:\n');
    successfulProviders.forEach((provider, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        console.log(`${medal} ${provider.name}`);
        console.log(`   Latência: ${provider.latency}ms`);
        console.log();
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✨ Recomendação: Use "${successfulProviders[0].name}"`);
    console.log(`   Menor latência: ${successfulProviders[0].latency}ms\n`);
}

main().catch(console.error);
