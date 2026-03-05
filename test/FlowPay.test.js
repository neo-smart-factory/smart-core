const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FlowPay", function () {
  let flowPay;
  let owner;
  let writer;
  let user;

  beforeEach(async function () {
    [owner, writer, user] = await ethers.getSigners();
    const FlowPay = await ethers.getContractFactory("FlowPay");
    flowPay = await FlowPay.deploy(owner.address);
    await flowPay.waitForDeployment();
  });

  describe("Proof Registry", function () {
    it("registers proof with backend-compatible signature", async function () {
      await flowPay.setProofWriter(writer.address, true);

      const proofId = ethers.keccak256(ethers.toUtf8Bytes("proof-1"));
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("settlement-1"));
      const pixChargeId = "pix_12345";
      const metadata = JSON.stringify({
        amountBRL: 100,
        amountUSDT: 18.5,
        network: "base",
      });

      await expect(
        flowPay
          .connect(writer)
          .recordProof(proofId, pixChargeId, txHash, metadata)
      )
        .to.emit(flowPay, "ProofRecorded")
        .withArgs(
          proofId,
          ethers.keccak256(ethers.toUtf8Bytes(pixChargeId)),
          txHash,
          writer.address,
          pixChargeId,
          metadata,
          ethers.keccak256(ethers.toUtf8Bytes(metadata))
        );

      const proof = await flowPay.getProof(proofId);
      expect(proof.exists).to.equal(true);
      expect(proof.writer).to.equal(writer.address);
      expect(proof.settlementTxHash).to.equal(txHash);

      const indexedId = await flowPay.getProofIdByPixChargeId(pixChargeId);
      expect(indexedId).to.equal(proofId);
    });

    it("rejects unauthorized proof writer", async function () {
      const proofId = ethers.keccak256(
        ethers.toUtf8Bytes("proof-unauthorized")
      );
      const txHash = ethers.keccak256(
        ethers.toUtf8Bytes("settlement-unauthorized")
      );

      await expect(
        flowPay
          .connect(user)
          .recordProof(proofId, "pix_forbidden", txHash, "{}")
      ).to.be.revertedWithCustomError(flowPay, "UnauthorizedProofWriter");
    });

    it("is idempotent when pixChargeId and payload are the same", async function () {
      await flowPay.setProofWriter(writer.address, true);

      const proofIdA = ethers.keccak256(ethers.toUtf8Bytes("proof-same-A"));
      const proofIdB = ethers.keccak256(ethers.toUtf8Bytes("proof-same-B"));
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("settlement-same"));
      const pixChargeId = "pix_same";
      const metadata = '{"mode":"idempotent"}';

      await flowPay
        .connect(writer)
        .recordProof(proofIdA, pixChargeId, txHash, metadata);
      await expect(
        flowPay
          .connect(writer)
          .recordProof(proofIdB, pixChargeId, txHash, metadata)
      ).to.not.be.reverted;

      const indexedId = await flowPay.getProofIdByPixChargeId(pixChargeId);
      expect(indexedId).to.equal(proofIdA);

      await expect(flowPay.getProof(proofIdB)).to.be.revertedWithCustomError(
        flowPay,
        "ProofNotFound"
      );
    });

    it("rejects conflicting duplicate pixChargeId", async function () {
      await flowPay.setProofWriter(writer.address, true);

      const proofIdA = ethers.keccak256(ethers.toUtf8Bytes("proof-conflict-A"));
      const proofIdB = ethers.keccak256(ethers.toUtf8Bytes("proof-conflict-B"));
      const txHashA = ethers.keccak256(
        ethers.toUtf8Bytes("settlement-conflict-A")
      );
      const txHashB = ethers.keccak256(
        ethers.toUtf8Bytes("settlement-conflict-B")
      );
      const pixChargeId = "pix_conflict";

      await flowPay
        .connect(writer)
        .recordProof(proofIdA, pixChargeId, txHashA, '{"ok":1}');

      await expect(
        flowPay
          .connect(writer)
          .recordProof(proofIdB, pixChargeId, txHashB, '{"ok":2}')
      ).to.be.revertedWithCustomError(flowPay, "PixChargeAlreadyRegistered");
    });
  });

  describe("Settlement Rewards", function () {
    it("mints reward using default configured amount", async function () {
      await flowPay.setProofWriter(writer.address, true);
      const rewardAmount = ethers.parseEther("25");
      const rewardReference = ethers.keccak256(ethers.toUtf8Bytes("reward-1"));

      await flowPay.configureSettlementReward(rewardAmount, true);

      await expect(
        flowPay
          .connect(writer)
          .mintSettlementReward(user.address, 0, rewardReference)
      )
        .to.emit(flowPay, "SettlementRewardMinted")
        .withArgs(rewardReference, user.address, rewardAmount, writer.address);

      expect(await flowPay.balanceOf(user.address)).to.equal(rewardAmount);
    });

    it("prevents duplicate reward reference usage", async function () {
      await flowPay.setProofWriter(writer.address, true);
      const rewardAmount = ethers.parseEther("10");
      const rewardReference = ethers.keccak256(
        ethers.toUtf8Bytes("reward-dup")
      );

      await flowPay.configureSettlementReward(rewardAmount, true);
      await flowPay
        .connect(writer)
        .mintSettlementReward(user.address, rewardAmount, rewardReference);

      await expect(
        flowPay
          .connect(writer)
          .mintSettlementReward(user.address, rewardAmount, rewardReference)
      ).to.be.revertedWithCustomError(flowPay, "RewardReferenceAlreadyUsed");
    });

    it("reverts if reward minting is disabled", async function () {
      await flowPay.setProofWriter(writer.address, true);
      const rewardReference = ethers.keccak256(
        ethers.toUtf8Bytes("reward-disabled")
      );

      await expect(
        flowPay
          .connect(writer)
          .mintSettlementReward(
            user.address,
            ethers.parseEther("1"),
            rewardReference
          )
      ).to.be.revertedWithCustomError(flowPay, "RewardMintingDisabled");
    });
  });
});
