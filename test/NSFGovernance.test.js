const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("NSFGovernance - Layer 3 Protocol Governance", function () {
    let nsfToken;
    let timelock;
    let governance;
    let factoryQualification;
    let owner, proposer, voter1, voter2, voter3, executor;
    
    const VOTING_DELAY = 1 * 24 * 60 * 60; // 1 day
    const VOTING_PERIOD = 3 * 24 * 60 * 60; // 3 days
    const TIMELOCK_DELAY = 2 * 24 * 60 * 60; // 2 days
    const PROPOSAL_THRESHOLD = ethers.parseEther("100000"); // 100k NSF
    const MIN_BALANCE = ethers.parseEther("1000"); // 1k NSF for qualification
    
    beforeEach(async function () {
        [owner, proposer, voter1, voter2, voter3, executor] = await ethers.getSigners();
        
        // Deploy NSFToken with ERC20Votes
        const NSFToken = await ethers.getContractFactory("NSFToken");
        nsfToken = await NSFToken.deploy(owner.address);
        await nsfToken.waitForDeployment();
        
        // Deploy TimelockController
        const TimelockController = await ethers.getContractFactory("TimelockController");
        timelock = await TimelockController.deploy(
            TIMELOCK_DELAY,
            [owner.address], // proposers
            [owner.address], // executors  
            owner.address // admin
        );
        await timelock.waitForDeployment();
        
        // Deploy FactoryQualification (for testing governance)
        const FactoryQualification = await ethers.getContractFactory("FactoryQualification");
        factoryQualification = await FactoryQualification.deploy();
        await factoryQualification.waitForDeployment();
        
        await factoryQualification.initialize(
            await nsfToken.getAddress(),
            MIN_BALANCE,
            owner.address
        );
        
        // Deploy NSFGovernance
        const NSFGovernance = await ethers.getContractFactory("NSFGovernance");
        governance = await NSFGovernance.deploy(
            await nsfToken.getAddress(),
            await timelock.getAddress()
        );
        await governance.waitForDeployment();
        
        // Grant governance executor role on timelock
        const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
        await timelock.grantRole(EXECUTOR_ROLE, await governance.getAddress());
        
        // Distribute tokens to voters
        await nsfToken.transfer(proposer.address, PROPOSAL_THRESHOLD);
        await nsfToken.transfer(voter1.address, ethers.parseEther("1000000")); // 1M NSF
        await nsfToken.transfer(voter2.address, ethers.parseEther("1000000")); // 1M NSF
        await nsfToken.transfer(voter3.address, ethers.parseEther("500000")); // 500k NSF
        
        // Delegate voting power
        await nsfToken.connect(proposer).delegate(proposer.address);
        await nsfToken.connect(voter1).delegate(voter1.address);
        await nsfToken.connect(voter2).delegate(voter2.address);
        await nsfToken.connect(voter3).delegate(voter3.address);
        
        // Mine a block to activate delegated votes
        await ethers.provider.send("evm_mine");
    });
    
    describe("Deployment", function () {
        it("Should deploy with correct parameters", async function () {
            const [votingDelay, votingPeriod, proposalThreshold, quorumPercentage] = 
                await governance.getGovernanceParameters();
            
            expect(votingDelay).to.equal(VOTING_DELAY);
            expect(votingPeriod).to.equal(VOTING_PERIOD);
            expect(proposalThreshold).to.equal(PROPOSAL_THRESHOLD);
            expect(quorumPercentage).to.equal(10); // 10%
        });
        
        it("Should have correct token and timelock", async function () {
            expect(await governance.token()).to.equal(await nsfToken.getAddress());
            expect(await governance.timelock()).to.equal(await timelock.getAddress());
        });
    });
    
    describe("Votable Functions Whitelist", function () {
        it("Should start with no votable functions", async function () {
            // Try a random selector
            const randomSelector = "0x12345678";
            const [isVotable, name] = await governance.isVotable(randomSelector);
            expect(isVotable).to.be.false;
            expect(name).to.equal("");
        });
        
        it("Should allow timelock to add votable functions", async function () {
            const selector = factoryQualification.interface.getFunction("setMinBalance").selector;
            const functionName = "setMinBalance(uint256)";
            
            // Encode the call to add votable function
            const addVotableCall = governance.interface.encodeFunctionData(
                "addVotableFunction",
                [selector, functionName]
            );
            
            // Schedule through timelock
            await timelock.schedule(
                await governance.getAddress(),
                0,
                addVotableCall,
                ethers.ZeroHash,
                ethers.ZeroHash,
                TIMELOCK_DELAY
            );
            
            // Fast forward time
            await time.increase(TIMELOCK_DELAY);
            
            // Execute
            await timelock.execute(
                await governance.getAddress(),
                0,
                addVotableCall,
                ethers.ZeroHash,
                ethers.ZeroHash
            );
            
            // Verify function is now votable
            const [isVotable, name] = await governance.isVotable(selector);
            expect(isVotable).to.be.true;
            expect(name).to.equal(functionName);
        });
        
        it("Should emit event when votable function added", async function () {
            const selector = factoryQualification.interface.getFunction("setMinBalance").selector;
            const functionName = "setMinBalance(uint256)";
            
            const addVotableCall = governance.interface.encodeFunctionData(
                "addVotableFunction",
                [selector, functionName]
            );
            
            await timelock.schedule(
                await governance.getAddress(),
                0,
                addVotableCall,
                ethers.ZeroHash,
                ethers.ZeroHash,
                TIMELOCK_DELAY
            );
            
            await time.increase(TIMELOCK_DELAY);
            
            await expect(
                timelock.execute(
                    await governance.getAddress(),
                    0,
                    addVotableCall,
                    ethers.ZeroHash,
                    ethers.ZeroHash
                )
            ).to.emit(governance, "VotableFunctionAdded")
             .withArgs(selector, functionName);
        });
    });
    
    describe("Proposal Creation and Validation", function () {
        beforeEach(async function () {
            // Add setMinBalance as votable function
            const selector = factoryQualification.interface.getFunction("setMinBalance").selector;
            const addVotableCall = governance.interface.encodeFunctionData(
                "addVotableFunction",
                [selector, "setMinBalance(uint256)"]
            );
            
            await timelock.schedule(
                await governance.getAddress(),
                0,
                addVotableCall,
                ethers.ZeroHash,
                ethers.ZeroHash,
                TIMELOCK_DELAY
            );
            await time.increase(TIMELOCK_DELAY);
            await timelock.execute(
                await governance.getAddress(),
                0,
                addVotableCall,
                ethers.ZeroHash,
                ethers.ZeroHash
            );
        });
        
        it("Should allow proposal with whitelisted function", async function () {
            const newMinBalance = ethers.parseEther("2000");
            const calldata = factoryQualification.interface.encodeFunctionData(
                "setMinBalance",
                [newMinBalance]
            );
            
            await expect(
                governance.connect(proposer).propose(
                    [await factoryQualification.getAddress()],
                    [0],
                    [calldata],
                    "Increase minimum balance to 2000 NSF"
                )
            ).to.not.be.reverted;
        });
        
        it("Should reject proposal with non-whitelisted function", async function () {
            // Try to call pause() which is not whitelisted
            const calldata = factoryQualification.interface.encodeFunctionData("pause");
            
            await expect(
                governance.connect(proposer).propose(
                    [await factoryQualification.getAddress()],
                    [0],
                    [calldata],
                    "Try to pause (should fail)"
                )
            ).to.be.revertedWith("Function not votable");
        });
        
        it("Should require minimum proposal threshold", async function () {
            const smallHolder = voter3; // Has less than threshold after delegation
            const calldata = factoryQualification.interface.encodeFunctionData(
                "setMinBalance",
                [ethers.parseEther("2000")]
            );
            
            // This should fail due to insufficient voting power
            await expect(
                governance.connect(smallHolder).propose(
                    [await factoryQualification.getAddress()],
                    [0],
                    [calldata],
                    "Should fail - insufficient voting power"
                )
            ).to.be.reverted;
        });
    });
    
    describe("Voting and Execution", function () {
        let proposalId;
        
        beforeEach(async function () {
            // Add setMinBalance as votable function
            const selector = factoryQualification.interface.getFunction("setMinBalance").selector;
            const addVotableCall = governance.interface.encodeFunctionData(
                "addVotableFunction",
                [selector, "setMinBalance(uint256)"]
            );
            
            await timelock.schedule(
                await governance.getAddress(),
                0,
                addVotableCall,
                ethers.ZeroHash,
                ethers.ZeroHash,
                TIMELOCK_DELAY
            );
            await time.increase(TIMELOCK_DELAY);
            await timelock.execute(
                await governance.getAddress(),
                0,
                addVotableCall,
                ethers.ZeroHash,
                ethers.ZeroHash
            );
            
            // Create a proposal
            const newMinBalance = ethers.parseEther("2000");
            const calldata = factoryQualification.interface.encodeFunctionData(
                "setMinBalance",
                [newMinBalance]
            );
            
            const tx = await governance.connect(proposer).propose(
                [await factoryQualification.getAddress()],
                [0],
                [calldata],
                "Increase minimum balance to 2000 NSF"
            );
            
            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    return governance.interface.parseLog(log).name === "ProposalCreated";
                } catch {
                    return false;
                }
            });
            proposalId = governance.interface.parseLog(event).args.proposalId;
        });
        
        it("Should allow voting after delay", async function () {
            // Fast forward past voting delay
            await time.increase(VOTING_DELAY + 1);
            
            // Vote
            await expect(
                governance.connect(voter1).castVote(proposalId, 1) // 1 = For
            ).to.not.be.reverted;
        });
        
        it("Should execute proposal after successful vote and timelock", async function () {
            // Fast forward past voting delay
            await time.increase(VOTING_DELAY + 1);
            
            // Vote (need quorum)
            await governance.connect(voter1).castVote(proposalId, 1); // For
            await governance.connect(voter2).castVote(proposalId, 1); // For
            
            // Fast forward past voting period
            await time.increase(VOTING_PERIOD + 1);
            
            // Queue the proposal
            const newMinBalance = ethers.parseEther("2000");
            const calldata = factoryQualification.interface.encodeFunctionData(
                "setMinBalance",
                [newMinBalance]
            );
            
            await governance.queue(
                [await factoryQualification.getAddress()],
                [0],
                [calldata],
                ethers.id("Increase minimum balance to 2000 NSF")
            );
            
            // Fast forward past timelock delay
            await time.increase(TIMELOCK_DELAY + 1);
            
            // Transfer admin role to timelock for execution
            const DEFAULT_ADMIN_ROLE = await factoryQualification.DEFAULT_ADMIN_ROLE();
            await factoryQualification.grantRole(DEFAULT_ADMIN_ROLE, await timelock.getAddress());
            
            // Execute
            await governance.execute(
                [await factoryQualification.getAddress()],
                [0],
                [calldata],
                ethers.id("Increase minimum balance to 2000 NSF")
            );
            
            // Verify the change
            expect(await factoryQualification.minBalanceForAccess()).to.equal(newMinBalance);
        });
    });
    
    describe("Security Features", function () {
        it("Should prevent direct calls to governance functions", async function () {
            const selector = "0x12345678";
            
            await expect(
                governance.connect(voter1).addVotableFunction(selector, "test")
            ).to.be.revertedWith("Governor: onlyGovernance");
        });
        
        it("Should require quorum for proposal to pass", async function () {
            // Add votable function
            const selector = factoryQualification.interface.getFunction("setMinBalance").selector;
            const addVotableCall = governance.interface.encodeFunctionData(
                "addVotableFunction",
                [selector, "setMinBalance(uint256)"]
            );
            
            await timelock.schedule(
                await governance.getAddress(),
                0,
                addVotableCall,
                ethers.ZeroHash,
                ethers.ZeroHash,
                TIMELOCK_DELAY
            );
            await time.increase(TIMELOCK_DELAY);
            await timelock.execute(
                await governance.getAddress(),
                0,
                addVotableCall,
                ethers.ZeroHash,
                ethers.ZeroHash
            );
            
            // Create proposal
            const calldata = factoryQualification.interface.encodeFunctionData(
                "setMinBalance",
                [ethers.parseEther("2000")]
            );
            
            const tx = await governance.connect(proposer).propose(
                [await factoryQualification.getAddress()],
                [0],
                [calldata],
                "Test quorum"
            );
            
            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    return governance.interface.parseLog(log).name === "ProposalCreated";
                } catch {
                    return false;
                }
            });
            const proposalId = governance.interface.parseLog(event).args.proposalId;
            
            // Fast forward and vote with insufficient quorum
            await time.increase(VOTING_DELAY + 1);
            await governance.connect(voter3).castVote(proposalId, 1); // Only 5% of supply
            
            // Fast forward past voting period
            await time.increase(VOTING_PERIOD + 1);
            
            // Proposal should be defeated due to lack of quorum
            expect(await governance.state(proposalId)).to.equal(3); // 3 = Defeated
        });
    });
});
