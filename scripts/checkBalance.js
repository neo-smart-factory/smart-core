const hre = require("hardhat");

async function main() {
    const tokenAddress = "0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B";
    const user = "0x470a8c640fFC2C16aEB6bE803a948420e2aE8456";

    const token = await hre.ethers.getContractAt("NeoTokenV2", tokenAddress);
    const balance = await token.balanceOf(user);

    console.log("Token Address:", tokenAddress);
    console.log("User Address:", user);
    console.log("Balance:", hre.ethers.formatEther(balance), "NEOFLW");
}

main().catch(console.error);
