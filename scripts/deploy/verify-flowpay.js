const hre = require("hardhat");

function requireAddress(name, value) {
  if (!value || !hre.ethers.isAddress(value)) {
    throw new Error(`${name} inválido: ${value || "vazio"}`);
  }
  return value;
}

async function main() {
  const contractAddress = requireAddress(
    "FLOWPAY_CONTRACT_ADDRESS",
    process.env.FLOWPAY_CONTRACT_ADDRESS || process.argv[2]
  );
  const initialOwner = requireAddress(
    "FLOWPAY_INITIAL_OWNER/INITIAL_OWNER",
    process.argv[3] ||
      process.env.FLOWPAY_INITIAL_OWNER ||
      process.env.INITIAL_OWNER
  );

  console.log("Verificando FlowPay...");
  console.log("Network:", hre.network.name);
  console.log("Address:", contractAddress);
  console.log("Initial owner:", initialOwner);

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [initialOwner],
    });
    console.log("Contrato verificado com sucesso.");
  } catch (error) {
    const msg = error?.message || String(error);
    if (msg.toLowerCase().includes("already verified")) {
      console.log("Contrato já estava verificado.");
      return;
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
