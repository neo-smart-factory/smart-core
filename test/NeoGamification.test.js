/**
 * NeoGamification — Test Suite
 * NΞØ SMART FACTORY v0.5.3 | REWARD CONTRACT | GAMIFICATION
 *
 * Issue: #24 — Nova demanda para novos smart contracts
 * Repo: https://github.com/neo-smart-factory/smart-core
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ZERO = ethers.ZeroAddress;

async function deployMockToken(owner) {
  // Usamos NeoTokenBase como token de recompensa nos testes
  const F = await ethers.getContractFactory("NeoTokenBase");
  const token = await F.deploy("MockReward", "MRW", 0n, ethers.parseEther("1000000"));
  await token.waitForDeployment();
  // Minta tokens para o owner para depositar no contrato
  await token.mint({ value: 0n });
  return token;
}

async function deployGamification({ rewardToken = ZERO, attester } = {}) {
  const [deployer] = await ethers.getSigners();
  const att = attester || deployer.address;

  const F = await ethers.getContractFactory("NeoGamification");
  const contract = await F.deploy(rewardToken, att);
  await contract.waitForDeployment();
  return contract;
}

function buildXPClaimDomain(contractAddress, chainId) {
  return {
    name: "NeoGamification",
    version: "1.0.0",
    chainId,
    verifyingContract: contractAddress,
  };
}

const XPClaimTypes = {
  XPClaim: [
    { name: "user",        type: "address" },
    { name: "xpAmount",   type: "uint256" },
    { name: "tokenAmount", type: "uint256" },
    { name: "badgeId",    type: "uint256" },
    { name: "awardBadge", type: "bool"    },
    { name: "deadline",   type: "uint256" },
    { name: "nonce",      type: "bytes32" },
  ],
};

async function signXPClaim(signer, domain, claim) {
  return signer.signTypedData(domain, XPClaimTypes, claim);
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe("NeoGamification", function () {
  let contract;
  let owner, user, user2, attester, operator;
  let domain;
  let chainId;

  beforeEach(async function () {
    [owner, user, user2, attester, operator] = await ethers.getSigners();

    const F = await ethers.getContractFactory("NeoGamification");
    contract = await F.deploy(ZERO, attester.address);
    await contract.waitForDeployment();

    const net = await ethers.provider.getNetwork();
    chainId = net.chainId;
    domain = buildXPClaimDomain(await contract.getAddress(), chainId);
  });

  // ─── Deploy ────────────────────────────────────────────────────────────────

  describe("Deploy", function () {
    it("deve definir owner corretamente", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("deve definir attester corretamente", async function () {
      expect(await contract.attester()).to.equal(attester.address);
    });

    it("deve reverter se attester for zero", async function () {
      const F = await ethers.getContractFactory("NeoGamification");
      await expect(F.deploy(ZERO, ZERO)).to.be.revertedWith("attester=0");
    });
  });

  // ─── Admin ─────────────────────────────────────────────────────────────────

  describe("Admin", function () {
    it("setOperator deve habilitar operador", async function () {
      await contract.setOperator(operator.address, true);
      expect(await contract.operators(operator.address)).to.equal(true);
    });

    it("setOperator deve emitir OperatorSet", async function () {
      await expect(contract.setOperator(operator.address, true))
        .to.emit(contract, "OperatorSet")
        .withArgs(operator.address, true);
    });

    it("setAttester deve atualizar attester", async function () {
      await contract.setAttester(user2.address);
      expect(await contract.attester()).to.equal(user2.address);
    });

    it("setAttester deve reverter para zero", async function () {
      await expect(contract.setAttester(ZERO)).to.be.revertedWith("attester=0");
    });

    it("não-owner não pode chamar setOperator", async function () {
      await expect(
        contract.connect(user).setOperator(operator.address, true)
      ).to.be.reverted;
    });
  });

  // ─── Badges ────────────────────────────────────────────────────────────────

  describe("Badges", function () {
    it("deve criar badge e emitir BadgeCreated", async function () {
      await expect(contract.createBadge("Pioneer", "ipfs://Qm...", 50n))
        .to.emit(contract, "BadgeCreated")
        .withArgs(0n, "Pioneer");
    });

    it("deve incrementar badgeCounter a cada criação", async function () {
      await contract.createBadge("Pioneer", "ipfs://Qm1", 50n);
      await contract.createBadge("Explorer", "ipfs://Qm2", 100n);
      expect(await contract.badgeCounter()).to.equal(2n);
    });

    it("deve deactivateBadge", async function () {
      await contract.createBadge("Pioneer", "ipfs://Qm1", 0n);
      await contract.deactivateBadge(0n);
      const badge = await contract.badges(0n);
      expect(badge.active).to.equal(false);
    });
  });

  // ─── awardXP (via operador) ────────────────────────────────────────────────

  describe("awardXP via operador", function () {
    beforeEach(async function () {
      await contract.setOperator(operator.address, true);
    });

    it("operador pode conceder XP", async function () {
      await expect(
        contract.connect(operator).awardXP(user.address, 50n, 0n, "test")
      )
        .to.emit(contract, "XPAwarded")
        .withArgs(user.address, 50n, 50n, 0n, "test"); // Level.SEED = 0
    });

    it("XP deve acumular no perfil", async function () {
      await contract.connect(operator).awardXP(user.address, 60n, 0n, "test");
      await contract.connect(operator).awardXP(user.address, 50n, 0n, "test");
      const profile = await contract.getProfile(user.address);
      expect(profile.xp).to.be.gte(110n); // pode ter streak bonus
    });

    it("deve emitir LevelUp ao passar limiar SPROUT (100 XP)", async function () {
      await expect(
        contract.connect(operator).awardXP(user.address, 110n, 0n, "test")
      )
        .to.emit(contract, "LevelUp")
        .withArgs(user.address, 0n, 1n); // SEED → SPROUT
    });

    it("não-operador não pode chamar awardXP", async function () {
      await expect(
        contract.connect(user).awardXP(user.address, 50n, 0n, "test")
      ).to.be.revertedWith("not operator");
    });
  });

  // ─── awardBadge (via operador) ─────────────────────────────────────────────

  describe("awardBadge via operador", function () {
    beforeEach(async function () {
      await contract.setOperator(operator.address, true);
      await contract.createBadge("Pioneer", "ipfs://Qm1", 0n);
    });

    it("deve conceder badge e emitir BadgeAwarded", async function () {
      await expect(
        contract.connect(operator).awardBadge(user.address, 0n)
      )
        .to.emit(contract, "BadgeAwarded")
        .withArgs(user.address, 0n, "Pioneer");

      expect(await contract.hasBadge(user.address, 0n)).to.equal(true);
    });

    it("não deve conceder badge duplicado", async function () {
      await contract.connect(operator).awardBadge(user.address, 0n);
      await expect(
        contract.connect(operator).awardBadge(user.address, 0n)
      ).to.be.revertedWith("already has badge");
    });

    it("deve reverter para badge inativo", async function () {
      await contract.deactivateBadge(0n);
      await expect(
        contract.connect(operator).awardBadge(user.address, 0n)
      ).to.be.revertedWith("badge not active");
    });

    it("deve conceder XP bonus do badge", async function () {
      await contract.createBadge("Bonus", "ipfs://Qm2", 200n);
      const tx = await contract.connect(operator).awardBadge(user.address, 1n);
      const receipt = await tx.wait();
      const profile = await contract.getProfile(user.address);
      expect(profile.xp).to.be.gte(200n);
    });
  });

  // ─── Streak ───────────────────────────────────────────────────────────────

  describe("Streak", function () {
    beforeEach(async function () {
      await contract.setOperator(operator.address, true);
    });

    it("primeira ação inicia streak em 1", async function () {
      await contract.connect(operator).awardXP(user.address, 10n, 0n, "test");
      const profile = await contract.getProfile(user.address);
      expect(profile.streak).to.equal(1n);
    });

    it("ação no mesmo dia não altera streak", async function () {
      await contract.connect(operator).awardXP(user.address, 10n, 0n, "test");
      await contract.connect(operator).awardXP(user.address, 10n, 0n, "test");
      const profile = await contract.getProfile(user.address);
      expect(profile.streak).to.equal(1n);
    });
  });

  // ─── Níveis ───────────────────────────────────────────────────────────────

  describe("Níveis", function () {
    it("getLevelName deve retornar nomes corretos", async function () {
      expect(await contract.getLevelName(0n)).to.equal("SEED");
      expect(await contract.getLevelName(1n)).to.equal("SPROUT");
      expect(await contract.getLevelName(2n)).to.equal("BLOOM");
      expect(await contract.getLevelName(3n)).to.equal("HARVEST");
      expect(await contract.getLevelName(4n)).to.equal("LEGEND");
    });
  });

  // ─── claimReward (EIP-712) ────────────────────────────────────────────────

  describe("claimReward via EIP-712", function () {
    let nonce;
    let deadline;

    beforeEach(async function () {
      nonce = ethers.randomBytes(32);
      const block = await ethers.provider.getBlock("latest");
      deadline = block.timestamp + 3600;
    });

    it("deve aceitar claim válido e conceder XP", async function () {
      const claim = {
        user: user.address,
        xpAmount: 50n,
        tokenAmount: 0n,
        badgeId: 0n,
        awardBadge: false,
        deadline: BigInt(deadline),
        nonce: ethers.hexlify(nonce),
      };

      const sig = await signXPClaim(attester, domain, claim);

      await expect(contract.connect(user).claimReward(claim, sig))
        .to.emit(contract, "XPAwarded")
        .withArgs(user.address, 50n, 50n, 0n, "oracle_claim");
    });

    it("deve rejeitar assinatura de não-attester", async function () {
      const claim = {
        user: user.address,
        xpAmount: 50n,
        tokenAmount: 0n,
        badgeId: 0n,
        awardBadge: false,
        deadline: BigInt(deadline),
        nonce: ethers.hexlify(nonce),
      };

      const sig = await signXPClaim(user2, domain, claim); // assinado por user2, não attester

      await expect(
        contract.connect(user).claimReward(claim, sig)
      ).to.be.revertedWith("bad sig");
    });

    it("deve rejeitar nonce duplicado", async function () {
      const claim = {
        user: user.address,
        xpAmount: 50n,
        tokenAmount: 0n,
        badgeId: 0n,
        awardBadge: false,
        deadline: BigInt(deadline),
        nonce: ethers.hexlify(nonce),
      };

      const sig = await signXPClaim(attester, domain, claim);
      await contract.connect(user).claimReward(claim, sig);

      await expect(
        contract.connect(user).claimReward(claim, sig)
      ).to.be.revertedWith("nonce replay");
    });

    it("deve rejeitar claim expirado", async function () {
      const claim = {
        user: user.address,
        xpAmount: 50n,
        tokenAmount: 0n,
        badgeId: 0n,
        awardBadge: false,
        deadline: 1n, // timestamp no passado
        nonce: ethers.hexlify(nonce),
      };

      const sig = await signXPClaim(attester, domain, claim);

      await expect(
        contract.connect(user).claimReward(claim, sig)
      ).to.be.revertedWith("expired");
    });

    it("deve rejeitar se sender != user", async function () {
      const claim = {
        user: user.address,
        xpAmount: 50n,
        tokenAmount: 0n,
        badgeId: 0n,
        awardBadge: false,
        deadline: BigInt(deadline),
        nonce: ethers.hexlify(nonce),
      };

      const sig = await signXPClaim(attester, domain, claim);

      // user2 tenta reivindicar recompensa de user
      await expect(
        contract.connect(user2).claimReward(claim, sig)
      ).to.be.revertedWith("sender!=user");
    });

    it("deve conceder badge via claimReward", async function () {
      await contract.createBadge("Pioneer", "ipfs://Qm1", 0n);

      const claim = {
        user: user.address,
        xpAmount: 10n,
        tokenAmount: 0n,
        badgeId: 0n,
        awardBadge: true,
        deadline: BigInt(deadline),
        nonce: ethers.hexlify(nonce),
      };

      const sig = await signXPClaim(attester, domain, claim);
      await contract.connect(user).claimReward(claim, sig);

      expect(await contract.hasBadge(user.address, 0n)).to.equal(true);
    });
  });
});
