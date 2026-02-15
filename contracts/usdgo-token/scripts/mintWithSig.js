// scripts/mintWithSig.js
require('dotenv').config();
const { ethers } = require("ethers");
const contractJson = require("../artifacts/contracts/USDGO.sol/USDGO.json");

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
const contractAddress = process.env.CONTRACT_ADDRESS;

const usdgo = new ethers.Contract(contractAddress, contractJson.abi, wallet);

async function main() {
    const to = process.argv[2];
    const amount = ethers.utils.parseUnits(process.argv[3], 18);
    const nonce = process.argv[4];
    const signature = process.argv[5];

    const tx = await usdgo.mintWithSignature(to, amount, nonce, signature);
    await tx.wait();

    console.log("Mint executado:", tx.hash);
}

main();
