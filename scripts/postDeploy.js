const hre = require("hardhat");
const fs = require("fs");

/**
 * Script pós-deploy para salvar informações e gerar relatório
 */
async function main() {
  const tokenAddress = process.argv[2];
  
  if (!tokenAddress) {
    console.error("❌ Endereço do contrato necessário");
    process.exit(1);
  }

  const token = await hre.ethers.getContractAt("IgnitionToken", tokenAddress);
  
  const info = {
    address: tokenAddress,
    network: hre.network.name,
    name: await token.name(),
    symbol: await token.symbol(),
    price: hre.ethers.formatEther(await token.PRICE()),
    supply: hre.ethers.formatEther(await token.INITIAL_SUPPLY()),
    mintEnabled: await token.mintEnabled(),
    owner: await token.owner(),
    deployedAt: new Date().toISOString(),
    explorer: getExplorerUrl(hre.network.name, tokenAddress)
  };

  // Salvar em arquivo
  fs.writeFileSync(
    `deploy-${hre.network.name}-${Date.now()}.json`,
    JSON.stringify(info, null, 2)
  );

  console.log("✅ Informações do deploy salvas:");
  console.log(JSON.stringify(info, null, 2));
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

