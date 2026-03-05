const hre = require("hardhat");

function parseBool(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  throw new Error(`Boolean inválido: ${value}`);
}

function requireAddress(name, value) {
  if (!value || !hre.ethers.isAddress(value)) {
    throw new Error(`${name} inválido: ${value || "vazio"}`);
  }
  return value;
}

function parseAddressList(name, value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((address, index) => requireAddress(`${name}[${index}]`, address));
}

function uniqueAddresses(addresses) {
  const seen = new Set();
  const out = [];
  for (const address of addresses) {
    const key = address.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(address);
  }
  return out;
}

async function waitTx(tx, label) {
  console.log(`⏳ ${label}: ${tx.hash}`);
  await tx.wait();
  console.log(`✅ ${label} confirmado`);
}

async function main() {
  const contractAddress = requireAddress(
    "FLOWPAY_CONTRACT_ADDRESS",
    process.env.FLOWPAY_CONTRACT_ADDRESS || process.argv[2]
  );
  const newWriter = requireAddress(
    "FLOWPAY_NEW_WRITER",
    process.env.FLOWPAY_NEW_WRITER || process.env.BLOCKCHAIN_WRITER_ADDRESS
  );
  const secondWriterRaw = process.env.FLOWPAY_NEW_SECOND_WRITER || "";
  const secondWriter = secondWriterRaw
    ? requireAddress("FLOWPAY_NEW_SECOND_WRITER", secondWriterRaw)
    : null;
  const extraWriters = parseAddressList(
    "FLOWPAY_EXTRA_WRITERS",
    process.env.FLOWPAY_EXTRA_WRITERS
  );
  const targetWriters = uniqueAddresses([
    newWriter,
    ...(secondWriter ? [secondWriter] : []),
    ...extraWriters,
  ]);
  const targetWriterSet = new Set(
    targetWriters.map((address) => address.toLowerCase())
  );

  const oldWriterRaw =
    process.env.FLOWPAY_OLD_WRITER || process.env.BLOCKCHAIN_WRITER_OLD || "";
  const oldWriter = oldWriterRaw
    ? requireAddress("FLOWPAY_OLD_WRITER", oldWriterRaw)
    : null;

  const safeOwnerRaw = process.env.FLOWPAY_SAFE_OWNER || "";
  const safeOwner = safeOwnerRaw
    ? requireAddress("FLOWPAY_SAFE_OWNER", safeOwnerRaw)
    : null;

  const guardianRaw = process.env.FLOWPAY_GUARDIAN || "";
  const guardian = guardianRaw
    ? requireAddress("FLOWPAY_GUARDIAN", guardianRaw)
    : null;

  const disableOwnerWriter = parseBool(
    process.env.FLOWPAY_DISABLE_OWNER_WRITER,
    true
  );

  const rewardAmountRaw = (process.env.FLOWPAY_REWARD_AMOUNT || "").trim();
  const rewardEnabledRaw = process.env.FLOWPAY_REWARD_ENABLED;
  const shouldConfigureReward =
    rewardAmountRaw !== "" || rewardEnabledRaw !== undefined;

  const [operator] = await hre.ethers.getSigners();
  const flowPay = await hre.ethers.getContractAt(
    "FlowPay",
    contractAddress,
    operator
  );
  const owner = await flowPay.owner();

  console.log("Bootstrap FlowPay iniciado");
  console.log("Network:", hre.network.name);
  console.log("Contract:", contractAddress);
  console.log("Operator:", operator.address);
  console.log("Owner atual:", owner);
  console.log("Writers alvo:", targetWriters.join(", "));

  if (owner.toLowerCase() !== operator.address.toLowerCase()) {
    throw new Error(
      "Signer atual não é owner. Ajuste PRIVATE_KEY para a chave do owner."
    );
  }

  for (const writer of targetWriters) {
    if (!(await flowPay.isProofWriter(writer))) {
      await waitTx(
        await flowPay.setProofWriter(writer, true),
        `setProofWriter(${writer},true)`
      );
    } else {
      console.log(`ℹ️ Writer já autorizado: ${writer}`);
    }
  }

  if (disableOwnerWriter && !targetWriterSet.has(owner.toLowerCase())) {
    if (await flowPay.isProofWriter(owner)) {
      await waitTx(
        await flowPay.setProofWriter(owner, false),
        "setProofWriter(owner,false)"
      );
    } else {
      console.log("ℹ️ Owner já não era writer");
    }
  }

  if (oldWriter && !targetWriterSet.has(oldWriter.toLowerCase())) {
    if (await flowPay.isProofWriter(oldWriter)) {
      await waitTx(
        await flowPay.setProofWriter(oldWriter, false),
        "setProofWriter(old,false)"
      );
    } else {
      console.log("ℹ️ Old writer já não estava autorizado");
    }
  }

  if (shouldConfigureReward) {
    const currentAmount = await flowPay.settlementRewardAmount();
    const currentEnabled = await flowPay.settlementRewardsEnabled();
    const targetAmount =
      rewardAmountRaw !== ""
        ? hre.ethers.parseEther(rewardAmountRaw)
        : currentAmount;
    const targetEnabled =
      rewardEnabledRaw !== undefined
        ? parseBool(rewardEnabledRaw, currentEnabled)
        : currentEnabled;

    if (currentAmount !== targetAmount || currentEnabled !== targetEnabled) {
      await waitTx(
        await flowPay.configureSettlementReward(targetAmount, targetEnabled),
        "configureSettlementReward"
      );
    } else {
      console.log("ℹ️ Configuração de reward já está no estado desejado");
    }
  }

  if (guardian) {
    const currentGuardian = await flowPay.guardian();
    if (currentGuardian.toLowerCase() !== guardian.toLowerCase()) {
      await waitTx(await flowPay.setGuardian(guardian), "setGuardian");
    } else {
      console.log("ℹ️ Guardian já está no endereço alvo");
    }
  }

  if (safeOwner && safeOwner.toLowerCase() !== owner.toLowerCase()) {
    await waitTx(
      await flowPay.transferOwnership(safeOwner),
      "transferOwnership(safe)"
    );
    console.log(
      "⚠️ Propriedade pendente. Próximo passo: executar acceptOwnership() a partir do Safe."
    );
  }

  console.log("\nResumo final:");
  console.log("owner:", await flowPay.owner());
  console.log("pendingOwner:", await flowPay.pendingOwner());
  for (const writer of targetWriters) {
    console.log(
      `writerEnabled(${writer}):`,
      await flowPay.isProofWriter(writer)
    );
  }
  if (oldWriter) {
    console.log("oldWriterEnabled:", await flowPay.isProofWriter(oldWriter));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
