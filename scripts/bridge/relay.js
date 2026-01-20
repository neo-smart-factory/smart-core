/**
 * NΞØ SMART FACTORY — Bridge Relay
 * Submete provas assinadas para a chain de destino
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuração
const CONFIG = {
    chains: {
        polygon: {
            rpc: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
            chainId: 137,
            bridgeAddress: process.env.POLYGON_BRIDGE_ADDRESS
        },
        base: {
            rpc: process.env.BASE_RPC || 'https://mainnet.base.org',
            chainId: 8453,
            bridgeAddress: process.env.BASE_BRIDGE_ADDRESS
        }
    },
    relayerPrivateKey: process.env.BRIDGE_RELAYER_KEY,
    proofStoragePath: './bridge-proofs',
    processedProofsPath: './bridge-proofs/processed'
};

// ABI do ManualBridge
const BRIDGE_ABI = [
    "function bridgeWithProof((address token, address from, address to, uint256 amount, uint256 sourceChainId, uint256 targetChainId, bytes32 sourceTxHash, uint256 nonce, uint256 timestamp) request, bytes[] signatures) external",
    "function isBridgeProcessed((address token, address from, address to, uint256 amount, uint256 sourceChainId, uint256 targetChainId, bytes32 sourceTxHash, uint256 nonce, uint256 timestamp) request) external view returns (bool)"
];

class BridgeRelay {
    constructor() {
        this.providers = {};
        this.bridges = {};
        this.relayer = null;

        // Inicializa providers e contratos
        for (const [chainName, config] of Object.entries(CONFIG.chains)) {
            this.providers[chainName] = new ethers.JsonRpcProvider(config.rpc);
            this.bridges[chainName] = new ethers.Contract(
                config.bridgeAddress,
                BRIDGE_ABI,
                this.providers[chainName]
            );
        }

        // Inicializa relayer
        this.relayer = new ethers.Wallet(CONFIG.relayerPrivateKey);

        // Cria diretório de provas processadas
        if (!fs.existsSync(CONFIG.processedProofsPath)) {
            fs.mkdirSync(CONFIG.processedProofsPath, { recursive: true });
        }
    }

    /**
     * Processa todas as provas pendentes
     */
    async processAllProofs() {
        console.log('🚀 Iniciando relay de provas...\n');

        // Lista arquivos de prova
        const proofFiles = fs.readdirSync(CONFIG.proofStoragePath)
            .filter(f => f.endsWith('.json') && !f.startsWith('.'));

        console.log(`📋 ${proofFiles.length} prova(s) encontrada(s)\n`);

        for (const file of proofFiles) {
            const proofPath = path.join(CONFIG.proofStoragePath, file);

            try {
                await this.relayProof(proofPath);
            } catch (error) {
                console.error(`❌ Erro ao processar ${file}:`, error.message);
            }
        }

        console.log('\n✅ Relay concluído');
    }

    /**
     * Faz relay de uma prova específica
     */
    async relayProof(proofPath) {
        // Carrega prova
        const proofData = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
        const { request, signatures } = proofData;

        if (!signatures || signatures.length === 0) {
            console.log(`⏭️  Pulando ${path.basename(proofPath)}: Sem assinaturas`);
            return;
        }

        console.log(`\n🔄 Processando prova:`);
        console.log(`   Bridge ID: ${proofData.bridgeId}`);
        console.log(`   Target Chain: ${request.targetChainId}`);
        console.log(`   Assinaturas: ${signatures.length}`);

        // Identifica chain de destino
        const targetChain = this.getChainName(request.targetChainId);
        if (!targetChain) {
            throw new Error(`Chain ${request.targetChainId} não suportada`);
        }

        // Conecta relayer à chain de destino
        const provider = this.providers[targetChain];
        const bridge = this.bridges[targetChain].connect(this.relayer.connect(provider));

        // Verifica se já foi processada
        const isProcessed = await bridge.isBridgeProcessed(request);
        if (isProcessed) {
            console.log(`   ⏭️  Já processada, movendo para processed/`);
            this.moveToProcessed(proofPath);
            return;
        }

        // Estima gas
        try {
            const gasEstimate = await bridge.bridgeWithProof.estimateGas(request, signatures);
            console.log(`   ⛽ Gas estimado: ${gasEstimate.toString()}`);
        } catch (error) {
            throw new Error(`Falha na estimativa de gas: ${error.message}`);
        }

        // Submete transação
        console.log(`   📤 Submetendo transação...`);
        const tx = await bridge.bridgeWithProof(request, signatures);
        console.log(`   🔗 Tx Hash: ${tx.hash}`);

        // Aguarda confirmação
        console.log(`   ⏳ Aguardando confirmação...`);
        const receipt = await tx.wait();

        if (receipt.status === 1) {
            console.log(`   ✅ Bridge concluída! Block: ${receipt.blockNumber}`);
            this.moveToProcessed(proofPath);
        } else {
            throw new Error('Transação falhou');
        }
    }

    /**
     * Identifica nome da chain pelo ID
     */
    getChainName(chainId) {
        for (const [name, config] of Object.entries(CONFIG.chains)) {
            if (config.chainId === chainId) {
                return name;
            }
        }
        return null;
    }

    /**
     * Move prova para diretório de processadas
     */
    moveToProcessed(proofPath) {
        const filename = path.basename(proofPath);
        const newPath = path.join(CONFIG.processedProofsPath, filename);
        fs.renameSync(proofPath, newPath);
    }

    /**
     * Relay de uma prova específica por bridge ID
     */
    async relayByBridgeId(bridgeId) {
        const proofPath = path.join(CONFIG.proofStoragePath, `${bridgeId}.json`);

        if (!fs.existsSync(proofPath)) {
            throw new Error(`Prova não encontrada: ${bridgeId}`);
        }

        await this.relayProof(proofPath);
    }
}

// CLI
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    const relay = new BridgeRelay();

    if (command === 'all') {
        // node relay.js all
        relay.processAllProofs().catch(console.error);

    } else if (command === 'single') {
        // node relay.js single <bridge-id>
        const bridgeId = args[1];

        if (!bridgeId) {
            console.error('Uso: node relay.js single <bridge-id>');
            process.exit(1);
        }

        relay.relayByBridgeId(bridgeId).catch(console.error);

    } else {
        console.log('Comandos disponíveis:');
        console.log('  all                  - Processa todas as provas pendentes');
        console.log('  single <bridge-id>   - Processa uma prova específica');
    }
}

module.exports = BridgeRelay;
