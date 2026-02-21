const hre = require("hardhat");

async function main() {
  const tokenAddress = process.argv[2];
  
  if (!tokenAddress) {
    console.error("❌ Endereço do contrato necessário");
    console.log("Uso: npx hardhat run scripts/verify.js --network polygon <CONTRACT_ADDRESS>");
    process.exit(1);
  }

  const {
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_SUPPLY,
    TOKEN_PRICE
  } = process.env;

  if (!TOKEN_NAME || !TOKEN_SYMBOL || !TOKEN_SUPPLY || !TOKEN_PRICE) {
    throw new Error("Missing required environment variables");
  }

  const supply = hre.ethers.parseEther(TOKEN_SUPPLY);
  const price = hre.ethers.parseEther(TOKEN_PRICE);

  console.log("🔍 Verificando contrato:", tokenAddress);
  console.log("🌐 Network:", hre.network.name);

  try {
    await hre.run("verify:verify", {
      address: tokenAddress,
      constructorArguments: [TOKEN_NAME, TOKEN_SYMBOL, price, supply],
    });
    console.log("✅ Contrato verificado com sucesso!");
  } catch (error) {
    console.error("❌ Erro na verificação:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

