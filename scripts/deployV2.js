const hre = require("hardhat");

async function main() {
    // Configurações Oficiais para o NEOFLW na Base
    const TOKEN_NAME = "NEOFlowOFF";
    const TOKEN_SYMBOL = "NEOFLW";
    const TOKEN_SUPPLY = "1000000000"; // 1 Bilhão
    const TOKEN_PRICE = "0"; // Mint gratuito inicialmente (ajustável)

    const [deployer] = await hre.ethers.getSigners();

    console.log("🚀 NΞØ SMART FACTORY — Deploy V2 (Canon)");
    console.log("Rede:", hre.network.name);
    console.log("Deployer:", deployer.address);
    console.log("Saldo:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

    console.log("\n📋 Configuração NEOFLW:");
    console.log("  Nome:", TOKEN_NAME);
    console.log("  Símbolo:", TOKEN_SYMBOL);
    console.log("  Supply:", TOKEN_SUPPLY);
    console.log("  Price:", TOKEN_PRICE);

    const supply = hre.ethers.parseUnits(TOKEN_SUPPLY, 18);
    const price = hre.ethers.parseUnits(TOKEN_PRICE, 18);

    const NeoTokenV2 = await hre.ethers.getContractFactory("NeoTokenV2");

    console.log("\n⏳ Forjando contrato na rede...");
    const token = await NeoTokenV2.deploy(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        price,
        supply,
        deployer.address
    );

    await token.waitForDeployment();
    const address = await token.getAddress();

    console.log("\n✅ NEOFLW V2 Deployado com Sucesso!");
    console.log("📍 Endereço:", address);

    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
        console.log("\n⏳ Aguardando 30 segundos para propagação antes da verificação...");
        await new Promise(resolve => setTimeout(resolve, 30000));

        try {
            await hre.run("verify:verify", {
                address: address,
                constructorArguments: [TOKEN_NAME, TOKEN_SYMBOL, price, supply, deployer.address],
            });
            console.log("✅ Contrato verificado no Basescan!");
        } catch (error) {
            console.log("⚠️ Erro na verificação:", error.message);
        }
    }

    // Salvar resultado
    const result = {
        address,
        network: hre.network.name,
        deployer: deployer.address,
        timestamp: new Date().toISOString()
    };
    require('fs').writeFileSync('deploy-v2-info.json', JSON.stringify(result, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
