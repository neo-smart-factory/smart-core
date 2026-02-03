const fs = require('fs');
const path = require('path');

/**
 * Smart Token Manifesto Generator
 * Part of the Standard Enforcement directive.
 */
function generateTokenManifesto(deploymentData) {
    const templatePath = path.join(process.cwd(), 'templates', 'manifest.template.md');
    if (!fs.existsSync(templatePath)) {
        console.error("❌ Manifesto template not found!");
        return;
    }

    let manifesto = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders
    manifesto = manifesto.replace(/{{TOKEN_NAME}}/g, deploymentData.tokenName || "NEO_TOKEN");
    manifesto = manifesto.replace(/{{TOKEN_SYMBOL}}/g, deploymentData.tokenSymbol || "NEO");
    manifesto = manifesto.replace(/{{TOKEN_SUPPLY}}/g, deploymentData.supply || "Unknown");
    manifesto = manifesto.replace(/{{TOKEN_PRICE}}/g, deploymentData.price || "0.0");
    manifesto = manifesto.replace(/{{TOKEN_VISION}}/g, deploymentData.vision || "A sovereign asset on the NEØ Protocol.");
    manifesto = manifesto.replace(/{{TOKEN_VALUES}}/g, deploymentData.values || "Transparency, Immutability, Decentralization.");
    manifesto = manifesto.replace(/{{TOKEN_RITUALS}}/g, deploymentData.rituals || "Algorithmic issuance and community governance.");
    manifesto = manifesto.replace(/{{NEO_INTEGRATION}}/g, "Deployed via NSF Smart Core v0.5.3. Secured by MIO Signature.");

    const outputPath = path.join(process.cwd(), 'deployments', `${deploymentData.tokenSymbol || 'token'}-MANIFESTO.md`);
    fs.writeFileSync(outputPath, manifesto);
    console.log(`✅ Auditable Manifesto created: ${outputPath}`);
}

// Example usage from deploy-info.json if exists
if (require.main === module) {
    const deployInfoPath = path.join(process.cwd(), 'deploy-info.json');
    if (fs.existsSync(deployInfoPath)) {
        const data = JSON.parse(fs.readFileSync(deployInfoPath, 'utf8'));
        generateTokenManifesto(data);
    }
}

module.exports = generateTokenManifesto;
