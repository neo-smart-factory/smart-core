const hre = require("hardhat");

async function main() {
    const tokenAddress = "0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B";
    const [deployer] = await hre.ethers.getSigners();

    console.log("🪙 Testing Public Mint for 0.003 ETH...");
    console.log("Target Contract:", tokenAddress);
    console.log("Minter Account:", deployer.address);

    const token = await hre.ethers.getContractAt("NeoTokenV2", tokenAddress);

    const tx = await token.publicMint({
        value: hre.ethers.parseEther("0.003")
    });

    console.log("⏳ Waiting for transaction confirmation...");
    const receipt = await tx.wait();

    console.log("✅ Mint Successful!");
    console.log("Transaction Hash:", receipt.hash);

    const balance = await token.balanceOf(deployer.address);
    console.log("New Balance:", hre.ethers.formatEther(balance), "NEOFLW");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
