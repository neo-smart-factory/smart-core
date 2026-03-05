#!/usr/bin/env node
/**
 * Smart RPC Selector com Retry Automático
 * Tenta todos os provedores em ordem de prioridade até encontrar um operacional
 */

const { TonClient } = require('@ton/ton');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Configuração de provedores por ordem de preferência
 */
function getRpcProviders(isTestnet) {
  if (isTestnet) {
    return [
      {
        name: 'OnFinality Testnet',
        endpoint: process.env.TON_RPC_URL_ONFINALITY_TESTNET,
        priority: 1,
        timeout: 5000,
      },
      {
        name: 'TonCenter Testnet',
        endpoint: process.env.TON_RPC_URL_TONCENTER_TESTNET || 'https://testnet.toncenter.com/api/v2/jsonRPC',
        priority: 2,
        timeout: 10000,
      },
      {
        name: 'Chainstack Testnet',
        endpoint: process.env.TON_RPC_URL_CHAINSTACK_TESTNET,
        priority: 3,
        timeout: 5000,
      },
    ];
  } else {
    return [
      {
        name: 'OnFinality Mainnet',
        endpoint: process.env.TON_RPC_URL_ONFINALITY_MAINNET,
        priority: 1,
        timeout: 5000,
      },
      {
        name: 'Chainstack Mainnet',
        endpoint: process.env.TON_RPC_URL_CHAINSTACK_MAINNET,
        priority: 2,
        timeout: 5000,
      },
      {
        name: 'TonCenter Mainnet',
        endpoint: process.env.TON_RPC_URL_TONCENTER_MAINNET || 'https://toncenter.com/api/v2/jsonRPC',
        priority: 3,
        timeout: 10000,
      },
    ];
  }
}

/**
 * Testa se um provedor está operacional
 */
async function testProvider(provider, silent = false) {
  if (!provider.endpoint) {
    return { success: false, error: 'Endpoint not configured' };
  }

  try {
    const startTime = Date.now();
    const client = new TonClient({ 
      endpoint: provider.endpoint,
      timeout: provider.timeout,
    });
    
    await client.getMasterchainInfo();
    const latency = Date.now() - startTime;
    
    if (!silent) {
      console.log(`✅ ${provider.name}: OK (${latency}ms)`);
    }
    
    return { success: true, latency, client };
  } catch (error) {
    if (!silent) {
      const errorMsg = error.message.includes('503') ? 'Service Unavailable (503)' :
                       error.message.includes('404') ? 'Not Found (404)' :
                       error.message.includes('timeout') ? 'Timeout' :
                       error.message;
      console.log(`❌ ${provider.name}: ${errorMsg}`);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Seleciona o melhor provedor RPC disponível
 */
async function selectBestRpcProvider(isTestnet = true, silent = false) {
  const providers = getRpcProviders(isTestnet);
  
  if (!silent) {
    console.log(`\n🔍 Testando provedores RPC (${isTestnet ? 'Testnet' : 'Mainnet'})...\n`);
  }
  
  // Testar todos os provedores configurados
  for (const provider of providers) {
    if (!provider.endpoint) continue;
    
    const result = await testProvider(provider, silent);
    
    if (result.success) {
      if (!silent) {
        console.log(`\n🎯 Provedor selecionado: ${provider.name}`);
        console.log(`   Latência: ${result.latency}ms\n`);
      }
      
      return {
        name: provider.name,
        endpoint: provider.endpoint,
        client: result.client,
        latency: result.latency,
      };
    }
  }
  
  // Se chegou aqui, nenhum provedor está disponível
  throw new Error('❌ CRÍTICO: Nenhum provedor RPC está disponível! Verifique sua conexão ou tente novamente mais tarde.');
}

/**
 * Criar cliente RPC com fallback automático
 */
async function createRpcClient(isTestnet = true, silent = false) {
  try {
    const selected = await selectBestRpcProvider(isTestnet, silent);
    return selected;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

// Exportar para uso em outros scripts
module.exports = {
  selectBestRpcProvider,
  createRpcClient,
  testProvider,
  getRpcProviders,
};

// Se executado diretamente, fazer teste
if (require.main === module) {
  const isTestnet = process.env.TON_NETWORK === 'testnet';
  
  createRpcClient(isTestnet)
    .then(result => {
      console.log('✅ Cliente RPC criado com sucesso!');
      console.log(`   Provedor: ${result.name}`);
      console.log(`   Endpoint: ${result.endpoint}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Falha ao criar cliente RPC');
      process.exit(1);
    });
}
