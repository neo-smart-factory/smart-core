/**
 * NΞØ SMART FACTORY — Bridge Monitor
 * Monitora eventos de lock na Chain A e gera provas para Chain B
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
    signerPrivateKey: process.env.BRIDGE_SIGNER_KEY,
    monitorInterval: 12000, // 12 segundos
    proofStoragePath: './bridge-proofs'
};

// ABI do ManualBridge (eventos)
const BRIDGE_ABI = [
    "event TokenLocked(address indexed token, address indexed from, address indexed to, uint256 amount, uint256 targetChainId, uint256 nonce, uint256 timestamp)"
];

class BridgeMonitor {
    constructor() {
        this.providers = {};
        this.bridges = {};
        this.lastProcessedBlocks = {};

        // Inicializa providers
        for (const [chainName, config] of Object.entries(CONFIG.chains)) {
            this.providers[chainName] = new ethers.JsonRpcProvider(config.rpc);
            this.bridges[chainName] = new ethers.Contract(
                config.bridgeAddress,
                BRIDGE_ABI,
                this.providers[chainName]
            );
            this.lastProcessedBlocks[chainName] = 0;
        }

        // Cria diretório de provas se não existir
        if (!fs.existsSync(CONFIG.proofStoragePath)) {
            fs.mkdirSync(CONFIG.proofStoragePath, { recursive: true });
        }
    }

    /**
     * Inicia monitoramento de todas as chains
     */
    async start() {
        console.log('🌉 Bridge Monitor iniciado...');
        console.log(`Monitorando chains: ${Object.keys(CONFIG.chains).join(', ')}`);

        // Obtém blocos iniciais
        for (const chainName of Object.keys(CONFIG.chains)) {
            const currentBlock = await this.providers[chainName].getBlockNumber();
            this.lastProcessedBlocks[chainName] = currentBlock;
            console.log(`${chainName}: Bloco inicial ${currentBlock}`);
        }

        // Loop de monitoramento
        setInterval(() => this.monitorAllChains(), CONFIG.monitorInterval);
    }

    /**
     * Monitora todas as chains configuradas
     */
    async monitorAllChains() {
        for (const chainName of Object.keys(CONFIG.chains)) {
            try {
                await this.monitorChain(chainName);
            } catch (error) {
                console.error(`❌ Erro ao monitorar ${chainName}:`, error.message);
            }
        }
    }

    /**
     * Monitora uma chain específica
     */
    async monitorChain(chainName) {
        const provider = this.providers[chainName];
        const bridge = this.bridges[chainName];
        const currentBlock = await provider.getBlockNumber();
        const lastBlock = this.lastProcessedBlocks[chainName];

        if (currentBlock <= lastBlock) {
            return; // Nenhum bloco novo
        }

        // Busca eventos de TokenLocked
        const filter = bridge.filters.TokenLocked();
        const events = await bridge.queryFilter(filter, lastBlock + 1, currentBlock);

        if (events.length > 0) {
            console.log(`\n🔍 ${chainName}: ${events.length} evento(s) de lock encontrado(s)`);
        }

        // Processa cada evento
        for (const event of events) {
            await this.processLockEvent(chainName, event);
        }

        this.lastProcessedBlocks[chainName] = currentBlock;
    }

    /**
     * Processa evento de lock e gera prova
     */
    async processLockEvent(sourceChain, event) {
        const { token, from, to, amount, targetChainId, nonce, timestamp } = event.args;
        const txHash = event.transactionHash;

        console.log(`\n📦 Lock detectado:`);
        console.log(`   Chain: ${sourceChain} → Chain ID ${targetChainId}`);
        console.log(`   Token: ${token}`);
        console.log(`   From: ${from}`);
        console.log(`   To: ${to}`);
        console.log(`   Amount: ${ethers.formatEther(amount)}`);
        console.log(`   Tx: ${txHash}`);

        // Gera prova
        const proof = await this.generateProof({
            token,
            from,
            to,
            amount: amount.toString(),
            sourceChainId: CONFIG.chains[sourceChain].chainId,
            targetChainId: Number(targetChainId),
            sourceTxHash: txHash,
            nonce: Number(nonce),
            timestamp: Number(timestamp)
        });

        // Salva prova
        this.saveProof(proof);

        console.log(`✅ Prova gerada e salva: ${proof.bridgeId}`);
    }

    /**
     * Gera prova assinada para bridge
     */
    async generateProof(request) {
        // Gera bridge ID
        const bridgeId = ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(
                ['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'bytes32', 'uint256'],
                [
                    request.token,
                    request.from,
                    request.to,
                    request.amount,
                    request.sourceChainId,
                    request.targetChainId,
                    request.sourceTxHash,
                    request.nonce
                ]
            )
        );

        // Assina com chave privada do signer
        const wallet = new ethers.Wallet(CONFIG.signerPrivateKey);
        const messageHash = ethers.hashMessage(ethers.getBytes(bridgeId));
        const signature = await wallet.signMessage(ethers.getBytes(bridgeId));

        return {
            bridgeId,
            request,
            signature,
            signer: wallet.address,
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Salva prova em arquivo JSON
     */
    saveProof(proof) {
        const filename = `${proof.bridgeId}.json`;
        const filepath = path.join(CONFIG.proofStoragePath, filename);

        fs.writeFileSync(filepath, JSON.stringify(proof, null, 2));
    }
}

// Execução
if (require.main === module) {
    const monitor = new BridgeMonitor();
    monitor.start().catch(console.error);
}

module.exports = BridgeMonitor;
