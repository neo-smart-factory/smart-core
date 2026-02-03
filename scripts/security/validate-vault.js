const fs = require('fs');
const path = require('path');
const mioVault = require('./mio-vault');

/**
 * Logic Vault Integrity Checker
 * Validates that artifacts match their MIO signatures.
 */
async function validateVault() {
    console.log("🛡️  NΞØ Logic Vault - Integrity Check\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const deploymentsDir = path.join(process.cwd(), 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
        console.log("ℹ️  No deployments found to validate.");
        return;
    }

    const networks = fs.readdirSync(deploymentsDir);
    let allValid = true;

    for (const network of networks) {
        const networkDir = path.join(deploymentsDir, network);
        if (!fs.statSync(networkDir).isDirectory()) continue;

        const files = fs.readdirSync(networkDir).filter(f => f.endsWith('.mio.json'));

        for (const file of files) {
            const manifestoPath = path.join(networkDir, file);
            const manifesto = JSON.parse(fs.readFileSync(manifestoPath, 'utf8'));

            console.log(`🔍 Checking ${manifesto.artifact} [${network}]...`);

            // Re-calculate hash
            // Try different possible artifact locations
            let artifactPath = path.join(process.cwd(), 'artifacts', 'ton', manifesto.artifact);

            if (!fs.existsSync(artifactPath)) {
                // Try EVM hardhat location (IgnitionToken.sol/IgnitionToken.json)
                const evmPath = path.join(process.cwd(), 'artifacts/contracts/IgnitionToken.sol', manifesto.artifact.replace('.sol', '.json'));
                if (fs.existsSync(evmPath)) {
                    artifactPath = evmPath;
                } else {
                    // Try direct artifact name in contracts
                    const directEvmPath = path.join(process.cwd(), 'artifacts/contracts', manifesto.artifact);
                    if (fs.existsSync(directEvmPath)) {
                        artifactPath = directEvmPath;
                    }
                }
            }

            if (!fs.existsSync(artifactPath)) {
                console.error(`❌ Artifact missing: ${manifesto.artifact}`);
                allValid = false;
                continue;
            }

            const currentHash = mioVault.calculateHash(artifactPath);

            if (currentHash === manifesto.logic_hash) {
                console.log(`✅ Integrity Verified: ${manifesto.logic_hash.substring(0, 16)}...`);
            } else {
                console.error(`🚨 DISCREPANCY DETECTED!`);
                console.error(`   Stored Hash:  ${manifesto.logic_hash}`);
                console.error(`   Current Hash: ${currentHash}`);
                allValid = false;
            }
        }
    }

    if (allValid) {
        console.log("\n✨ Logic Vault is SECURE. All pulses are immutable.");
    } else {
        console.error("\n❌ Logic Vault COMPROMISED or out of sync.");
        process.exit(1);
    }
}

validateVault();
