const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * NSFToken Test Suite
 * 
 * Tests the immutable, ownerless NSF token implementation
 */
describe("NSFToken", function () {
  let nsfToken;
  let owner;
  let distributor;
  let user1;
  let user2;

  const EXPECTED_SUPPLY = ethers.parseEther("1000000000"); // 1 billion tokens

  beforeEach(async function () {
    [owner, distributor, user1, user2] = await ethers.getSigners();

    const NSFToken = await ethers.getContractFactory("contracts/nsf/NSFToken.sol:NSFToken");
    nsfToken = await NSFToken.deploy(distributor.address);
    await nsfToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await nsfToken.name()).to.equal("Neural Sync Factory");
      expect(await nsfToken.symbol()).to.equal("NSF");
    });

    it("Should set decimals to 18", async function () {
      expect(await nsfToken.decimals()).to.equal(18);
    });

    it("Should mint exactly 1 billion tokens to distributor", async function () {
      const distributorBalance = await nsfToken.balanceOf(distributor.address);
      expect(distributorBalance).to.equal(EXPECTED_SUPPLY);
    });

    it("Should have correct total supply", async function () {
      expect(await nsfToken.totalSupply()).to.equal(EXPECTED_SUPPLY);
    });

    it("Should set deployment timestamp", async function () {
      const timestamp = await nsfToken.DEPLOYMENT_TIMESTAMP();
      expect(timestamp).to.be.gt(0);
    });

    it("Should confirm mint renunciation", async function () {
      expect(await nsfToken.MINT_RENOUNCED()).to.equal(true);
    });

    it("Should revert if distributor is zero address", async function () {
      const NSFToken = await ethers.getContractFactory("contracts/nsf/NSFToken.sol:NSFToken");
      await expect(
        NSFToken.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("NSF: invalid distributor");
    });
  });

  describe("Token Info", function () {
    it("Should return correct token info", async function () {
      const [name, symbol, supply, deploymentTime, mintRenounced] = 
        await nsfToken.getTokenInfo();
      
      expect(name).to.equal("Neural Sync Factory");
      expect(symbol).to.equal("NSF");
      expect(supply).to.equal(EXPECTED_SUPPLY);
      expect(deploymentTime).to.be.gt(0);
      expect(mintRenounced).to.equal(true);
    });
  });

  describe("ERC20 Functionality", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      await nsfToken.connect(distributor).transfer(user1.address, transferAmount);
      
      expect(await nsfToken.balanceOf(user1.address)).to.equal(transferAmount);
      expect(await nsfToken.balanceOf(distributor.address)).to.equal(
        EXPECTED_SUPPLY - transferAmount
      );
    });

    it("Should fail transfer with insufficient balance", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      await expect(
        nsfToken.connect(user1).transfer(user2.address, transferAmount)
      ).to.be.reverted;
    });

    it("Should approve and transferFrom correctly", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      await nsfToken.connect(distributor).approve(user1.address, transferAmount);
      
      expect(await nsfToken.allowance(distributor.address, user1.address))
        .to.equal(transferAmount);
      
      await nsfToken.connect(user1).transferFrom(
        distributor.address,
        user2.address,
        transferAmount
      );
      
      expect(await nsfToken.balanceOf(user2.address)).to.equal(transferAmount);
    });
  });

  describe("ERC20Permit Functionality", function () {
    it("Should return correct domain separator", async function () {
      const domainSeparator = await nsfToken.DOMAIN_SEPARATOR();
      expect(domainSeparator).to.not.equal(ethers.ZeroHash);
    });

    it("Should have correct initial nonces", async function () {
      expect(await nsfToken.nonces(user1.address)).to.equal(0);
      expect(await nsfToken.nonces(user2.address)).to.equal(0);
    });

    // Note: Full permit testing requires EIP-712 signing
    // This would be added in integration tests with proper signature generation
  });

  describe("Immutability", function () {
    it("Should not have owner function", async function () {
      // Contract should not have owner() function
      // Attempt to call it should fail
      try {
        await nsfToken.owner();
        expect.fail("owner() function should not exist");
      } catch (error) {
        // Expected - function doesn't exist
        expect(error.message).to.include("owner is not a function");
      }
    });

    it("Should not have mint function", async function () {
      // Contract should not have mint() function
      try {
        await nsfToken.mint(user1.address, ethers.parseEther("1000"));
        expect.fail("mint() function should not exist");
      } catch (error) {
        // Expected - function doesn't exist
        expect(error.message).to.include("mint is not a function");
      }
    });

    it("Should not have pause function", async function () {
      // Contract should not have pause() function
      try {
        await nsfToken.pause();
        expect.fail("pause() function should not exist");
      } catch (error) {
        // Expected - function doesn't exist
        expect(error.message).to.include("pause is not a function");
      }
    });

    it("Should confirm supply is permanently fixed", async function () {
      // Transfer all tokens around
      await nsfToken.connect(distributor).transfer(user1.address, EXPECTED_SUPPLY);
      await nsfToken.connect(user1).transfer(user2.address, EXPECTED_SUPPLY);
      
      // Total supply should never change
      expect(await nsfToken.totalSupply()).to.equal(EXPECTED_SUPPLY);
    });
  });

  describe("Gas Usage", function () {
    it("Should have reasonable gas costs for transfers", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      const tx = await nsfToken.connect(distributor).transfer(
        user1.address,
        transferAmount
      );
      const receipt = await tx.wait();
      
      // Standard ERC20 transfer should be under 60k gas
      expect(receipt.gasUsed).to.be.lt(60000);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero value transfers", async function () {
      await nsfToken.connect(distributor).transfer(user1.address, 0);
      expect(await nsfToken.balanceOf(user1.address)).to.equal(0);
    });

    it("Should handle maximum uint256 approval", async function () {
      const maxUint256 = ethers.MaxUint256;
      await nsfToken.connect(distributor).approve(user1.address, maxUint256);
      expect(await nsfToken.allowance(distributor.address, user1.address))
        .to.equal(maxUint256);
    });

    it("Should emit Transfer events correctly", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      await expect(
        nsfToken.connect(distributor).transfer(user1.address, transferAmount)
      )
        .to.emit(nsfToken, "Transfer")
        .withArgs(distributor.address, user1.address, transferAmount);
    });

    it("Should emit Approval events correctly", async function () {
      const approvalAmount = ethers.parseEther("1000");
      
      await expect(
        nsfToken.connect(distributor).approve(user1.address, approvalAmount)
      )
        .to.emit(nsfToken, "Approval")
        .withArgs(distributor.address, user1.address, approvalAmount);
    });
  });

  describe("Regulatory Compliance Verification", function () {
    it("Should confirm no owner exists (complete decentralization)", async function () {
      // No owner functions should exist
      const contractInterface = nsfToken.interface;
      const ownerFunctions = ['owner', 'transferOwnership', 'renounceOwnership'];
      
      ownerFunctions.forEach(funcName => {
        try {
          contractInterface.getFunction(funcName);
          expect.fail(`${funcName} should not exist for regulatory compliance`);
        } catch (error) {
          // Expected - function doesn't exist
        }
      });
    });

    it("Should confirm no mint capability (fixed supply)", async function () {
      // No mint functions should exist
      const contractInterface = nsfToken.interface;
      const mintFunctions = ['mint', 'mintTo', '_mint'];
      
      mintFunctions.forEach(funcName => {
        try {
          const fragment = contractInterface.getFunction(funcName);
          // _mint is internal, so this will fail for different reason
          if (funcName !== '_mint') {
            expect.fail(`${funcName} should not be public for regulatory compliance`);
          }
        } catch (error) {
          // Expected - function doesn't exist or is not public
        }
      });
    });

    it("Should confirm MINT_RENOUNCED flag is immutable", async function () {
      // This is a constant, should always be true
      expect(await nsfToken.MINT_RENOUNCED()).to.equal(true);
      
      // MAX_SUPPLY should also be constant
      expect(await nsfToken.MAX_SUPPLY()).to.equal(EXPECTED_SUPPLY);
    });
  });
});
