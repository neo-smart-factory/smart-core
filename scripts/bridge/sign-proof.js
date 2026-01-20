/**
 * NΞØ SMART FACTORY — Bridge Proof Signer
 * Assina provas de bridge com múltiplos signers (multi-sig)
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Assina uma prova de bridge
 * @param {Object} request - Bridge request
 * @param {string} privateKey - Chave privada do signer
 * @returns {Object} Prova assinada
 */
async function signProof(request, privateKey) {
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

    // Assina
    const wallet = new ethers.Wallet(privateKey);
    const signature = await wallet.signMessage(ethers.getBytes(bridgeId));

    return {
        bridgeId,
        signature,
        signer: wallet.address,
        timestamp: new Date().toISOString()
    };
}

/**
 * Assina com múltiplos signers
 * @param {Object} request - Bridge request
 * @param {string[]} privateKeys - Array de chaves privadas
 * @returns {Object} Prova com múltiplas assinaturas
 */
async function signWithMultipleSigner(request, privateKeys) {
    const signatures = [];
    const signers = [];

    for (const key of privateKeys) {
        const proof = await signProof(request, key);
        signatures.push(proof.signature);
        signers.push(proof.signer);
    }

    return {
        bridgeId: (await signProof(request, privateKeys[0])).bridgeId,
        request,
        signatures,
        signers,
        createdAt: new Date().toISOString()
    };
}

/**
 * Carrega prova de arquivo e adiciona assinatura
 * @param {string} proofPath - Caminho do arquivo de prova
 * @param {string} privateKey - Chave privada do signer
 */
async function addSignatureToProof(proofPath, privateKey) {
    // Carrega prova existente
    const proofData = JSON.parse(fs.readFileSync(proofPath, 'utf8'));

    // Assina
    const newSignature = await signProof(proofData.request, privateKey);

    // Adiciona assinatura
    if (!proofData.signatures) {
        proofData.signatures = [];
        proofData.signers = [];
    }

    proofData.signatures.push(newSignature.signature);
    proofData.signers.push(newSignature.signer);
    proofData.updatedAt = new Date().toISOString();

    // Salva
    fs.writeFileSync(proofPath, JSON.stringify(proofData, null, 2));

    console.log(`✅ Assinatura adicionada por ${newSignature.signer}`);
    console.log(`   Total de assinaturas: ${proofData.signatures.length}`);

    return proofData;
}

/**
 * Verifica assinatura
 * @param {string} bridgeId - ID da bridge
 * @param {string} signature - Assinatura
 * @returns {string} Endereço do signer
 */
function verifySignature(bridgeId, signature) {
    const messageHash = ethers.hashMessage(ethers.getBytes(bridgeId));
    const recoveredAddress = ethers.recoverAddress(messageHash, signature);
    return recoveredAddress;
}

// CLI
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'sign') {
        // node sign-proof.js sign <proof-file> <private-key>
        const proofPath = args[1];
        const privateKey = args[2] || process.env.BRIDGE_SIGNER_KEY;

        if (!proofPath || !privateKey) {
            console.error('Uso: node sign-proof.js sign <proof-file> <private-key>');
            process.exit(1);
        }

        addSignatureToProof(proofPath, privateKey)
            .then(() => console.log('✅ Prova assinada com sucesso'))
            .catch(console.error);

    } else if (command === 'verify') {
        // node sign-proof.js verify <bridge-id> <signature>
        const bridgeId = args[1];
        const signature = args[2];

        if (!bridgeId || !signature) {
            console.error('Uso: node sign-proof.js verify <bridge-id> <signature>');
            process.exit(1);
        }

        const signer = verifySignature(bridgeId, signature);
        console.log(`✅ Assinatura válida de: ${signer}`);

    } else {
        console.log('Comandos disponíveis:');
        console.log('  sign <proof-file> <private-key>  - Assina uma prova');
        console.log('  verify <bridge-id> <signature>   - Verifica uma assinatura');
    }
}

module.exports = {
    signProof,
    signWithMultipleSigner,
    addSignatureToProof,
    verifySignature
};
