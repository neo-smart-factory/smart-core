/**
 * Disable Public Mint - NEOFLW Contracts
 * Script para desabilitar o mint público nos contratos NEOFLW
 */

const hre = require("hardhat");

async function main() {
    console.log("🔒 Disabling Public Mint on NEOFLW Contracts\n");

    const [owner] = await hre.ethers.getSigners();
    console.log("Owner:", owner.address);

    // Contratos NEOFLW
    const contracts = [
        {
            name: "NEOFLW #1 (Genesis)",
            address: "0xF4Fbd30e3Ea69457adD30F7C3D6fde25f7D8Db26"
        },
        {
            name: "NEOFLW #2",
            address: "0x31E5C82BCe01f1ec2e5561C52173753C8ABF7736"
        }
    ];

    const ABI = [
        "function publicMintEnabled() view returns (bool)",
        "function setPublicMintStatus(bool _enabled) external"
    ];

    for (const contract of contracts) {
        console.log(`\n📍 ${contract.name}`);
        console.log(`   Address: ${contract.address}`);

        const token = new hre.ethers.Contract(contract.address, ABI, owner);

        // Verificar status atual
        const currentStatus = await token.publicMintEnabled();
        console.log(`   Current Status: ${currentStatus ? "ENABLED ✅" : "DISABLED 🔒"}`);

        if (currentStatus) {
            console.log(`   ⏳ Disabling public mint...`);

            const tx = await token.setPublicMintStatus(false);
            console.log(`   Transaction: ${tx.hash}`);

            await tx.wait();
            console.log(`   ✅ Public mint DISABLED`);
        } else {
            console.log(`   ℹ️  Already disabled`);
        }
    }

    console.log("\n✅ All contracts updated!");
    console.log("\n📋 Next Steps:");
    console.log("1. Create distributor wallet");
    console.log("2. Configure bridge minter");
    console.log("3. Implement MiniApp backend");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
