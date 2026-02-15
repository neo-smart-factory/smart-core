// scripts/verify.js
require("dotenv").config({ path: __dirname + "/../.env" });
const { run } = require("hardhat");

async function main() {
  const contractAddress = "0xF408D8b596a0B3b68AdD59fbd3827718fd1f03F1";
  const constructorArgs = [process.env.SIGNER_ADDRESS];

  await run("verify:verify", {
    address: contractAddress,
    constructorArguments: constructorArgs,
    contract: "contracts/USDGO.sol:USDGO",
  });
}

main().catch((error) => {
  console.error("💥 Erro na verificação:", error);
  process.exit(1);
});
