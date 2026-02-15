// scripts/signMint.js
require('dotenv').config();
const { ethers } = require("ethers");

const privateKey = process.env.SIGNER_PRIVATE_KEY;
const signer = new ethers.Wallet(privateKey);

async function main() {
    const to = process.argv[2];
    const amount = ethers.utils.parseUnits(process.argv[3], 18);
    const nonce = ethers.utils.keccak256(ethers.utils.randomBytes(32));

    const messageHash = ethers.utils.solidityKeccak256(
        ["address", "uint256", "bytes32"],
        [to, amount, nonce]
    );
    const signature = await signer.signMessage(ethers.utils.arrayify(messageHash));

    console.log("To:", to);
    console.log("Amount:", amount.toString());
    console.log("Nonce:", nonce);
    console.log("Signature:", signature);
}

main();
