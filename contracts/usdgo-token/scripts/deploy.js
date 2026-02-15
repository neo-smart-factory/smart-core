require("dotenv").config({ path: __dirname + "/../.env" });
const { ethers } = require("hardhat");

async function main() {
  const signer = process.env.SIGNER_ADDRESS;

  if (!signer || !/^0x[a-fA-F0-9]{40}$/.test(signer)) {
    throw new Error("❌ SIGNER_ADDRESS inválido ou ausente.");
  }

  console.log("🚀 Usando signer do .env:", signer);

  const USDGO = await ethers.getContractFactory("USDGO");
const contract = await USDGO.deploy(process.env.SIGNER_ADDRESS);
await contract.waitForDeployment();
console.log("✅ Deploy tx hash:", contract.deploymentTransaction().hash);
console.log("✅ Contrato implantado no endereço:", await contract.getAddress());



  const address = await contract.getAddress();
  console.log("✅ Contrato deployado com sucesso em:", address);
}

main().catch((error) => {
  console.error("💥 Erro no deploy:", error);
  process.exitCode = 1;
});
