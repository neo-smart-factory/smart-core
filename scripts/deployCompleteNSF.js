/**
 * NSF Complete System Deployment Script
 * 
 * Deploys all 4 layers of the NSF coordination protocol:
 * Layer 1: NSFToken
 * Layer 2: FactoryQualification
 * Layer 3: NSFGovernance + TimelockController
 * Layer 4: EmergencyGuardian
 */

const { ethers } = require("hardhat");

async function main() {
    console.log("\n🚀 Starting NSF Complete System Deployment\n");
    console.log("=" .repeat(60));
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    console.log("=" .repeat(60));
    
    // ========================================================================
    // DEPLOYMENT PARAMETERS
    // ========================================================================
    
    const INITIAL_DISTRIBUTOR = process.env.DISTRIBUTOR_ADDRESS || deployer.address;
    const MIN_BALANCE_FOR_ACCESS = ethers.parseEther("1000"); // 1,000 NSF
    const TIMELOCK_DELAY = 48 * 60 * 60; // 48 hours
    
    // Guardian addresses (use environment variables or defaults for testing)
    const GUARDIANS = [
        process.env.GUARDIAN_1 || deployer.address,
        process.env.GUARDIAN_2 || deployer.address,
        process.env.GUARDIAN_3 || deployer.address,
        process.env.GUARDIAN_4 || deployer.address,
        process.env.GUARDIAN_5 || deployer.address,
        process.env.GUARDIAN_6 || deployer.address,
        process.env.GUARDIAN_7 || deployer.address,
    ];
    
    console.log("\n📋 Deployment Parameters:");
    console.log("-".repeat(60));
    console.log("Initial Distributor:", INITIAL_DISTRIBUTOR);
    console.log("Min Balance:", ethers.formatEther(MIN_BALANCE_FOR_ACCESS), "NSF");
    console.log("Timelock Delay:", TIMELOCK_DELAY / 3600, "hours");
    console.log("Guardians:", GUARDIANS.length, "addresses");
    console.log("-".repeat(60));
    
    // ========================================================================
    // DEPLOY COMPLETE SYSTEM
    // ========================================================================
    
    console.log("\n⚙️  Deploying CompleteNSFDeployer...");
    
    const CompleteNSFDeployer = await ethers.getContractFactory("CompleteNSFDeployer");
    const deployer_contract = await CompleteNSFDeployer.deploy(
        INITIAL_DISTRIBUTOR,
        GUARDIANS,
        MIN_BALANCE_FOR_ACCESS,
        TIMELOCK_DELAY
    );
    
    await deployer_contract.waitForDeployment();
    const deployerAddress = await deployer_contract.getAddress();
    
    console.log("✅ CompleteNSFDeployer deployed at:", deployerAddress);
    
    // ========================================================================
    // GET DEPLOYED ADDRESSES
    // ========================================================================
    
    console.log("\n📍 Getting deployed contract addresses...");
    
    const [
        tokenAddress,
        timelockAddress,
        governanceAddress,
        qualificationAddress,
        guardianAddress
    ] = await deployer_contract.getDeployedAddresses();
    
    console.log("\n🎯 Deployed Contracts:");
    console.log("=" .repeat(60));
    console.log("Layer 1 - NSFToken:             ", tokenAddress);
    console.log("Layer 3 - TimelockController:   ", timelockAddress);
    console.log("Layer 3 - NSFGovernance:        ", governanceAddress);
    console.log("Layer 2 - FactoryQualification: ", qualificationAddress);
    console.log("Layer 4 - EmergencyGuardian:    ", guardianAddress);
    console.log("=" .repeat(60));
    
    // ========================================================================
    // VERIFY SYSTEM STATUS
    // ========================================================================
    
    console.log("\n🔍 Verifying system status...");
    
    const [
        tokenSupply,
        minBalance,
        qualificationPaused,
        guardiansPaused,
        timelockDelayActual,
        votingDelay,
        votingPeriod,
        proposalThreshold
    ] = await deployer_contract.getSystemStatus();
    
    console.log("\n📊 System Status:");
    console.log("-".repeat(60));
    console.log("Token Supply:           ", ethers.formatEther(tokenSupply), "NSF");
    console.log("Min Balance:            ", ethers.formatEther(minBalance), "NSF");
    console.log("Qualification Paused:   ", qualificationPaused);
    console.log("Guardian System Paused: ", guardiansPaused);
    console.log("Timelock Delay:         ", Number(timelockDelayActual) / 3600, "hours");
    console.log("Voting Delay:           ", Number(votingDelay) / 86400, "days");
    console.log("Voting Period:          ", Number(votingPeriod) / 86400, "days");
    console.log("Proposal Threshold:     ", ethers.formatEther(proposalThreshold), "NSF");
    console.log("-".repeat(60));
    
    // ========================================================================
    // VERIFY SYSTEM INTEGRITY
    // ========================================================================
    
    console.log("\n🔐 Verifying system integrity...");
    
    const [isValid, issues] = await deployer_contract.verifySystemIntegrity();
    
    if (isValid) {
        console.log("✅ System integrity check PASSED");
    } else {
        console.log("❌ System integrity check FAILED");
        console.log("Issues found:");
        for (const issue of issues) {
            console.log("  - ", issue);
        }
    }
    
    // ========================================================================
    // GOVERNANCE INFO
    // ========================================================================
    
    console.log("\n🗳️  Governance Information:");
    console.log("-".repeat(60));
    
    const [
        govToken,
        govVotingDelay,
        govVotingPeriod,
        govProposalThreshold,
        govQuorumPercentage
    ] = await deployer_contract.getGovernanceInfo();
    
    console.log("Governance Token:       ", govToken);
    console.log("Voting Delay:           ", Number(govVotingDelay) / 86400, "days");
    console.log("Voting Period:          ", Number(govVotingPeriod) / 86400, "days");
    console.log("Proposal Threshold:     ", ethers.formatEther(govProposalThreshold), "NSF");
    console.log("Quorum Percentage:      ", govQuorumPercentage, "%");
    console.log("-".repeat(60));
    
    // ========================================================================
    // POST-DEPLOYMENT INSTRUCTIONS
    // ========================================================================
    
    console.log("\n📝 Post-Deployment Instructions:");
    console.log("=" .repeat(60));
    console.log("1. Distribute NSF tokens from:", INITIAL_DISTRIBUTOR);
    console.log("2. Add votable functions via timelock proposals");
    console.log("3. Users must delegate voting power to participate");
    console.log("4. Test emergency pause with guardians");
    console.log("5. Verify all contract verifications on block explorer");
    console.log("=" .repeat(60));
    
    // ========================================================================
    // VERIFICATION COMMANDS
    // ========================================================================
    
    console.log("\n🔎 Verification Commands:");
    console.log("-".repeat(60));
    console.log("npx hardhat verify --network <network>", deployerAddress, 
                INITIAL_DISTRIBUTOR, 
                "[" + GUARDIANS.join(",") + "]",
                MIN_BALANCE_FOR_ACCESS.toString(),
                TIMELOCK_DELAY.toString());
    console.log("-".repeat(60));
    
    // ========================================================================
    // SAVE DEPLOYMENT INFO
    // ========================================================================
    
    const deploymentInfo = {
        network: (await ethers.provider.getNetwork()).name,
        chainId: (await ethers.provider.getNetwork()).chainId,
        deployer: deployerAddress,
        timestamp: new Date().toISOString(),
        contracts: {
            nsfToken: tokenAddress,
            timelock: timelockAddress,
            governance: governanceAddress,
            factoryQualification: qualificationAddress,
            emergencyGuardian: guardianAddress
        },
        parameters: {
            initialDistributor: INITIAL_DISTRIBUTOR,
            minBalanceForAccess: MIN_BALANCE_FOR_ACCESS.toString(),
            timelockDelay: TIMELOCK_DELAY,
            guardians: GUARDIANS
        }
    };
    
    const fs = require("fs");
    const path = require("path");
    
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const filename = `nsf-deployment-${Date.now()}.json`;
    fs.writeFileSync(
        path.join(deploymentsDir, filename),
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n💾 Deployment info saved to:", filename);
    console.log("\n✅ Deployment Complete!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
