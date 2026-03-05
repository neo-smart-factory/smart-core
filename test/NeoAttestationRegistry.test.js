/**
 * NeoAttestationRegistry — Test Suite
 * NEØ SMART FACTORY v0.5.3 - PROTOCOL | ATTESTATION
 *
 * Caso real de fixture:
 * Aprovação da identidade visual do FlowPay-Core em 21/02/2026
 * Repositório: https://github.com/FlowPay-Core
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

// ─── Helper: gerar contentHash off-chain (padrão do protocolo) ───────────────
function makeContentHash(data) {
  return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(data)));
}

// ─── Fixture: caso real FlowPay-Core ─────────────────────────────────────────
const FLOWPAY_EVENT = {
  project:    "FlowPay-Core",
  event:      "visual_identity_approved",
  date:       "2026-02-21",
  repo:       "https://github.com/FlowPay-Core",
  approvedBy: "NEO_MELLO",
};
const FLOWPAY_METADATA =
  "FlowPay-Core: aprovação da identidade visual — github.com/FlowPay-Core";
const FLOWPAY_HASH = makeContentHash(FLOWPAY_EVENT);

// ─────────────────────────────────────────────────────────────────────────────

describe("NeoAttestationRegistry", function () {
  let registry;
  let guardian, attester, other, newGuardian;

  beforeEach(async function () {
    [guardian, attester, other, newGuardian] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("NeoAttestationRegistry");
    registry = await Factory.deploy(guardian.address);
    await registry.waitForDeployment();
  });

  // ─── Deployment ─────────────────────────────────────────────────────────────
  describe("Deploy", function () {
    it("define o guardian correto", async function () {
      expect(await registry.guardian()).to.equal(guardian.address);
    });

    it("reverte se guardian for address(0)", async function () {
      const Factory = await ethers.getContractFactory("NeoAttestationRegistry");
      await expect(Factory.deploy(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(registry, "ZeroAddress");
    });

    it("expõe constantes de protocolo corretas", async function () {
      expect(await registry.MODULE()).to.equal("NeoAttestationRegistry");
      expect(await registry.VERSION()).to.equal("1.0.0");
    });
  });

  // ─── Whitelist Management ───────────────────────────────────────────────────
  describe("addAttester / removeAttester", function () {
    it("guardian adiciona attester", async function () {
      await expect(registry.connect(guardian).addAttester(attester.address))
        .to.emit(registry, "AttesterAdded")
        .withArgs(attester.address);

      expect(await registry.isAttester(attester.address)).to.be.true;
    });

    it("revert NotGuardian se não for guardian", async function () {
      await expect(registry.connect(other).addAttester(attester.address))
        .to.be.revertedWithCustomError(registry, "NotGuardian");
    });

    it("revert ZeroAddress ao adicionar address(0)", async function () {
      await expect(registry.connect(guardian).addAttester(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(registry, "ZeroAddress");
    });

    it("revert AlreadyAttester se já está na whitelist", async function () {
      await registry.connect(guardian).addAttester(attester.address);
      await expect(registry.connect(guardian).addAttester(attester.address))
        .to.be.revertedWithCustomError(registry, "AlreadyAttester");
    });

    it("guardian remove attester", async function () {
      await registry.connect(guardian).addAttester(attester.address);

      await expect(registry.connect(guardian).removeAttester(attester.address))
        .to.emit(registry, "AttesterRemoved")
        .withArgs(attester.address);

      expect(await registry.isAttester(attester.address)).to.be.false;
    });

    it("revert NotAnAttester ao remover quem não está na whitelist", async function () {
      await expect(registry.connect(guardian).removeAttester(other.address))
        .to.be.revertedWithCustomError(registry, "NotAnAttester");
    });
  });

  // ─── registerAttestation ────────────────────────────────────────────────────
  describe("registerAttestation", function () {
    beforeEach(async function () {
      await registry.connect(guardian).addAttester(attester.address);
    });

    it("registra prova e emite evento correto", async function () {
      const tx = registry
        .connect(attester)
        .registerAttestation(FLOWPAY_HASH, FLOWPAY_METADATA);

      await expect(tx)
        .to.emit(registry, "AttestationRegistered")
        .withArgs(
          FLOWPAY_HASH,
          attester.address,
          // timestamp: qualquer valor > 0
          (ts) => ts > 0n,
          FLOWPAY_METADATA
        );
    });

    it("armazena os dados corretamente (caso FlowPay-Core)", async function () {
      await registry.connect(attester).registerAttestation(FLOWPAY_HASH, FLOWPAY_METADATA);

      const att = await registry.getAttestation(FLOWPAY_HASH);
      expect(att.contentHash).to.equal(FLOWPAY_HASH);
      expect(att.attester).to.equal(attester.address);
      expect(att.metadata).to.equal(FLOWPAY_METADATA);
      expect(att.revoked).to.be.false;
      expect(att.timestamp).to.be.gt(0n);
    });

    it("revert NotAttester se não estiver na whitelist", async function () {
      await expect(
        registry.connect(other).registerAttestation(FLOWPAY_HASH, FLOWPAY_METADATA)
      ).to.be.revertedWithCustomError(registry, "NotAttester");
    });

    it("revert InvalidHash se contentHash for bytes32(0)", async function () {
      await expect(
        registry.connect(attester).registerAttestation(ethers.ZeroHash, "meta")
      ).to.be.revertedWithCustomError(registry, "InvalidHash");
    });

    it("revert AttestationAlreadyExists em duplicata", async function () {
      await registry.connect(attester).registerAttestation(FLOWPAY_HASH, FLOWPAY_METADATA);
      await expect(
        registry.connect(attester).registerAttestation(FLOWPAY_HASH, "outro meta")
      ).to.be.revertedWithCustomError(registry, "AttestationAlreadyExists");
    });
  });

  // ─── verifyAttestation ──────────────────────────────────────────────────────
  describe("verifyAttestation", function () {
    beforeEach(async function () {
      await registry.connect(guardian).addAttester(attester.address);
      await registry.connect(attester).registerAttestation(FLOWPAY_HASH, FLOWPAY_METADATA);
    });

    it("retorna (true, false, timestamp) para prova válida", async function () {
      const [exists, revoked, timestamp] = await registry.verifyAttestation(FLOWPAY_HASH);
      expect(exists).to.be.true;
      expect(revoked).to.be.false;
      expect(timestamp).to.be.gt(0n);
    });

    it("retorna (false, false, 0) para hash inexistente — nunca reverte", async function () {
      const randomHash = ethers.keccak256(ethers.toUtf8Bytes("nao-existe"));
      const [exists, revoked, timestamp] = await registry.verifyAttestation(randomHash);
      expect(exists).to.be.false;
      expect(revoked).to.be.false;
      expect(timestamp).to.equal(0n);
    });
  });

  // ─── getAttestation ─────────────────────────────────────────────────────────
  describe("getAttestation", function () {
    it("revert AttestationNotFound para hash inexistente", async function () {
      const randomHash = ethers.keccak256(ethers.toUtf8Bytes("nao-existe"));
      await expect(registry.getAttestation(randomHash))
        .to.be.revertedWithCustomError(registry, "AttestationNotFound");
    });
  });

  // ─── revokeAttestation ──────────────────────────────────────────────────────
  describe("revokeAttestation", function () {
    beforeEach(async function () {
      await registry.connect(guardian).addAttester(attester.address);
      await registry.connect(attester).registerAttestation(FLOWPAY_HASH, FLOWPAY_METADATA);
    });

    it("guardian revoga qualquer prova", async function () {
      await expect(registry.connect(guardian).revokeAttestation(FLOWPAY_HASH))
        .to.emit(registry, "AttestationRevoked")
        .withArgs(FLOWPAY_HASH, guardian.address, (ts) => ts > 0n);

      const [, revoked] = await registry.verifyAttestation(FLOWPAY_HASH);
      expect(revoked).to.be.true;
    });

    it("attester original revoga sua própria prova", async function () {
      await expect(registry.connect(attester).revokeAttestation(FLOWPAY_HASH))
        .to.emit(registry, "AttestationRevoked")
        .withArgs(FLOWPAY_HASH, attester.address, (ts) => ts > 0n);
    });

    it("revert Unauthorized se não for guardian nem attester original", async function () {
      await expect(registry.connect(other).revokeAttestation(FLOWPAY_HASH))
        .to.be.revertedWithCustomError(registry, "Unauthorized");
    });

    it("revert AttestationNotFound para hash inexistente", async function () {
      const randomHash = ethers.keccak256(ethers.toUtf8Bytes("nao-existe"));
      await expect(registry.connect(guardian).revokeAttestation(randomHash))
        .to.be.revertedWithCustomError(registry, "AttestationNotFound");
    });

    it("dados preservados após revogação (histórico imutável)", async function () {
      await registry.connect(guardian).revokeAttestation(FLOWPAY_HASH);
      const att = await registry.getAttestation(FLOWPAY_HASH);
      // dados preservados
      expect(att.contentHash).to.equal(FLOWPAY_HASH);
      expect(att.metadata).to.equal(FLOWPAY_METADATA);
      expect(att.attester).to.equal(attester.address);
      // apenas flag de revogação mudou
      expect(att.revoked).to.be.true;
    });
  });

  // ─── transferGuardian ───────────────────────────────────────────────────────
  describe("transferGuardian", function () {
    it("guardian transfere controle para novo endereço", async function () {
      await expect(
        registry.connect(guardian).transferGuardian(newGuardian.address)
      )
        .to.emit(registry, "GuardianTransferred")
        .withArgs(guardian.address, newGuardian.address);

      expect(await registry.guardian()).to.equal(newGuardian.address);
    });

    it("antigo guardian perde acesso após transferência", async function () {
      await registry.connect(guardian).transferGuardian(newGuardian.address);
      await expect(registry.connect(guardian).addAttester(other.address))
        .to.be.revertedWithCustomError(registry, "NotGuardian");
    });

    it("revert ZeroAddress ao transferir para address(0)", async function () {
      await expect(
        registry.connect(guardian).transferGuardian(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(registry, "ZeroAddress");
    });

    it("revert NotGuardian se não for o guardian", async function () {
      await expect(
        registry.connect(other).transferGuardian(newGuardian.address)
      ).to.be.revertedWithCustomError(registry, "NotGuardian");
    });
  });
});
