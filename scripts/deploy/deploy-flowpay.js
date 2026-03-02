const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

function getExplorerUrl(network, address) {
  const explorers = {
    base: `https://basescan.org/address/${address}`,
    baseSepolia: `https://sepolia.basescan.org/address/${address}`,
    polygon: `https://polygonscan.com/address/${address}`,
    amoy: `https://amoy.polygonscan.com/address/${address}`,
  };
  return explorers[network] || address;
}

function requireAddress(name, value) {
  if (!value || !hre.ethers.isAddress(value)) {
    throw new Error(`${name} inválido: ${value || "vazio"}`);
  }
  return value;
}

async function main() {
  console.log("Deploy FlowPay (NEOPAY) iniciado...\n");

  const [deployer] = await hre.ethers.getSigners();
  const initialOwner = requireAddress(
    "FLOWPAY_INITIAL_OWNER/INITIAL_OWNER",
    process.env.FLOWPAY_INITIAL_OWNER ||
      process.env.INITIAL_OWNER ||
      deployer.address
  );

  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("Initial owner:", initialOwner);

  const FlowPay = await hre.ethers.getContractFactory("FlowPay");
  const flowPay = await FlowPay.deploy(initialOwner);
  const deploymentTx = flowPay.deploymentTransaction();
  if (!deploymentTx) {
    throw new Error("Transação de deploy não encontrada.");
  }

  console.log("Deployment tx:", deploymentTx.hash);
  const receipt = await deploymentTx.wait();
  const status = receipt ? Number(receipt.status) : 0;
  if (!receipt || status !== 1) {
    throw new Error(
      `Deploy tx falhou. hash=${deploymentTx.hash} status=${receipt?.status}`
    );
  }
  await flowPay.waitForDeployment();

  const contractAddress =
    receipt.contractAddress || (await flowPay.getAddress());
  const txHash = deploymentTx.hash;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId.toString();
  let code = "0x";
  for (let i = 0; i < 15; i += 1) {
    code = await hre.ethers.provider.getCode(contractAddress);
    if (code && code !== "0x") break;
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
  if (!code || code === "0x") {
    throw new Error(
      `Deploy sem bytecode em ${contractAddress} após retries. Aborting.`
    );
  }

  let tokenName = "FlowPay";
  let tokenSymbol = "NEOPAY";
  try {
    tokenName = await flowPay.name();
    tokenSymbol = await flowPay.symbol();
  } catch (error) {
    console.warn(
      "⚠️ Não foi possível ler name/symbol logo após deploy. Usando fallback padrão."
    );
  }

  const deployInfo = {
    contract: "FlowPay",
    network: hre.network.name,
    chainId,
    address: contractAddress,
    name: tokenName,
    symbol: tokenSymbol,
    initialOwner,
    deployer: deployer.address,
    deploymentTxHash: txHash,
    deployedAt: new Date().toISOString(),
    explorer: getExplorerUrl(hre.network.name, contractAddress),
  };

  const deployDir = path.join(__dirname, "../../deployments");
  fs.mkdirSync(deployDir, { recursive: true });
  const deployFile = path.join(deployDir, `flowpay-${hre.network.name}.json`);
  fs.writeFileSync(deployFile, JSON.stringify(deployInfo, null, 2));

  console.log("\nContrato FlowPay deployado com sucesso.");
  console.log("Address:", contractAddress);
  console.log("Explorer:", deployInfo.explorer);
  console.log("Deploy file:", deployFile);

  console.log("\nPróximo comando:");
  console.log(
    `npx hardhat run scripts/deploy/verify-flowpay.js --network ${hre.network.name} ${contractAddress} ${initialOwner}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
