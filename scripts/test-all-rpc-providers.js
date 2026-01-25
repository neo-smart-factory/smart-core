#!/usr/bin/env node
/**
 * Script para testar conectividade de TODOS os provedores RPC
 * OnFinality, Chainstack e TonCenter
 */

const { TonClient } = require('@ton/ton');
const dotenv = require('dotenv');

dotenv.config();

const providers = [
  {
    name: 'OnFinality Testnet',
    endpoint: process.env.TON_RPC_URL_ONFINALITY_TESTNET,
    priority: 1,
    type: 'Professional (OnFinality) - Primary',
    notes: 'Melhor performance, rate limits altos',
  },
  {
    name: 'TonCenter Testnet',
    endpoint: process.env.TON_RPC_URL_TONCENTER_TESTNET,
    priority: 2,
    type: 'Public (TonCenter) - Fallback',
    notes: 'Estável, rate limits baixos',
  },
  {
    name: 'Chainstack Testnet',
    endpoint: process.env.TON_RPC_URL_CHAINSTACK_TESTNET, 
    priority: 3,
    type: 'Professional (Chainstack) - Backup',
    notes: 'Dedicado, 25 req/s',
  },
];

async function testProvider(provider) {
  const result = {
    name: provider.name,
    endpoint: provider.endpoint,
    type: provider.type,
    priority: provider.priority,
    status: 'unknown',
    latency: null,
    error: null,
  };

  if (!provider.endpoint) {
    result.status = 'not_configured';
    result.error = 'Endpoint not configured';
    return result;
  }

  try {
    const startTime = Date.now();
    
    // Criar cliente
    const client = new TonClient({ endpoint: provider.endpoint });
    
    // Testar getMasterchainInfo (mais leve que getBalance)
    await client.getMasterchainInfo();
    
    const endTime = Date.now();
    result.latency = endTime - startTime;
    result.status = 'operational';
    
  } catch (error) {
    result.status = 'error';
    result.error = error.message;
    
    // Identificar tipo de erro
    if (error.message.includes('403')) {
      result.error = 'Forbidden (403) - API key issue';
    } else if (error.message.includes('404')) {
      result.error = 'Not Found (404) - Invalid endpoint';
    } else if (error.message.includes('503')) {
      result.error = 'Service Unavailable (503) - Node down';
    } else if (error.message.includes('ENOTFOUND')) {
      result.error = 'DNS Error - Host not found';
    } else if (error.message.includes('timeout')) {
      result.error = 'Timeout - Node not responding';
    }
  }

  return result;
}

async function testAllProviders() {
  console.log('\n🔍 Testando Conectividade de TODOS os Provedores RPC\n');
  console.log('═'.repeat(70));

  const results = [];

  // Testar todos em paralelo para velocidade
  const promises = providers.map(provider => testProvider(provider));
  const testResults = await Promise.all(promises);

  console.log('\n📊 Resultados:\n');

  testResults.forEach(result => {
    results.push(result);
    
    const statusEmoji = result.status === 'operational' ? '✅' : 
                       result.status === 'not_configured' ? '⚙️' : '❌';
    
    console.log(`${statusEmoji} ${result.name}`);
    console.log(`   Tipo: ${result.type}`);
    console.log(`   Endpoint: ${result.endpoint || 'Not configured'}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    
    if (result.latency) {
      console.log(`   Latência: ${result.latency}ms`);
    }
    
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
    
    console.log('');
  });

  console.log('═'.repeat(70));

  // Encontrar o melhor provedor operacional
  const operationalProviders = results
    .filter(r => r.status === 'operational')
    .sort((a, b) => {
      // Prioridade primeiro
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Depois latência
      return a.latency - b.latency;
    });

  if (operationalProviders.length === 0) {
    console.log('\n❌ CRÍTICO: Nenhum provedor RPC está operacional!\n');
    console.log('Soluções:');
    console.log('1. Verificar conexão com internet');
    console.log('2. Verificar se as API keys estão corretas no .env');
    console.log('3. Tentar novamente em alguns minutos');
    process.exit(1);
  }

  console.log('\n🎯 Recomendação de Uso:\n');
  
  operationalProviders.forEach((provider, index) => {
    const label = index === 0 ? '🥇 PRIMÁRIO' : 
                  index === 1 ? '🥈 BACKUP' : 
                  '🥉 FALLBACK';
    
    console.log(`${label}: ${provider.name}`);
    console.log(`   Latência: ${provider.latency}ms`);
    console.log(`   Tipo: ${provider.type}`);
    console.log('');
  });

  // Estatísticas
  console.log('═'.repeat(70));
  console.log('\n📈 Estatísticas:\n');
  console.log(`Total de provedores testados: ${results.length}`);
  console.log(`Operacionais: ${operationalProviders.length}`);
  console.log(`Com erro: ${results.filter(r => r.status === 'error').length}`);
  console.log(`Não configurados: ${results.filter(r => r.status === 'not_configured').length}`);

  if (operationalProviders.length > 0) {
    const avgLatency = operationalProviders.reduce((sum, p) => sum + p.latency, 0) / operationalProviders.length;
    console.log(`Latência média: ${Math.round(avgLatency)}ms`);
  }

  console.log('\n✅ Teste concluído!\n');
  
  // Retornar o melhor provedor
  return operationalProviders[0];
}

// Executar
testAllProviders()
  .then(bestProvider => {
    if (bestProvider) {
      console.log(`🚀 Melhor provedor selecionado: ${bestProvider.name}`);
      console.log(`   Use este endpoint: ${bestProvider.endpoint}\n`);
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('\n❌ Erro ao testar provedores:', error);
    process.exit(1);
  });
