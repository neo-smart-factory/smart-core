const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

/**
 * FactoryQualification Test Suite
 * 
 * Tests the upgradeable access control module
 */
describe("FactoryQualification", function () {
  let nsfToken;
  let qualification;
  let owner;
  let admin;
  let qualifier;
  let sanctioner;
  let user1;
  let user2;

  const MIN_BALANCE = ethers.parseEther("1000"); // 1,000 NSF
  const SUPPLY = ethers.parseEther("1000000000");

  beforeEach(async function () {
    [owner, admin, qualifier, sanctioner, user1, user2] = await ethers.getSigners();

    // Deploy NSFToken
    const NSFToken = await ethers.getContractFactory("NSFToken");
    nsfToken = await NSFToken.deploy(owner.address);
    await nsfToken.waitForDeployment();

    // Deploy FactoryQualification as upgradeable proxy
    const FactoryQualification = await ethers.getContractFactory("FactoryQualification");
    qualification = await upgrades.deployProxy(
      FactoryQualification,
      [await nsfToken.getAddress(), MIN_BALANCE, admin.address],
      { initializer: "initialize", kind: "uups" }
    );
    await qualification.waitForDeployment();

    // Grant roles
    const QUALIFIER_ROLE = await qualification.QUALIFIER_ROLE();
    const SANCTIONER_ROLE = await qualification.SANCTIONER_ROLE();
    
    await qualification.connect(admin).grantRole(QUALIFIER_ROLE, qualifier.address);
    await qualification.connect(admin).grantRole(SANCTIONER_ROLE, sanctioner.address);

    // Distribute tokens to users
    await nsfToken.connect(owner).transfer(user1.address, MIN_BALANCE * 10n);
    await nsfToken.connect(owner).transfer(user2.address, MIN_BALANCE * 10n);
  });

  describe("Deployment & Initialization", function () {
    it("Should set correct NSF token address", async function () {
      expect(await qualification.nsfToken()).to.equal(await nsfToken.getAddress());
    });

    it("Should set correct minimum balance", async function () {
      expect(await qualification.minBalanceForAccess()).to.equal(MIN_BALANCE);
    });

    it("Should grant admin role to specified address", async function () {
      const DEFAULT_ADMIN_ROLE = await qualification.DEFAULT_ADMIN_ROLE();
      expect(await qualification.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should grant qualifier and sanctioner roles", async function () {
      const QUALIFIER_ROLE = await qualification.QUALIFIER_ROLE();
      const SANCTIONER_ROLE = await qualification.SANCTIONER_ROLE();
      
      expect(await qualification.hasRole(QUALIFIER_ROLE, qualifier.address)).to.be.true;
      expect(await qualification.hasRole(SANCTIONER_ROLE, sanctioner.address)).to.be.true;
    });

    it("Should have correct balance lock period", async function () {
      expect(await qualification.BALANCE_LOCK_PERIOD()).to.equal(7 * 24 * 60 * 60); // 7 days
    });

    it("Should revert initialization with zero token address", async function () {
      const FactoryQualification = await ethers.getContractFactory("FactoryQualification");
      await expect(
        upgrades.deployProxy(
          FactoryQualification,
          [ethers.ZeroAddress, MIN_BALANCE, admin.address],
          { initializer: "initialize", kind: "uups" }
        )
      ).to.be.revertedWith("Invalid token address");
    });

    it("Should revert initialization with zero admin address", async function () {
      const FactoryQualification = await ethers.getContractFactory("FactoryQualification");
      await expect(
        upgrades.deployProxy(
          FactoryQualification,
          [await nsfToken.getAddress(), MIN_BALANCE, ethers.ZeroAddress],
          { initializer: "initialize", kind: "uups" }
        )
      ).to.be.revertedWith("Invalid admin address");
    });
  });

  describe("User Qualification", function () {
    const kycHash = ethers.id("kyc-proof-hash-123");
    let expiryDate;

    beforeEach(async function () {
      // Set expiry to 1 year from now
      const block = await ethers.provider.getBlock('latest');
      expiryDate = block.timestamp + (365 * 24 * 60 * 60);
    });

    it("Should qualify user with sufficient balance", async function () {
      await expect(
        qualification.connect(qualifier).qualifyUser(user1.address, expiryDate, kycHash)
      )
        .to.emit(qualification, "UserQualified")
        .withArgs(user1.address, expiryDate, kycHash);

      expect(await qualification.termsAccepted(user1.address)).to.be.true;
      expect(await qualification.qualificationExpiry(user1.address)).to.equal(expiryDate);
      expect(await qualification.kycHash(user1.address)).to.equal(kycHash);
    });

    it("Should revert qualification without sufficient balance", async function () {
      // User with no tokens
      const [, , , , , , noBalanceUser] = await ethers.getSigners();
      
      await expect(
        qualification.connect(qualifier).qualifyUser(noBalanceUser.address, expiryDate, kycHash)
      ).to.be.revertedWith("Insufficient NSF balance");
    });

    it("Should revert qualification with invalid expiry date", async function () {
      const block = await ethers.provider.getBlock('latest');
      const pastDate = block.timestamp - 1000;

      await expect(
        qualification.connect(qualifier).qualifyUser(user1.address, pastDate, kycHash)
      ).to.be.revertedWith("Invalid expiry date");
    });

    it("Should revert qualification with invalid KYC proof", async function () {
      await expect(
        qualification.connect(qualifier).qualifyUser(user1.address, expiryDate, ethers.ZeroHash)
      ).to.be.revertedWith("Invalid KYC proof");
    });

    it("Should revert qualification for sanctioned user", async function () {
      // Sanction user first
      await qualification.connect(sanctioner).sanctionUser(user1.address, "OFAC list");

      await expect(
        qualification.connect(qualifier).qualifyUser(user1.address, expiryDate, kycHash)
      ).to.be.revertedWith("User is sanctioned");
    });

    it("Should revert if caller is not qualifier", async function () {
      await expect(
        qualification.connect(user1).qualifyUser(user2.address, expiryDate, kycHash)
      ).to.be.reverted;
    });

    it("Should set lastBalanceCheck on qualification", async function () {
      await qualification.connect(qualifier).qualifyUser(user1.address, expiryDate, kycHash);
      
      const lastCheck = await qualification.lastBalanceCheck(user1.address);
      expect(lastCheck).to.be.gt(0);
    });
  });

  describe("Access Control", function () {
    const kycHash = ethers.id("kyc-proof-hash-123");
    let expiryDate;

    beforeEach(async function () {
      const block = await ethers.provider.getBlock('latest');
      expiryDate = block.timestamp + (365 * 24 * 60 * 60);
      
      // Qualify user1
      await qualification.connect(qualifier).qualifyUser(user1.address, expiryDate, kycHash);
    });

    it("Should return true for qualified user with sufficient balance", async function () {
      expect(await qualification.hasAccess(user1.address)).to.be.true;
    });

    it("Should return false for user without terms accepted", async function () {
      expect(await qualification.hasAccess(user2.address)).to.be.false;
    });

    it("Should return false for sanctioned user", async function () {
      await qualification.connect(sanctioner).sanctionUser(user1.address, "Test sanction");
      expect(await qualification.hasAccess(user1.address)).to.be.false;
    });

    it("Should return false if qualification expired", async function () {
      // Fast forward time beyond expiry
      await ethers.provider.send("evm_increaseTime", [366 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      expect(await qualification.hasAccess(user1.address)).to.be.false;
    });

    it("Should return false if balance drops below minimum", async function () {
      // Transfer away most tokens
      const currentBalance = await nsfToken.balanceOf(user1.address);
      await nsfToken.connect(user1).transfer(
        user2.address,
        currentBalance - MIN_BALANCE + 1n
      );

      expect(await qualification.hasAccess(user1.address)).to.be.false;
    });
  });

  describe("Disqualification", function () {
    const kycHash = ethers.id("kyc-proof-hash-123");
    let expiryDate;

    beforeEach(async function () {
      const block = await ethers.provider.getBlock('latest');
      expiryDate = block.timestamp + (365 * 24 * 60 * 60);
      await qualification.connect(qualifier).qualifyUser(user1.address, expiryDate, kycHash);
    });

    it("Should disqualify user", async function () {
      await expect(
        qualification.connect(qualifier).disqualifyUser(user1.address, "Violation")
      )
        .to.emit(qualification, "UserDisqualified")
        .withArgs(user1.address, "Violation");

      expect(await qualification.termsAccepted(user1.address)).to.be.false;
      expect(await qualification.qualificationExpiry(user1.address)).to.equal(0);
      expect(await qualification.hasAccess(user1.address)).to.be.false;
    });

    it("Should revert if caller is not qualifier", async function () {
      await expect(
        qualification.connect(user1).disqualifyUser(user2.address, "Test")
      ).to.be.reverted;
    });
  });

  describe("Sanctions", function () {
    it("Should sanction user", async function () {
      await expect(
        qualification.connect(sanctioner).sanctionUser(user1.address, "OFAC list")
      )
        .to.emit(qualification, "UserSanctioned")
        .withArgs(user1.address, "OFAC list");

      expect(await qualification.sanctioned(user1.address)).to.be.true;
    });

    it("Should unsanction user", async function () {
      await qualification.connect(sanctioner).sanctionUser(user1.address, "OFAC list");
      
      await expect(
        qualification.connect(sanctioner).unsanctionUser(user1.address, "Removed from list")
      )
        .to.emit(qualification, "UserUnsanctioned")
        .withArgs(user1.address, "Removed from list");

      expect(await qualification.sanctioned(user1.address)).to.be.false;
    });

    it("Should revert if caller is not sanctioner", async function () {
      await expect(
        qualification.connect(user1).sanctionUser(user2.address, "Test")
      ).to.be.reverted;
    });
  });

  describe("Parameter Updates", function () {
    it("Should update minimum balance", async function () {
      const newMinBalance = ethers.parseEther("2000");
      
      await expect(
        qualification.connect(admin).setMinBalance(newMinBalance)
      )
        .to.emit(qualification, "MinBalanceUpdated")
        .withArgs(newMinBalance);

      expect(await qualification.minBalanceForAccess()).to.equal(newMinBalance);
    });

    it("Should revert setMinBalance with zero", async function () {
      await expect(
        qualification.connect(admin).setMinBalance(0)
      ).to.be.revertedWith("Balance must be positive");
    });

    it("Should revert if caller is not admin", async function () {
      await expect(
        qualification.connect(user1).setMinBalance(ethers.parseEther("2000"))
      ).to.be.reverted;
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause the contract", async function () {
      await qualification.connect(admin).pause();
      expect(await qualification.paused()).to.be.true;
    });

    it("Should unpause the contract", async function () {
      await qualification.connect(admin).pause();
      await qualification.connect(admin).unpause();
      expect(await qualification.paused()).to.be.false;
    });

    it("Should prevent qualification when paused", async function () {
      await qualification.connect(admin).pause();
      
      const block = await ethers.provider.getBlock('latest');
      const expiryDate = block.timestamp + (365 * 24 * 60 * 60);
      const kycHash = ethers.id("kyc-proof-hash-123");

      await expect(
        qualification.connect(qualifier).qualifyUser(user1.address, expiryDate, kycHash)
      ).to.be.revertedWithCustomError(qualification, "EnforcedPause");
    });
  });

  describe("User Status", function () {
    const kycHash = ethers.id("kyc-proof-hash-123");
    let expiryDate;

    beforeEach(async function () {
      const block = await ethers.provider.getBlock('latest');
      expiryDate = block.timestamp + (365 * 24 * 60 * 60);
      await qualification.connect(qualifier).qualifyUser(user1.address, expiryDate, kycHash);
    });

    it("Should return correct user status", async function () {
      const [qualified, expiry, isSanctioned, currentBalance] = 
        await qualification.getUserStatus(user1.address);

      expect(qualified).to.be.true;
      expect(expiry).to.equal(expiryDate);
      expect(isSanctioned).to.be.false;
      expect(currentBalance).to.be.gte(MIN_BALANCE);
    });
  });

  describe("Upgradeability", function () {
    it("Should be upgradeable by admin", async function () {
      // This is a simplified test - full upgrade testing would deploy V2 contract
      const DEFAULT_ADMIN_ROLE = await qualification.DEFAULT_ADMIN_ROLE();
      expect(await qualification.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should revert upgrade by non-admin", async function () {
      const FactoryQualificationV2 = await ethers.getContractFactory("FactoryQualification");
      await expect(
        upgrades.upgradeProxy(
          await qualification.getAddress(),
          FactoryQualificationV2.connect(user1)
        )
      ).to.be.reverted;
    });
  });
});
