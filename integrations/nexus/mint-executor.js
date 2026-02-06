
const hre = require("hardhat");
require('dotenv').config();

/**
 * Executes a minting transaction on the target blockchain.
 * Uses the private key configured in Hardhat for the network.
 */
async function executeMint({ targetAddress, amount, tokenId, refTransactionId }) {
    console.log(`[EXECUTOR] 🪙 Starting mint execution for ${targetAddress}...`);

    try {
        // 1. Get Contract Instance
        // These addresses should ideally come from a deployment registry or env
        const CONTRACT_ADDRESSES = {
            'NEOFLW': process.env.NEOFLW_TOKEN_ADDRESS || "0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B",
        };

        const tokenAddress = CONTRACT_ADDRESSES[tokenId];
        if (!tokenAddress) {
            throw new Error(`Unsupported tokenId: ${tokenId}`);
        }

        const [signer] = await hre.ethers.getSigners();
        console.log(`[EXECUTOR] 👤 Signing with: ${signer.address}`);

        const token = await hre.ethers.getContractAt("NeoTokenV2", tokenAddress);

        // 2. Execute bridgeMint
        // Note: The signer must be authorized as bridgeMinter in the contract
        const amountWei = hre.ethers.parseUnits(amount.toString(), 18);

        console.log(`[EXECUTOR] ⏳ Sending transaction: bridgeMint(${targetAddress}, ${amountWei})...`);
        const tx = await token.bridgeMint(targetAddress, amountWei);

        console.log(`[EXECUTOR] 📝 Transaction Sent: ${tx.hash}`);
        const receipt = await tx.wait();

        console.log(`[EXECUTOR] ✅ Transaction Confirmed in block ${receipt.blockNumber}`);

        return {
            success: true,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            explorerUrl: `${process.env.EXPLORER_URL}/tx/${receipt.hash}`
        };

    } catch (error) {
        console.error('[EXECUTOR] ❌ Execution failed:', error.message);
        throw error;
    }
}

module.exports = { executeMint };
