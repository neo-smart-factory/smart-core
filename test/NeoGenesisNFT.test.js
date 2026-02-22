/**
 * NeoGenesisNFT — Test Suite
 * NEØ SMART FACTORY v0.5.3 | GENESIS NFT
 *
 * Real fixture:
 *   Project:  FlowPay-Core
 *   Event:    Visual identity approved — 2026-02-21
 *   Repo:     https://github.com/FlowPay-Core
 *   Recipient: nsfactory.eth (0x470a8c640fFC2C16aEB6bE803a948420e2aE8456)
 */

const { expect } = require("chai");
const { ethers }  = require("hardhat");

// ─── Shared constants ─────────────────────────────────────────────────────────

const NS_FACTORY_ETH = "0x470a8c640fFC2C16aEB6bE803a948420e2aE8456";

const POE_HASH = ethers.keccak256(
  ethers.toUtf8Bytes(JSON.stringify({
    project:    "FlowPay-Core",
    event:      "visual_identity_approved",
    date:       "2026-02-21",
    repo:       "https://github.com/FlowPay-Core",
    approvedBy: "NEO_MELLO",
  }))
);

const IPFS_URI        = "ipfs://QmFlowPayCoreGenesisXXXXXXXXXXXXXXXXXXXXXXXX";
const GENESIS_TOKEN_ID = 0n;
const IERC5192_ID      = "0xb45a3c0e";

// ─── Deploy helpers ───────────────────────────────────────────────────────────

async function deployMockRegistry() {
  const F = await ethers.getContractFactory("MockAttestationRegistry");
  const mock = await F.deploy();
  await mock.waitForDeployment();
  return mock;
}

async function deployGenesis({
  projectName   = "FlowPay-Core",
  projectSymbol = "FLOWGEN",
  poeHash       = POE_HASH,
  poeRegistry,          // required — address of the registry contract
  tokenURI      = IPFS_URI,
  initialOwner,
} = {}) {
  const [deployer] = await ethers.getSigners();
  const owner = initialOwner || deployer.address;

  const F = await ethers.getContractFactory("NeoGenesisNFT");
  const nft = await F.deploy(
    projectName,
    projectSymbol,
    poeHash,
    poeRegistry,
    tokenURI,
    owner
  );
  await nft.waitForDeployment();
  return nft;
}

// ─────────────────────────────────────────────────────────────────────────────

