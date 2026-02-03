const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { mnemonicToPrivateKey, sign } = require('@ton/crypto');

/**
 * MIO (Manifest Immutability Object) Vault Utility
 * Part of the NEØ Logic Vault Directive
 */
class MIOVault {
    constructor() {
        this.version = "1.0.0";
    }

    /**
     * Generates a hash of a file (bytecode, cell, etc.)
     * @param {string} filePath 
     * @returns {string} hex hash
     */
    calculateHash(filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }

    /**
     * Signs the hash using TON deployer key
     * @param {string} hash 
     * @param {Buffer} secretKey 
     * @returns {string} base64 signature
     */
    async signHashTON(hash, secretKey) {
        const signature = sign(Buffer.from(hash, 'hex'), secretKey);
        return signature.toString('base64');
    }

    /**
     * Creates a MIO Manifesto
     */
    async createManifesto(artifactPath, network, deployerAddress, secretKey) {
        const hash = this.calculateHash(artifactPath);
        const signature = await this.signHashTON(hash, secretKey);
        
        const manifesto = {
            mio_version: this.version,
            timestamp: new Date().toISOString(),
            network,
            deployer: deployerAddress,
            artifact: path.basename(artifactPath),
            logic_hash: hash,
            mio_signature: signature,
            status: "IMMUTABLE_PULSE"
        };

        return manifesto;
    }

    /**
     * Saves the manifesto to the deployments folder
     */
    saveManifesto(manifesto, name) {
        const dir = path.join(process.cwd(), 'deployments', manifesto.network);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const filePath = path.join(dir, `${name}.mio.json`);
        fs.writeFileSync(filePath, JSON.stringify(manifesto, null, 2));
        console.log(`✅ MIO Manifesto saved to: ${filePath}`);
        return filePath;
    }
}

module.exports = new MIOVault();
