import { ref } from 'vue';
import { beginCell, toNano, Address, Dictionary } from '@ton/ton';
import { sha256_sync } from '@ton/crypto'; // Requires @ton/crypto
import { useTon } from './useTon';

/**
 * NΞØ Protocol - TON Jetton Deployment (NeoJettonV1)
 * 
 * Adapter para deploy de Jettons na rede TON seguindo o padrão TEP-64.
 * Adaptado do NeoTokenV2 para a arquitetura assíncrona da TON.
 */

// Treasury do protocolo NΞØ
export const PROTOCOL_TREASURY = import.meta.env.VITE_PROTOCOL_TREASURY_ADDRESS || '';

// Endereço do Factory de Deploy (Deve ser configurado após deploy do contrato Factory)
// TODO: Atualizar com o endereço real do contrato NeoJettonFactory na mainnet/testnet
export const JETTON_DEPLOYER_ADDRESS = Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c');

// Op-codes
const OP_DEPLOY_JETTON = 0x61caf729; // TODO: Verificar OpCode correto do seu contrato Factory
const OP_TRANSFER = 0xf8a7ea5;
const OP_INTERNAL_TRANSFER = 0x178d4519;
const OP_EXCESSES = 0xd53276db;

/**
 * Constrói o dicionário de metadados on-chain de acordo com TEP-64.
 * @param {Object} metadata 
 * @returns {Cell}
 */
function buildOnchainMetadata(metadata) {
    const dict = Dictionary.empty(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell());

    // Helper para codificar string snake-case
    const toSnakeCase = (str) => {
        const cell = beginCell();
        cell.storeUint(0x00, 8); // Snake prefix
        cell.storeStringTail(str);
        return cell.endCell();
    };

    // Campos padrão TEP-64
    const keys = ['name', 'symbol', 'description', 'image', 'decimals'];

    for (const key of keys) {
        if (metadata[key] !== undefined) {
            const keyHash = sha256_sync(key);
            let value = metadata[key].toString();
            dict.set(keyHash, toSnakeCase(value));
        }
    }

    return beginCell()
        .storeUint(0x00, 8) // On-chain content layout prefix
        .storeDict(dict)
        .endCell();
}

export function useJettonFactory() {
    const { initTon, tonAddress } = useTon();
    const isDeploying = ref(false);

    /**
     * Deploy a new Jetton (Token) on TON
     * @param {Object} metadata - { name, symbol, description, image, decimals }
     */
    const deployJetton = async (metadata) => {
        if (!tonAddress.value) {
            throw new Error('Wallet not connected');
        }

        // CRITICAL VALIDATION: Sanitize and validate all inputs
        if (!metadata?.name || typeof metadata.name !== 'string' || metadata.name.trim().length === 0) {
            throw new Error('Token name is required');
        }
        if (!metadata?.symbol || typeof metadata.symbol !== 'string' || metadata.symbol.trim().length === 0) {
            throw new Error('Token symbol is required');
        }
        if (metadata.name.length > 64) { // TEP-64 recomenda limites razoáveis
            throw new Error('Token name too long (max 64 characters)');
        }
        if (metadata.symbol.length > 16) {
            throw new Error('Token symbol too long (max 16 characters)');
        }

        let decimals = 9; // Default TON decimals
        if (metadata.decimals !== undefined) {
            decimals = parseInt(metadata.decimals);
            if (isNaN(decimals) || decimals < 0 || decimals > 255) {
                throw new Error('Invalid decimals');
            }
        } else {
            metadata.decimals = decimals; // Ensure it's in metadata for the builder
        }

        isDeploying.value = true;
        try {
            // 1. Prepare Metadata Cell according to TEP-64
            const metadataCell = buildOnchainMetadata(metadata);

            // 2. Build deployment payload for Jetton Deployer Factory
            const deployPayload = beginCell()
                .storeUint(OP_DEPLOY_JETTON, 32)
                .storeUint(0, 64) // Query ID
                .storeAddress(Address.parse(tonAddress.value)) // Owner address
                .storeRef(metadataCell) // Metadata TEP-64 compliant
                .endCell();

            // 3. Build the transaction
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 300,
                messages: [
                    {
                        address: JETTON_DEPLOYER_ADDRESS.toString(),
                        amount: toNano('0.25').toString(), // 0.25 TON fee
                        payload: deployPayload.toBoc().toString('base64'),
                    },
                ],
            };

            console.log('NΞØ Jetton Deploy Config:', {
                factory: JETTON_DEPLOYER_ADDRESS.toString(),
                owner: tonAddress.value,
                metadata
            });

            // 4. Send via TON Connect
            const tonConnectUI = initTon();
            if (!tonConnectUI) {
                throw new Error('TON Connect not initialized');
            }

            const result = await tonConnectUI.sendTransaction(transaction);

            console.log('NΞØ Jetton Deployment Sent:', result);
            return result;
        } catch (error) {
            console.error('NΞØ Jetton Deployment Failed:', error);
            throw error;
        } finally {
            isDeploying.value = false;
        }
    };

    return {
        isDeploying,
        deployJetton,
    };
}
