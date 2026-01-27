const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * EmergencyGuardian Test Suite
 * 
 * Tests the 4-of-7 multisig emergency circuit breaker
 */
describe("EmergencyGuardian", function () {
  let guardian;
  let timelock;
  let pausableContract;
  let guardians;
  let nonGuardian;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    
    // First 7 signers are guardians
    guardians = signers.slice(0, 7);
    nonGuardian = signers[8];

    // Deploy mock timelock
    const MockTimelock = await ethers.getContractFactory("MockPausable");
    timelock = await MockTimelock.deploy();
    await timelock.waitForDeployment();

    // Deploy mock pausable contract
    pausableContract = await MockTimelock.deploy();
    await pausableContract.waitForDeployment();

    // Deploy EmergencyGuardian
    const EmergencyGuardian = await ethers.getContractFactory("EmergencyGuardian");
    const guardianAddresses = guardians.map(g => g.address);
    guardian = await EmergencyGuardian.deploy(guardianAddresses, await timelock.getAddress());
    await guardian.waitForDeployment();

    // Add pausable contract
    await guardian.addPausableContract(await pausableContract.getAddress());
  });

  describe("Deployment", function () {
    it("Should set correct guardian count", async function () {
      expect(await guardian.GUARDIAN_COUNT()).to.equal(7);
    });

    it("Should set correct pause threshold", async function () {
      expect(await guardian.PAUSE_THRESHOLD()).to.equal(4);
    });

    it("Should set correct auto-unpause delay", async function () {
      expect(await guardian.AUTO_UNPAUSE_DELAY()).to.equal(48 * 60 * 60); // 48 hours
    });

    it("Should grant guardian role to all 7 guardians", async function () {
      const GUARDIAN_ROLE = await guardian.GUARDIAN_ROLE();
      
      for (let i = 0; i < 7; i++) {
        expect(await guardian.hasRole(GUARDIAN_ROLE, guardians[i].address)).to.be.true;
      }
    });

    it("Should grant timelock role", async function () {
      const TIMELOCK_ROLE = await guardian.TIMELOCK_ROLE();
      expect(await guardian.hasRole(TIMELOCK_ROLE, await timelock.getAddress())).to.be.true;
    });

    it("Should not be paused initially", async function () {
      expect(await guardian.systemPaused()).to.be.false;
    });

    it("Should revert with zero timelock address", async function () {
      const EmergencyGuardian = await ethers.getContractFactory("EmergencyGuardian");
      const guardianAddresses = guardians.map(g => g.address);
      
      await expect(
        EmergencyGuardian.deploy(guardianAddresses, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid timelock");
    });

    it("Should revert with zero guardian address", async function () {
      const EmergencyGuardian = await ethers.getContractFactory("EmergencyGuardian");
      const guardianAddresses = guardians.map(g => g.address);
      guardianAddresses[3] = ethers.ZeroAddress; // Replace one with zero
      
      await expect(
        EmergencyGuardian.deploy(guardianAddresses, await timelock.getAddress())
      ).to.be.revertedWith("Invalid guardian address");
    });
  });

  describe("Pausable Contract Management", function () {
    it("Should add pausable contract", async function () {
      const MockPausable = await ethers.getContractFactory("MockPausable");
      const newPausable = await MockPausable.deploy();
      await newPausable.waitForDeployment();

      await expect(
        guardian.addPausableContract(await newPausable.getAddress())
      )
        .to.emit(guardian, "PausableContractAdded")
        .withArgs(await newPausable.getAddress());

      const pausables = await guardian.getPausableContracts();
      expect(pausables).to.include(await newPausable.getAddress());
    });

    it("Should revert adding zero address", async function () {
      await expect(
        guardian.addPausableContract(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid contract address");
    });

    it("Should revert if caller is not admin", async function () {
      await expect(
        guardian.connect(guardians[0]).addPausableContract(await pausableContract.getAddress())
      ).to.be.reverted;
    });

    it("Should return all pausable contracts", async function () {
      const pausables = await guardian.getPausableContracts();
      expect(pausables.length).to.equal(1);
      expect(pausables[0]).to.equal(await pausableContract.getAddress());
    });
  });

  describe("Emergency Pause Proposal", function () {
    it("Should allow guardian to propose pause", async function () {
      const reason = "Security vulnerability detected";
      
      const tx = await guardian.connect(guardians[0]).proposeEmergencyPause(reason);
      const receipt = await tx.wait();
      
      // Get proposal ID from event
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "EmergencyPauseProposed"
      );
      
      expect(event).to.not.be.undefined;
    });

    it("Should revert if non-guardian proposes", async function () {
      await expect(
        guardian.connect(nonGuardian).proposeEmergencyPause("Test")
      ).to.be.revertedWith("Not a guardian");
    });

    it("Should revert if system already paused", async function () {
      // First proposal - get it to 4 votes
      await guardian.connect(guardians[0]).proposeEmergencyPause("Test 1");
      const proposalId = await guardian.activeProposalId();
      
      await guardian.connect(guardians[1]).voteEmergencyPause(proposalId);
      await guardian.connect(guardians[2]).voteEmergencyPause(proposalId);
      await guardian.connect(guardians[3]).voteEmergencyPause(proposalId);

      // System should be paused now
      expect(await guardian.systemPaused()).to.be.true;

      // Try to propose again
      await expect(
        guardian.connect(guardians[4]).proposeEmergencyPause("Test 2")
      ).to.be.revertedWith("System already paused");
    });
  });

  describe("Emergency Pause Voting", function () {
    let proposalId;

    beforeEach(async function () {
      await guardian.connect(guardians[0]).proposeEmergencyPause("Test proposal");
      proposalId = await guardian.activeProposalId();
    });

    it("Should allow guardians to vote", async function () {
      await expect(
        guardian.connect(guardians[1]).voteEmergencyPause(proposalId)
      )
        .to.emit(guardian, "EmergencyPauseVoted")
        .withArgs(proposalId, guardians[1].address, 2);

      const [voteCount, ,] = await guardian.getProposal(proposalId);
      expect(voteCount).to.equal(2);
    });

    it("Should prevent double voting", async function () {
      await expect(
        guardian.connect(guardians[0]).voteEmergencyPause(proposalId)
      ).to.be.revertedWith("Already voted");
    });

    it("Should revert if non-guardian votes", async function () {
      await expect(
        guardian.connect(nonGuardian).voteEmergencyPause(proposalId)
      ).to.be.revertedWith("Not a guardian");
    });

    it("Should execute pause when threshold reached", async function () {
      // Need 4 votes total (proposer counts as 1)
      await guardian.connect(guardians[1]).voteEmergencyPause(proposalId);
      await guardian.connect(guardians[2]).voteEmergencyPause(proposalId);
      
      await expect(
        guardian.connect(guardians[3]).voteEmergencyPause(proposalId)
      )
        .to.emit(guardian, "EmergencyPauseExecuted")
        .withArgs(proposalId, await time.latest() + 1);

      expect(await guardian.systemPaused()).to.be.true;
      expect(await pausableContract.paused()).to.be.true;
    });

    it("Should track proposal vote count correctly", async function () {
      const [voteCount1, ,] = await guardian.getProposal(proposalId);
      expect(voteCount1).to.equal(1); // Proposer vote

      await guardian.connect(guardians[1]).voteEmergencyPause(proposalId);
      const [voteCount2, ,] = await guardian.getProposal(proposalId);
      expect(voteCount2).to.equal(2);
    });

    it("Should expire proposal after 24 hours", async function () {
      // Fast forward 25 hours
      await time.increase(25 * 60 * 60);

      await expect(
        guardian.connect(guardians[1]).voteEmergencyPause(proposalId)
      ).to.be.revertedWith("Proposal expired");
    });
  });

  describe("Unpause Functionality", function () {
    let proposalId;

    beforeEach(async function () {
      // Create and execute pause
      await guardian.connect(guardians[0]).proposeEmergencyPause("Test");
      proposalId = await guardian.activeProposalId();
      
      await guardian.connect(guardians[1]).voteEmergencyPause(proposalId);
      await guardian.connect(guardians[2]).voteEmergencyPause(proposalId);
      await guardian.connect(guardians[3]).voteEmergencyPause(proposalId);
    });

    it("Should allow timelock to unpause immediately", async function () {
      await expect(
        guardian.connect(await ethers.getSigner(await timelock.getAddress())).unpause("Issue resolved")
      )
        .to.emit(guardian, "EmergencyUnpause");

      expect(await guardian.systemPaused()).to.be.false;
      expect(await pausableContract.paused()).to.be.false;
    });

    it("Should allow guardian to unpause after 48 hours", async function () {
      // Fast forward 48 hours
      await time.increase(48 * 60 * 60);

      await expect(
        guardian.connect(guardians[0]).unpause("Auto-unpause period reached")
      )
        .to.emit(guardian, "EmergencyUnpause");

      expect(await guardian.systemPaused()).to.be.false;
    });

    it("Should revert guardian unpause before 48 hours", async function () {
      // Fast forward only 24 hours
      await time.increase(24 * 60 * 60);

      await expect(
        guardian.connect(guardians[0]).unpause("Too early")
      ).to.be.revertedWith("Cannot unpause yet");
    });

    it("Should revert if system not paused", async function () {
      // Unpause first
      await time.increase(48 * 60 * 60);
      await guardian.connect(guardians[0]).unpause("Test");

      // Try to unpause again
      await expect(
        guardian.connect(guardians[0]).unpause("Already unpaused")
      ).to.be.revertedWith("System not paused");
    });
  });

  describe("canUnpauseAt View Function", function () {
    let proposalId;

    beforeEach(async function () {
      // Create and execute pause
      await guardian.connect(guardians[0]).proposeEmergencyPause("Test");
      proposalId = await guardian.activeProposalId();
      
      await guardian.connect(guardians[1]).voteEmergencyPause(proposalId);
      await guardian.connect(guardians[2]).voteEmergencyPause(proposalId);
      await guardian.connect(guardians[3]).voteEmergencyPause(proposalId);
    });

    it("Should return false and time remaining initially", async function () {
      const [canUnpause, timeRemaining] = await guardian.canUnpauseAt();
      
      expect(canUnpause).to.be.false;
      expect(timeRemaining).to.be.gt(0);
      expect(timeRemaining).to.be.lte(48 * 60 * 60);
    });

    it("Should return true and zero after 48 hours", async function () {
      await time.increase(48 * 60 * 60);
      
      const [canUnpause, timeRemaining] = await guardian.canUnpauseAt();
      
      expect(canUnpause).to.be.true;
      expect(timeRemaining).to.equal(0);
    });

    it("Should return false when not paused", async function () {
      await time.increase(48 * 60 * 60);
      await guardian.connect(guardians[0]).unpause("Test");
      
      const [canUnpause, timeRemaining] = await guardian.canUnpauseAt();
      
      expect(canUnpause).to.be.false;
      expect(timeRemaining).to.equal(0);
    });
  });

  describe("Proposal Tracking", function () {
    it("Should track if guardian voted on proposal", async function () {
      await guardian.connect(guardians[0]).proposeEmergencyPause("Test");
      const proposalId = await guardian.activeProposalId();

      expect(await guardian.hasVotedOnProposal(proposalId, guardians[0].address)).to.be.true;
      expect(await guardian.hasVotedOnProposal(proposalId, guardians[1].address)).to.be.false;

      await guardian.connect(guardians[1]).voteEmergencyPause(proposalId);
      expect(await guardian.hasVotedOnProposal(proposalId, guardians[1].address)).to.be.true;
    });
  });
});

// Mock Pausable contract for testing
// This would typically be in a separate file
// Note: You'll need to create this mock contract or modify the test