describe("NeoGenesisNFT", function () {

  let nft, mock, owner, other;

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();

    // Deploy mock registry — PoE not registered yet by default
    mock = await deployMockRegistry();

    nft = await deployGenesis({
      poeRegistry:  await mock.getAddress(),
      initialOwner: owner.address,
    });
  });

  // ─── Protocol Anchors ──────────────────────────────────────────────────────
  describe("Protocol constants", function () {
    it("exposes correct MODULE and VERSION", async function () {
      expect(await nft.MODULE()).to.equal("NeoGenesisNFT");
      expect(await nft.VERSION()).to.equal("1.0.0");
    });

    it("GENESIS_TOKEN_ID is 0", async function () {
      expect(await nft.GENESIS_TOKEN_ID()).to.equal(0n);
    });
  });

  // ─── Constructor ───────────────────────────────────────────────────────────
  describe("Constructor", function () {
    it("stores projectName correctly", async function () {
      expect(await nft.projectName()).to.equal("FlowPay-Core");
    });

    it("stores poeHash as immutable", async function () {
      expect(await nft.poeHash()).to.equal(POE_HASH);
    });

    it("stores poeRegistry address", async function () {
      expect(await nft.poeRegistry()).to.equal(await mock.getAddress());
    });

    it("sets token name and symbol", async function () {
      expect(await nft.name()).to.equal("FlowPay-Core");
      expect(await nft.symbol()).to.equal("FLOWGEN");
    });

    it("sets initial owner via Ownable2Step", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("minted flag starts false", async function () {
      expect(await nft.minted()).to.be.false;
    });

    it("totalSupply is 0 before mint", async function () {
      expect(await nft.totalSupply()).to.equal(0n);
    });

    it("revert InvalidHash if poeHash is bytes32(0)", async function () {
      const F = await ethers.getContractFactory("NeoGenesisNFT");
      await expect(
        F.deploy("X", "X", ethers.ZeroHash, await mock.getAddress(), IPFS_URI, owner.address)
      ).to.be.revertedWithCustomError(nft, "InvalidHash");
    });

    it("revert ZeroAddress if poeRegistry is address(0)", async function () {
      const F = await ethers.getContractFactory("NeoGenesisNFT");
      await expect(
        F.deploy("X", "X", POE_HASH, ethers.ZeroAddress, IPFS_URI, owner.address)
      ).to.be.revertedWithCustomError(nft, "ZeroAddress");
    });

    it("revert if initialOwner is address(0)", async function () {
      // Ownable2Step (OZ v5) catches this first via OwnableInvalidOwner
      const F = await ethers.getContractFactory("NeoGenesisNFT");
      await expect(
        F.deploy("X", "X", POE_HASH, await mock.getAddress(), IPFS_URI, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(nft, "OwnableInvalidOwner");
    });

    it("revert EmptyURI if tokenURI is empty", async function () {
      const F = await ethers.getContractFactory("NeoGenesisNFT");
      await expect(
        F.deploy("X", "X", POE_HASH, await mock.getAddress(), "", owner.address)
      ).to.be.revertedWithCustomError(nft, "EmptyURI");
    });
  });

  // ─── mint() — PoE validation ───────────────────────────────────────────────
  describe("mint() — PoE on-chain validation", function () {

    it("revert PoENotFound if poeHash not registered in registry", async function () {
      // Mock returns (false, false, 0) by default — PoE not registered
      await expect(nft.connect(owner).mint())
        .to.be.revertedWithCustomError(nft, "PoENotFound");
    });

    it("revert PoERevoked if poeHash is registered but revoked", async function () {
      // Register as revoked
      await mock.setResult(POE_HASH, true, true);

      await expect(nft.connect(owner).mint())
        .to.be.revertedWithCustomError(nft, "PoERevoked");
    });

    it("mints successfully when PoE exists and is not revoked", async function () {
      // Register valid PoE
      await mock.setResult(POE_HASH, true, false);

      await expect(nft.connect(owner).mint())
        .to.emit(nft, "Locked")
        .withArgs(0n);

      expect(await nft.ownerOf(0n)).to.equal(owner.address);
    });

    it("sets minted flag to true after successful mint", async function () {
      await mock.setResult(POE_HASH, true, false);
      await nft.connect(owner).mint();
      expect(await nft.minted()).to.be.true;
    });

    it("totalSupply becomes 1 after successful mint", async function () {
      await mock.setResult(POE_HASH, true, false);
      await nft.connect(owner).mint();
      expect(await nft.totalSupply()).to.equal(1n);
    });

    it("token URI is set correctly after mint", async function () {
      await mock.setResult(POE_HASH, true, false);
      await nft.connect(owner).mint();
      expect(await nft.tokenURI(0n)).to.equal(IPFS_URI);
    });

    it("revert AlreadyMinted on second call even if PoE is valid", async function () {
      await mock.setResult(POE_HASH, true, false);
      await nft.connect(owner).mint();
      await expect(nft.connect(owner).mint())
        .to.be.revertedWithCustomError(nft, "AlreadyMinted");
    });

    it("revert OwnableUnauthorizedAccount if caller is not owner", async function () {
      await mock.setResult(POE_HASH, true, false);
      await expect(nft.connect(other).mint())
        .to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });

  // ─── ERC-5192 Soulbound ────────────────────────────────────────────────────
  describe("ERC-5192 Soulbound", function () {
    beforeEach(async function () {
      await mock.setResult(POE_HASH, true, false);
      await nft.connect(owner).mint();
    });

    it("locked() always returns true", async function () {
      expect(await nft.locked(0n)).to.be.true;
    });

    it("revert SoulboundTransferNotAllowed on transferFrom", async function () {
      await expect(
        nft.connect(owner).transferFrom(owner.address, other.address, 0n)
      ).to.be.revertedWithCustomError(nft, "SoulboundTransferNotAllowed");
    });

    it("revert SoulboundTransferNotAllowed on safeTransferFrom", async function () {
      await expect(
        nft.connect(owner)["safeTransferFrom(address,address,uint256)"](
          owner.address, other.address, 0n
        )
      ).to.be.revertedWithCustomError(nft, "SoulboundTransferNotAllowed");
    });

    it("NFT remains with original owner after transfer attempt", async function () {
      try {
        await nft.connect(owner).transferFrom(owner.address, other.address, 0n);
      } catch (_) { /* expected revert */ }
      expect(await nft.ownerOf(0n)).to.equal(owner.address);
    });
  });

  // ─── genesisOwner() ───────────────────────────────────────────────────────
  describe("genesisOwner()", function () {
    it("revert NotYetMinted before mint", async function () {
      await expect(nft.genesisOwner())
        .to.be.revertedWithCustomError(nft, "NotYetMinted");
    });

    it("returns owner address after mint", async function () {
      await mock.setResult(POE_HASH, true, false);
      await nft.connect(owner).mint();
      expect(await nft.genesisOwner()).to.equal(owner.address);
    });
  });

  // ─── setTokenURI() ────────────────────────────────────────────────────────
  describe("setTokenURI()", function () {
    const NEW_URI = "ipfs://QmUpdatedFlowPayGenesisXXXXXXXXXXXXXXXXXXXX";

    it("owner updates URI before mint", async function () {
      await nft.connect(owner).setTokenURI(NEW_URI);
      await mock.setResult(POE_HASH, true, false);
      await nft.connect(owner).mint();
      expect(await nft.tokenURI(0n)).to.equal(NEW_URI);
    });

    it("owner updates URI after mint", async function () {
      await mock.setResult(POE_HASH, true, false);
      await nft.connect(owner).mint();
      await nft.connect(owner).setTokenURI(NEW_URI);
      expect(await nft.tokenURI(0n)).to.equal(NEW_URI);
    });

    it("revert if called by non-owner", async function () {
      await expect(nft.connect(other).setTokenURI(NEW_URI))
        .to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });

    it("revert EmptyURI if empty string", async function () {
      await expect(nft.connect(owner).setTokenURI(""))
        .to.be.revertedWithCustomError(nft, "EmptyURI");
    });
  });

  // ─── Ownable2Step ─────────────────────────────────────────────────────────
  describe("Ownable2Step", function () {
    it("ownership transfer requires two steps", async function () {
      await nft.connect(owner).transferOwnership(other.address);

      // Pending — not yet transferred
      expect(await nft.owner()).to.equal(owner.address);
      expect(await nft.pendingOwner()).to.equal(other.address);

      // New owner accepts
      await nft.connect(other).acceptOwnership();
      expect(await nft.owner()).to.equal(other.address);
    });

    it("non-pending-owner cannot accept", async function () {
      await nft.connect(owner).transferOwnership(other.address);
      const [,, third] = await ethers.getSigners();
      await expect(nft.connect(third).acceptOwnership())
        .to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });

  // ─── ERC-165 Interface Support ─────────────────────────────────────────────
  describe("ERC-165 supportsInterface", function () {
    it("supports ERC-5192 interface (0xb45a3c0e)", async function () {
      expect(await nft.supportsInterface(IERC5192_ID)).to.be.true;
    });

    it("supports ERC-721 interface", async function () {
      expect(await nft.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("supports ERC-165 interface", async function () {
      expect(await nft.supportsInterface("0x01ffc9a7")).to.be.true;
    });
  });

  // ─── PoE linkage integrity (FlowPay-Core real fixture) ────────────────────
  describe("PoE linkage — FlowPay-Core real fixture (2026-02-21)", function () {
    it("poeHash matches the attestation registered in NeoAttestationRegistry", async function () {
      const expectedHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify({
          project:    "FlowPay-Core",
          event:      "visual_identity_approved",
          date:       "2026-02-21",
          repo:       "https://github.com/FlowPay-Core",
          approvedBy: "NEO_MELLO",
        }))
      );
      expect(await nft.poeHash()).to.equal(expectedHash);
    });

    it("poeRegistry is stored and immutable", async function () {
      expect(await nft.poeRegistry()).to.equal(await mock.getAddress());
    });

    it("full flow: PoE registered → NFT minted → soulbound verified", async function () {
      // 1. PoE registered (simulates NeoAttestationRegistry state)
      await mock.setResult(POE_HASH, true, false);

      // 2. Genesis NFT minted — PoE validation passes
      await expect(nft.connect(owner).mint())
        .to.emit(nft, "Locked")
        .withArgs(0n);

      // 3. Soulbound — cannot transfer
      await expect(
        nft.connect(owner).transferFrom(owner.address, other.address, 0n)
      ).to.be.revertedWithCustomError(nft, "SoulboundTransferNotAllowed");

      // 4. NFT still with nsfactory.eth
      expect(await nft.ownerOf(0n)).to.equal(owner.address);
      expect(await nft.locked(0n)).to.be.true;
    });
  });
});
