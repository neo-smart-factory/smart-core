/**
 * NΞØ SMART FACTORY — Mint NeoGenesisNFT
 * Calls mint() on the deployed NeoGenesisNFT contract.
 * PoE must be registered in NeoAttestationRegistry before running.
 *
 * Project:  FlowPay-Core
 * Recipient: nsfactory.eth (0x470a8c640fFC2C16aEB6bE803a948420e2aE8456)
 */

const hre  = require("hardhat");
const fs   = require("fs");
const path = require("path");

// ─── Load NFT address from deployment file ────────────────────────────────────

function getNFTAddress(network) {
  const envAddr = process.env.GENESIS_NFT_ADDRESS;
  if (envAddr) return envAddr;

  const deployFile = path.join(__dirname, `../../deployments/genesis-nft-flowpay-core-${network}.json`);
  if (fs.existsSync(deployFile)) {
    const data = JSON.parse(fs.readFileSync(deployFile, "utf8"));
    return data.address;
  }
  throw new Error(
    `NeoGenesisNFT address not found.\n` +
    `Set GENESIS_NFT_ADDRESS env var or run deploy-genesis-nft.js first.`
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔒 Minting NeoGenesisNFT — FlowPay-Core\n");

  const [signer]  = await hre.ethers.getSigners();
  const balance   = await hre.ethers.provider.getBalance(signer.address);
  const nftAddr   = getNFTAddress(hre.network.name);

  console.log("Signer  :", signer.address);
  console.log("Balance :", hre.ethers.formatEther(balance), "ETH");
  console.log("Network :", hre.network.name);
  console.log("NFT     :", nftAddr);

  // ─── Attach contract ────────────────────────────────────────────────────────

  const nft = await hre.ethers.getContractAt("NeoGenesisNFT", nftAddr, signer);

  // ─── Pre-mint checks ────────────────────────────────────────────────────────

  console.log("\n🔍 Pre-mint checks...");

  const minted     = await nft.minted();
  const owner      = await nft.owner();
  const poeHash    = await nft.poeHash();
  const poeReg     = await nft.poeRegistry();

  console.log("  Already minted :", minted);
  console.log("  Owner          :", owner);
  console.log("  PoE Hash       :", poeHash);
  console.log("  PoE Registry   :", poeReg);

  if (minted) {
    console.log("\n⚠️  Already minted. Nothing to do.");
    process.exit(0);
  }

  if (signer.address.toLowerCase() !== owner.toLowerCase()) {
    console.log("\n❌ ERROR: Signer is not the owner.");
    console.log(`   Owner  : ${owner}`);
    console.log(`   Signer : ${signer.address}`);
    process.exit(1);
  }

  // Verify PoE on-chain before attempting mint
  const registry = await hre.ethers.getContractAt(
    "NeoAttestationRegistry", poeReg, signer
  );
  const [exists, revoked, timestamp] = await registry.verifyAttestation(poeHash);

  console.log("  PoE exists     :", exists);
  console.log("  PoE revoked    :", revoked);
  console.log("  PoE timestamp  :", exists ? new Date(Number(timestamp) * 1000).toISOString() : "—");

  if (!exists) {
    console.log("\n❌ PoE not found in registry. Register attestation first.");
    process.exit(1);
  }
  if (revoked) {
    console.log("\n❌ PoE is revoked. Cannot mint.");
    process.exit(1);
  }

  console.log("\n✅ All checks passed. Minting in 3 seconds...");
  await new Promise(r => setTimeout(r, 3000));

  // ─── Mint ──────────────────────────────────────────────────────────────────

  console.log("\n🎨 Calling mint()...");
  const tx = await nft.mint();
  console.log("  Tx hash:", tx.hash);

  console.log("  Waiting for confirmation...");
  const receipt = await tx.wait();
  console.log("  Confirmed in block:", receipt.blockNumber);

  // ─── Post-mint verification ────────────────────────────────────────────────

  console.log("\n🔍 Post-mint verification...");
  const mintedNow  = await nft.minted();
  const supply     = await nft.totalSupply();
  const tokenOwner = await nft.ownerOf(0n);
  const locked     = await nft.locked(0n);
  const tokenURI   = await nft.tokenURI(0n);

  console.log("  minted      :", mintedNow);
  console.log("  totalSupply :", supply.toString());
  console.log("  ownerOf(0)  :", tokenOwner);
  console.log("  locked(0)   :", locked, "← soulbound ✅");
  console.log("  tokenURI    :", tokenURI);

  // ─── Update deployment file ────────────────────────────────────────────────

  const deployFile = path.join(
    __dirname, `../../deployments/genesis-nft-flowpay-core-${hre.network.name}.json`
  );
  if (fs.existsSync(deployFile)) {
    const data     = JSON.parse(fs.readFileSync(deployFile, "utf8"));
    data.minted    = true;
    data.mintedAt  = new Date().toISOString();
    data.mintTxHash = tx.hash;
    data.mintBlock  = receipt.blockNumber;
    fs.writeFileSync(deployFile, JSON.stringify(data, null, 2));
    console.log("\n📄 Deployment file updated with mint info.");
  }

  console.log("\n🎉 Genesis NFT minted successfully!");
  console.log(`   Token ID : 0`);
  console.log(`   Owner    : ${tokenOwner}`);
  console.log(`   Soulbound: ${locked}`);

  console.log("\n🌐 Explorer:");
  if (hre.network.name === "base") {
    console.log(`   NFT  : https://basescan.org/token/${nftAddr}`);
    console.log(`   Tx   : https://basescan.org/tx/${tx.hash}`);
    console.log(`   OpenSea: https://opensea.io/assets/base/${nftAddr}/0`);
  } else if (hre.network.name === "baseSepolia") {
    console.log(`   NFT  : https://sepolia.basescan.org/token/${nftAddr}`);
    console.log(`   Tx   : https://sepolia.basescan.org/tx/${tx.hash}`);
  }

  console.log("\n---");
  console.log("NEØ SMART FACTORY | NeoGenesisNFT v1.0.0");
  console.log("nsfactory.eth — Expand until silence becomes structure.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });
