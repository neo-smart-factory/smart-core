/**
 * NeoSocialTrigger — Test Suite
 * NΞØ SMART FACTORY v0.5.3 | TRIGGER-BASED SC | SOCIALFI
 *
 * Issue: #24 — Nova demanda para novos smart contracts
 * Repo: https://github.com/neo-smart-factory/smart-core
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ZERO = ethers.ZeroAddress;

// SocialAction enum (deve espelhar o contrato)
const SocialAction = {
  FOLLOW: 0,
  LIKE: 1,
  REPOST: 2,
  SUBSCRIBE: 3,
  COMMENT: 4,
};

function buildTriggerDomain(contractAddress, chainId) {
  return {
    name: "NeoSocialTrigger",
    version: "1.0.0",
    chainId,
    verifyingContract: contractAddress,
  };
}

const TriggerProofTypes = {
  TriggerProof: [
    { name: "user",         type: "address" },
    { name: "action",       type: "uint8"   },
    { name: "platform",     type: "string"  },
    { name: "targetHandle", type: "string"  },
    { name: "deadline",     type: "uint256" },
    { name: "nonce",        type: "bytes32" },
  ],
};

async function signTrigger(signer, domain, proof) {
  return signer.signTypedData(domain, TriggerProofTypes, proof);
}

// Mock do NeoGamification para testes isolados do NeoSocialTrigger
async function deployMockGamification() {
  // Usamos um contrato stub mínimo via Hardhat inline
  const MockGamification = await ethers.getContractFactory(
    // Reutilizamos o NeoGamification real como mock nos testes integrados
    "NeoGamification"
  );
  const [deployer, attester] = await ethers.getSigners();
  const mock = await MockGamification.deploy(ZERO, attester.address);
  await mock.waitForDeployment();
  return mock;
}

async function deployTrigger({ gamification = ZERO, attester } = {}) {
  const [, , , att] = await ethers.getSigners();
  const _attester = attester || att.address;

  const F = await ethers.getContractFactory("NeoSocialTrigger");
  const trigger = await F.deploy(gamification, _attester);
  await trigger.waitForDeployment();
  return trigger;
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe("NeoSocialTrigger", function () {
  let trigger;
  let owner, user, user2, attester, other;
  let domain;
  let chainId;

  beforeEach(async function () {
    [owner, user, user2, attester, other] = await ethers.getSigners();

    const F = await ethers.getContractFactory("NeoSocialTrigger");
    trigger = await F.deploy(ZERO, attester.address);
    await trigger.waitForDeployment();

    const net = await ethers.provider.getNetwork();
    chainId = net.chainId;
    domain = buildTriggerDomain(await trigger.getAddress(), chainId);
  });

  // ─── Deploy ───────────────────────────────────────────────────────────────

  describe("Deploy", function () {
    it("deve definir owner corretamente", async function () {
      expect(await trigger.owner()).to.equal(owner.address);
    });

    it("deve definir attester corretamente", async function () {
      expect(await trigger.attester()).to.equal(attester.address);
    });

    it("deve reverter se attester for zero", async function () {
      const F = await ethers.getContractFactory("NeoSocialTrigger");
      await expect(F.deploy(ZERO, ZERO)).to.be.revertedWith("attester=0");
    });
  });

  // ─── Admin ────────────────────────────────────────────────────────────────

  describe("Admin", function () {
    it("setAttester deve atualizar attester e emitir evento", async function () {
      await expect(trigger.setAttester(user2.address))
        .to.emit(trigger, "AttesterUpdated")
        .withArgs(attester.address, user2.address);

      expect(await trigger.attester()).to.equal(user2.address);
    });

    it("setAttester deve reverter para zero", async function () {
      await expect(trigger.setAttester(ZERO)).to.be.revertedWith("attester=0");
    });

    it("setGamification deve atualizar contrato e emitir evento", async function () {
      await expect(trigger.setGamification(user2.address))
        .to.emit(trigger, "GamificationSet")
        .withArgs(user2.address);
    });

    it("não-owner não pode chamar setAttester", async function () {
      await expect(
        trigger.connect(user).setAttester(user2.address)
      ).to.be.reverted;
    });

    it("setActionConfig deve configurar e emitir ActionConfigSet", async function () {
      await expect(
        trigger.setActionConfig(
          SocialAction.FOLLOW,
          50n,  // xpAmount
          0n,   // tokenAmount
          false, // awardsBadge
          0n,   // badgeId
          true  // enabled
        )
      )
        .to.emit(trigger, "ActionConfigSet")
        .withArgs(SocialAction.FOLLOW, 50n, 0n, false, 0n, true);

      const config = await trigger.getActionConfig(SocialAction.FOLLOW);
      expect(config.xpAmount).to.equal(50n);
      expect(config.enabled).to.equal(true);
    });
  });

  // ─── executeTrigger ───────────────────────────────────────────────────────

  describe("executeTrigger", function () {
    let deadline;
    let nonce;

    beforeEach(async function () {
      // Habilita FOLLOW com 50 XP
      await trigger.setActionConfig(
        SocialAction.FOLLOW, 50n, 0n, false, 0n, true
      );
      // Habilita LIKE com 20 XP
      await trigger.setActionConfig(
        SocialAction.LIKE, 20n, 0n, false, 0n, true
      );

      const block = await ethers.provider.getBlock("latest");
      deadline = block.timestamp + 3600;
      nonce = ethers.randomBytes(32);
    });

    it("deve executar trigger FOLLOW e emitir TriggerExecuted", async function () {
      const proof = {
        user: user.address,
        action: SocialAction.FOLLOW,
        platform: "x",
        targetHandle: "@neoflowoff.eth",
        deadline: BigInt(deadline),
        nonce: ethers.hexlify(nonce),
      };

      const sig = await signTrigger(attester, domain, proof);
      const tx = await trigger.connect(user).executeTrigger(proof, sig);
      const receipt = await tx.wait();

      // Verifica que o evento foi emitido com os campos corretos
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "TriggerExecuted"
      );
      expect(event).to.not.be.undefined;
      expect(event.args[0]).to.equal(user.address);            // user
      expect(event.args[1]).to.equal(BigInt(SocialAction.FOLLOW)); // action
      expect(event.args[2]).to.equal("x");                     // platform
      expect(event.args[3]).to.equal("@neoflowoff.eth");       // targetHandle
    });

    it("deve reverter se ação não estiver habilitada", async function () {
      const proof = {
        user: user.address,
        action: SocialAction.COMMENT, // não configurado
        platform: "x",
        targetHandle: "@neoflowoff.eth",
        deadline: BigInt(deadline),
        nonce: ethers.hexlify(nonce),
      };

      const sig = await signTrigger(attester, domain, proof);

      await expect(
        trigger.connect(user).executeTrigger(proof, sig)
      ).to.be.revertedWith("action not enabled");
    });

    it("deve reverter se assinatura for de não-attester", async function () {
      const proof = {
        user: user.address,
        action: SocialAction.FOLLOW,
        platform: "x",
        targetHandle: "@neoflowoff.eth",
        deadline: BigInt(deadline),
        nonce: ethers.hexlify(nonce),
      };

      const sig = await signTrigger(other, domain, proof); // assinado por other

      await expect(
        trigger.connect(user).executeTrigger(proof, sig)
      ).to.be.revertedWith("bad sig");
    });

    it("deve reverter em nonce replay", async function () {
      const proof = {
        user: user.address,
        action: SocialAction.FOLLOW,
        platform: "x",
        targetHandle: "@neoflowoff.eth",
        deadline: BigInt(deadline),
        nonce: ethers.hexlify(nonce),
      };

      const sig = await signTrigger(attester, domain, proof);
      await trigger.connect(user).executeTrigger(proof, sig);

      await expect(
        trigger.connect(user).executeTrigger(proof, sig)
      ).to.be.revertedWith("nonce replay");
    });

    it("deve reverter se proof expirou", async function () {
      const proof = {
        user: user.address,
        action: SocialAction.FOLLOW,
        platform: "x",
        targetHandle: "@neoflowoff.eth",
        deadline: 1n, // passado
        nonce: ethers.hexlify(nonce),
      };

      const sig = await signTrigger(attester, domain, proof);

      await expect(
        trigger.connect(user).executeTrigger(proof, sig)
      ).to.be.revertedWith("expired");
    });

    it("deve reverter se sender != user", async function () {
      const proof = {
        user: user.address,
        action: SocialAction.FOLLOW,
        platform: "x",
        targetHandle: "@neoflowoff.eth",
        deadline: BigInt(deadline),
        nonce: ethers.hexlify(nonce),
      };

      const sig = await signTrigger(attester, domain, proof);

      await expect(
        trigger.connect(user2).executeTrigger(proof, sig) // user2 tenta usar prova de user
      ).to.be.revertedWith("sender!=user");
    });

    it("deve consumir nonce após execução (usedNonce = true)", async function () {
      const proof = {
        user: user.address,
        action: SocialAction.FOLLOW,
        platform: "x",
        targetHandle: "@neoflowoff.eth",
        deadline: BigInt(deadline),
        nonce: ethers.hexlify(nonce),
      };

      const sig = await signTrigger(attester, domain, proof);
      await trigger.connect(user).executeTrigger(proof, sig);

      expect(await trigger.usedNonce(ethers.hexlify(nonce))).to.equal(true);
    });
  });

  // ─── Integração com NeoGamification ──────────────────────────────────────

  describe("Integração NeoSocialTrigger ↔ NeoGamification", function () {
    let gamification;
    let triggerWithGamification;
    let deadline;
    let nonce;
    let intDomain;

    beforeEach(async function () {
      // Deploy NeoGamification
      const GF = await ethers.getContractFactory("NeoGamification");
      gamification = await GF.deploy(ZERO, attester.address);
      await gamification.waitForDeployment();

      // Deploy NeoSocialTrigger apontando para o gamification
      const TF = await ethers.getContractFactory("NeoSocialTrigger");
      triggerWithGamification = await TF.deploy(
        await gamification.getAddress(),
        attester.address
      );
      await triggerWithGamification.waitForDeployment();

      // Registra o trigger como operador no gamification
      await gamification.setOperator(
        await triggerWithGamification.getAddress(),
        true
      );

      // Configura FOLLOW com 50 XP
      await triggerWithGamification.setActionConfig(
        SocialAction.FOLLOW, 50n, 0n, false, 0n, true
      );

      const net = await ethers.provider.getNetwork();
      intDomain = buildTriggerDomain(
        await triggerWithGamification.getAddress(),
        net.chainId
      );

      const block = await ethers.provider.getBlock("latest");
      deadline = block.timestamp + 3600;
      nonce = ethers.randomBytes(32);
    });

    it("executeTrigger deve conceder XP no NeoGamification", async function () {
      const proof = {
        user: user.address,
        action: SocialAction.FOLLOW,
        platform: "x",
        targetHandle: "@neoflowoff.eth",
        deadline: BigInt(deadline),
        nonce: ethers.hexlify(nonce),
      };

      const sig = await signTrigger(attester, intDomain, proof);
      await triggerWithGamification.connect(user).executeTrigger(proof, sig);

      const profile = await gamification.getProfile(user.address);
      expect(profile.xp).to.equal(50n);
      expect(profile.level).to.equal(0n); // SEED
    });

    it("XP deve acumular após múltiplos triggers", async function () {
      for (let i = 0; i < 3; i++) {
        const n = ethers.randomBytes(32);
        const proof = {
          user: user.address,
          action: SocialAction.FOLLOW,
          platform: "x",
          targetHandle: "@neoflowoff.eth",
          deadline: BigInt(deadline),
          nonce: ethers.hexlify(n),
        };
        const sig = await signTrigger(attester, intDomain, proof);
        await triggerWithGamification.connect(user).executeTrigger(proof, sig);
      }

      const profile = await gamification.getProfile(user.address);
      expect(profile.xp).to.be.gte(150n); // 3 × 50 XP (pode ter streak bonus)
    });
  });
});

