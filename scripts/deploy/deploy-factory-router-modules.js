const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { NonceManager } = require("ethers");

function explorerUrl(network, address) {
  const explorers = {
    base: `https://basescan.org/address/${address}`,
    baseSepolia: `https://sepolia.basescan.org/address/${address}`,
    polygon: `https://polygonscan.com/address/${address}`,
    amoy: `https://amoy.polygonscan.com/address/${address}`,
  };
  return explorers[network] || address;
}

function parseCreationFee(value) {
  if (!value || value.trim() === "") return hre.ethers.parseEther("0.01");
  return hre.ethers.parseEther(value.trim());
}

async function waitTx(tx, label) {
  console.log(`${label} tx:`, tx.hash);
  const receipt = await tx.wait();
  if (!receipt || Number(receipt.status) !== 1) {
    throw new Error(`${label} failed. tx=${tx.hash} status=${receipt?.status}`);
  }
  return receipt;
}

async function main() {
  const [rawSigner] = await hre.ethers.getSigners();
  const signer = new NonceManager(rawSigner);
  const network = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId.toString();
  const creationFee = parseCreationFee(process.env.CREATION_FEE);

  console.log("Deploy/wire NeoSmartFactory modules");
  console.log("Network:", network);
  console.log("ChainId:", chainId);
  console.log("Signer:", rawSigner.address);
  console.log("Creation fee (ETH):", hre.ethers.formatEther(creationFee));

  const configuredFactory =
    process.env.FACTORY_ROUTER_ADDRESS ||
    process.env.NEO_SMART_FACTORY_ADDRESS ||
    process.env.SMART_FACTORY_ADDRESS ||
    "";

  let factoryAddress = configuredFactory;
  let factory;
  let routerDeploymentTxHash = null;

  if (factoryAddress && hre.ethers.isAddress(factoryAddress)) {
    console.log("Using existing NeoSmartFactory:", factoryAddress);
    factory = await hre.ethers.getContractAt(
      "NeoSmartFactory",
      factoryAddress,
      signer
    );
  } else {
    console.log("No existing factory configured. Deploying NeoSmartFactory...");
    const Factory = await hre.ethers.getContractFactory(
      "NeoSmartFactory",
      signer
    );
    const deployedFactory = await Factory.deploy(creationFee);
    const deployTx = deployedFactory.deploymentTransaction();
    if (!deployTx) throw new Error("Factory deployment tx not found.");
    await waitTx(deployTx, "deploy NeoSmartFactory");
    await deployedFactory.waitForDeployment();
    factoryAddress = await deployedFactory.getAddress();
    routerDeploymentTxHash = deployTx.hash;
    factory = deployedFactory;
    console.log("NeoSmartFactory:", factoryAddress);
  }

  const ProtocolDeployer = await hre.ethers.getContractFactory(
    "FactoryProtocolDeployer",
    signer
  );
  const AssetDeployer = await hre.ethers.getContractFactory(
    "FactoryAssetDeployer",
    signer
  );

  const protocolDeployer = await ProtocolDeployer.deploy(factoryAddress);
  const protocolDeployTx = protocolDeployer.deploymentTransaction();
  if (!protocolDeployTx)
    throw new Error("FactoryProtocolDeployer tx not found.");
  await waitTx(protocolDeployTx, "deploy FactoryProtocolDeployer");
  await protocolDeployer.waitForDeployment();
  const protocolDeployerAddress = await protocolDeployer.getAddress();

  const assetDeployer = await AssetDeployer.deploy(factoryAddress);
  const assetDeployTx = assetDeployer.deploymentTransaction();
  if (!assetDeployTx) throw new Error("FactoryAssetDeployer tx not found.");
  await waitTx(assetDeployTx, "deploy FactoryAssetDeployer");
  await assetDeployer.waitForDeployment();
  const assetDeployerAddress = await assetDeployer.getAddress();

  const wireTx = await factory.setDeployers(
    protocolDeployerAddress,
    assetDeployerAddress
  );
  await waitTx(wireTx, "setDeployers");

  const owner = await factory.owner();
  const guardian = await factory.guardian();
  const wiredProtocolDeployer = await factory.protocolDeployer();
  const wiredAssetDeployer = await factory.assetDeployer();
  const wired =
    wiredProtocolDeployer.toLowerCase() ===
      protocolDeployerAddress.toLowerCase() &&
    wiredAssetDeployer.toLowerCase() === assetDeployerAddress.toLowerCase();

  if (!wired) {
    throw new Error("Wiring verification failed after setDeployers.");
  }

  const output = {
    contract: "NeoSmartFactory",
    network,
    chainId,
    factoryAddress,
    creationFeeWei: creationFee.toString(),
    creationFeeEth: hre.ethers.formatEther(creationFee),
    protocolDeployerAddress,
    assetDeployerAddress,
    owner,
    guardian,
    wiredAt: new Date().toISOString(),
    tx: {
      factoryDeploy: routerDeploymentTxHash,
      protocolDeployerDeploy: protocolDeployTx.hash,
      assetDeployerDeploy: assetDeployTx.hash,
      setDeployers: wireTx.hash,
    },
    explorer: {
      factory: explorerUrl(network, factoryAddress),
      protocolDeployer: explorerUrl(network, protocolDeployerAddress),
      assetDeployer: explorerUrl(network, assetDeployerAddress),
    },
  };

  const deployDir = path.join(__dirname, "../../deployments");
  fs.mkdirSync(deployDir, { recursive: true });
  const outfile = path.join(deployDir, `factory-router-${network}.json`);
  fs.writeFileSync(outfile, JSON.stringify(output, null, 2));

  console.log("\nCompleted.");
  console.log("Factory:", factoryAddress);
  console.log("ProtocolDeployer:", protocolDeployerAddress);
  console.log("AssetDeployer:", assetDeployerAddress);
  console.log("setDeployers tx:", wireTx.hash);
  console.log("Saved:", outfile);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
