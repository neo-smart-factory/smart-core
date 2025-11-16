const hre = require("hardhat");

async function main() {
  const {
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_SUPPLY,
    TOKEN_PRICE
  } = process.env;

  // Validar variáveis de ambiente
  if (!TOKEN_NAME || !TOKEN_SYMBOL || !TOKEN_SUPPLY || !TOKEN_PRICE) {
    throw new Error("Missing required environment variables: TOKEN_NAME, TOKEN_SYMBOL, TOKEN_SUPPLY, TOKEN_PRICE");
  }

  const [deployer] = await hre.ethers.getSigners();
  
  console.log("🚀 NΞØ SMART FACTORY — Deploy v0.5.1");
  console.log("Deployando com a conta:", deployer.address);
  console.log("Saldo da conta:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH/MATIC");
  console.log("\n📋 Configuração do Token:");
  console.log("  Nome:", TOKEN_NAME);
  console.log("  Símbolo:", TOKEN_SYMBOL);
  console.log("  Supply:", TOKEN_SUPPLY);
  console.log("  Preço:", TOKEN_PRICE, "ETH/MATIC");

  // Converter valores para wei
  const supply = hre.ethers.parseEther(TOKEN_SUPPLY);
  const price = hre.ethers.parseEther(TOKEN_PRICE);

  const Token = await hre.ethers.getContractFactory("IgnitionToken");

  console.log("\n⏳ Deployando contrato...");
  const token = await Token.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    price,
    supply
  );

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log("\n✅ Token deployado com sucesso!");
  console.log("📍 Endereço:", tokenAddress);
  console.log("🌐 Network:", hre.network.name);
  console.log("🔗 Explorer:", getExplorerUrl(hre.network.name, tokenAddress));

  // Verificar em redes de teste
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Aguardando confirmações antes de verificar...");
    await token.deploymentTransaction().wait(5);

    try {
      await hre.run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [TOKEN_NAME, TOKEN_SYMBOL, price, supply],
      });
      console.log("✅ Contrato verificado no explorer");
    } catch (error) {
      console.log("⚠️ Erro na verificação:", error.message);
    }
  }

  // Salvar informações do deploy
  const deployInfo = {
    tokenAddress,
    network: hre.network.name,
    deployer: deployer.address,
    tokenName: TOKEN_NAME,
    tokenSymbol: TOKEN_SYMBOL,
    supply: TOKEN_SUPPLY,
    price: TOKEN_PRICE,
    deployedAt: new Date().toISOString()
  };

  console.log("\n📄 Informações do deploy salvas em deploy-info.json");
  require('fs').writeFileSync(
    'deploy-info.json',
    JSON.stringify(deployInfo, null, 2)
  );
}

function getExplorerUrl(network, address) {
  const explorers = {
    polygon: `https://polygonscan.com/address/${address}`,
    amoy: `https://amoy.polygonscan.com/address/${address}`,
  };
  return explorers[network] || `#${address}`;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

