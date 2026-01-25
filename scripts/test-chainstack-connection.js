/**
 * Script para testar conexão com Chainstack RPC
 * Valida se o endpoint está respondendo corretamente
 */

const { TonClient } = require('@ton/ton');
require('dotenv').config();

async function testConnection() {
    console.log('🔌 Testando Conexão com Chainstack RPC\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const isTestnet = process.env.TON_NETWORK === 'testnet';
    
    // Endpoints disponíveis
    const endpoints = {
        chainstack_testnet: process.env.TON_RPC_URL_TESTNET,
        chainstack_mainnet: process.env.TON_RPC_URL_MAINNET,
        toncenter_testnet: process.env.TON_RPC_URL_TONCENTER_TESTNET || 'https://testnet.toncenter.com/api/v2/jsonRPC',
        toncenter_mainnet: process.env.TON_RPC_URL_TONCENTER_MAINNET || 'https://toncenter.com/api/v2/jsonRPC'
    };
    
    console.log('📋 Endpoints Configurados:\n');
    console.log('  Chainstack Testnet:', endpoints.chainstack_testnet ? '✅' : '❌');
    console.log('  Chainstack Mainnet:', endpoints.chainstack_mainnet ? '✅' : '❌');
    console.log('  TonCenter Testnet: ✅ (sempre disponível)');
    console.log('  TonCenter Mainnet: ✅ (sempre disponível)');
    console.log();
    
    // Testar endpoint selecionado
    const selectedEndpoint = isTestnet 
        ? (endpoints.chainstack_testnet || endpoints.toncenter_testnet)
        : (endpoints.chainstack_mainnet || endpoints.toncenter_mainnet);
    
    const provider = isTestnet
        ? (endpoints.chainstack_testnet ? 'Chainstack (Testnet)' : 'TonCenter (Testnet)')
        : (endpoints.chainstack_mainnet ? 'Chainstack (Mainnet)' : 'TonCenter (Mainnet)');
    
    console.log('🎯 Testando Endpoint Selecionado:\n');
    console.log(`  Network: ${isTestnet ? 'Testnet' : 'Mainnet'}`);
    console.log(`  Provider: ${provider}`);
    console.log(`  Endpoint: ${selectedEndpoint}`);
    console.log();
    
    try {
        console.log('⏳ Conectando...');
        const startTime = Date.now();
        
        const client = new TonClient({
            endpoint: selectedEndpoint,
            timeout: 10000
        });
        
        // Teste 1: Get Master Chain Info
        console.log('  📡 Teste 1: Obtendo informações da masterchain...');
        const info = await client.getMasterchainInfo();
        const latency = Date.now() - startTime;
        
        console.log(`    ✅ Sucesso! (${latency}ms)`);
        console.log(`    📊 Last Block: ${info.last.seqno}`);
        console.log(`    📊 Workchain: ${info.last.workchain}`);
        console.log();
        
        // Teste 2: Get Balance (endereço de teste)
        console.log('  📡 Teste 2: Consultando saldo de endereço...');
        const testAddress = isTestnet 
            ? 'EQBqdVqFqwdMY985u7Qjl97Hoai0N2XZzNhNkVOE8LBhmxVx' // Nossa wallet
            : 'EQBZJZx3kdROidSZHpI8Nah-2ioylKIt0ww7_gA9qYp0Ux2e'; // Factory
        
        const startTime2 = Date.now();
        const balance = await client.getBalance(testAddress);
        const latency2 = Date.now() - startTime2;
        
        console.log(`    ✅ Sucesso! (${latency2}ms)`);
        console.log(`    💰 Balance: ${Number(balance) / 1e9} TON`);
        console.log();
        
        // Resumo
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('✅ CONEXÃO VALIDADA COM SUCESSO!\n');
        console.log('📊 Estatísticas:');
        console.log(`   Latência Média: ${Math.round((latency + latency2) / 2)}ms`);
        console.log(`   Provider: ${provider}`);
        console.log(`   Status: Operacional ✅`);
        console.log();
        console.log('🚀 Pronto para realizar deploys!');
        
        return true;
        
    } catch (error) {
        console.log(`    ❌ Falha!`);
        console.log();
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.error('❌ ERRO DE CONEXÃO\n');
        console.error('Detalhes:', error.message);
        console.error();
        
        if (error.message.includes('403') || error.message.includes('401')) {
            console.error('⚠️  Possível problema de autenticação:');
            console.error('   - Verifique se o CHAINSTACK_API_KEY está correto no .env');
            console.error('   - Confirme se as URLs do Chainstack estão no formato correto');
            console.error();
        } else if (error.message.includes('timeout')) {
            console.error('⚠️  Timeout de conexão:');
            console.error('   - Verifique sua conexão com a internet');
            console.error('   - Tente novamente em alguns segundos');
            console.error();
        } else if (error.message.includes('ENOTFOUND')) {
            console.error('⚠️  Endpoint não encontrado:');
            console.error('   - Verifique se as URLs estão corretas no .env');
            console.error('   - Confirme se o domínio do Chainstack está acessível');
            console.error();
        }
        
        console.error('💡 Sugestão: O sistema fará fallback para TonCenter em caso de falha.');
        
        return false;
    }
}

testConnection()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
