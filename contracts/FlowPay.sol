// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  NΞØ SMART FACTORY v0.5.3 - NΞØ PROTOCOL | FLOWPAY | NEØFLOWOFF
 *  Author: NΞØ MELLØ
 *
 *  Licensed under MIT.
 *  "Powered by NΞØ SMART FACTORY"
 */

import "./NeoTokenV2.sol";

/**
 * @title FlowPay
 * @notice Token oficial do ecossistema FlowPay com camada nativa de prova on-chain.
 * @dev Mantém a base NeoTokenV2 e adiciona:
 *      1) registro de prova de transações (compatível com flowpay/services/blockchain/write-proof.js)
 *      2) emissão opcional de recompensa de liquidação para geração de valor do token.
 */
contract FlowPay is NeoTokenV2 {
    struct ProofRecord {
        bytes32 proofId;
        bytes32 pixChargeIdHash;
        bytes32 settlementTxHash;
        address writer;
        uint64 recordedAt;
        bytes32 metadataHash;
        bool exists;
    }

    error UnauthorizedProofWriter();
    error InvalidWriter();
    error InvalidProofId();
    error InvalidSettlementTxHash();
    error EmptyPixChargeId();
    error ProofAlreadyRegistered(bytes32 proofId);
    error PixChargeAlreadyRegistered(bytes32 pixChargeIdHash);
    error ProofNotFound(bytes32 proofId);
    error RewardMintingDisabled();
    error InvalidRewardRecipient();
    error InvalidRewardReference();
    error InvalidRewardAmount();
    error RewardReferenceAlreadyUsed(bytes32 rewardReference);

    event ProofWriterUpdated(address indexed writer, bool enabled);
    event ProofRecorded(
        bytes32 indexed proofId,
        bytes32 indexed pixChargeIdHash,
        bytes32 indexed settlementTxHash,
        address writer,
        string pixChargeId,
        string metadata,
        bytes32 metadataHash
    );
    event SettlementRewardConfigured(uint256 rewardAmount, bool enabled);
    event SettlementRewardMinted(
        bytes32 indexed rewardReference,
        address indexed recipient,
        uint256 amount,
        address indexed operator
    );

    mapping(address => bool) public isProofWriter;
    mapping(bytes32 => ProofRecord) private _proofById;
    mapping(bytes32 => bytes32) private _proofIdByPixHash;
    mapping(bytes32 => bool) public rewardReferenceUsed;

    uint256 public settlementRewardAmount;
    bool public settlementRewardsEnabled;

    modifier onlyProofWriter() {
        if (!isProofWriter[msg.sender]) revert UnauthorizedProofWriter();
        _;
    }

    constructor(
        address initialOwner
    )
        NeoTokenV2(
            "FlowPay",
            "NEOPAY",
            0.003 ether, // Preço padrão de mint para a Factory
            1000 * 10**18, // 1,000 tokens por mint público
            initialOwner
        )
    {
        if (initialOwner == address(0)) revert InvalidWriter();
        isProofWriter[initialOwner] = true;
        emit ProofWriterUpdated(initialOwner, true);
    }

    /**
     * @notice Define quais endereços podem escrever provas de transação.
     * @dev Owner deve incluir a wallet de automação usada em flowpay (BLOCKCHAIN_WRITER_ADDRESS).
     */
    function setProofWriter(address writer, bool enabled) external onlyOwner {
        if (writer == address(0)) revert InvalidWriter();
        isProofWriter[writer] = enabled;
        emit ProofWriterUpdated(writer, enabled);
    }

    /**
     * @notice Registra prova de pagamento/liquidação no padrão esperado pelo backend FlowPay.
     * @dev Assinatura compatível com flowpay/services/blockchain/write-proof.js.
     */
    function recordProof(
        bytes32 proofId,
        string calldata pixChargeId,
        bytes32 txHash,
        string calldata metadata
    ) external whenNotPaused onlyProofWriter returns (bool) {
        _recordProof(proofId, pixChargeId, txHash, metadata);
        return true;
    }

    /**
     * @notice Configura o valor padrão de recompensa de liquidação e seu status.
     * @param rewardAmount Quantidade de FLOW (18 decimais) por recompensa.
     * @param enabled true para habilitar emissão via mintSettlementReward.
     */
    function configureSettlementReward(uint256 rewardAmount, bool enabled) external onlyOwner {
        settlementRewardAmount = rewardAmount;
        settlementRewardsEnabled = enabled;
        emit SettlementRewardConfigured(rewardAmount, enabled);
    }

    /**
     * @notice Minta recompensa de liquidação para criar valor de uso do token NEOPAY no fluxo do checkout.
     * @param recipient Carteira do recebedor da recompensa.
     * @param amount Quantidade de NEOPAY (0 usa settlementRewardAmount configurado).
     * @param rewardReference ID único da recompensa (ex: keccak256(pixChargeId)).
     */
    function mintSettlementReward(
        address recipient,
        uint256 amount,
        bytes32 rewardReference
    ) external whenNotPaused onlyProofWriter returns (bool) {
        uint256 mintAmount = amount == 0 ? settlementRewardAmount : amount;

        if (!settlementRewardsEnabled) revert RewardMintingDisabled();
        if (recipient == address(0)) revert InvalidRewardRecipient();
        if (rewardReference == bytes32(0)) revert InvalidRewardReference();
        if (mintAmount == 0) revert InvalidRewardAmount();
        if (rewardReferenceUsed[rewardReference]) revert RewardReferenceAlreadyUsed(rewardReference);
        require(totalSupply() + mintAmount <= MAX_SUPPLY, "Max supply reached");

        rewardReferenceUsed[rewardReference] = true;
        _mint(recipient, mintAmount);

        emit SettlementRewardMinted(rewardReference, recipient, mintAmount, msg.sender);
        return true;
    }

    function getProof(bytes32 proofId) external view returns (ProofRecord memory) {
        ProofRecord memory proof = _proofById[proofId];
        if (!proof.exists) revert ProofNotFound(proofId);
        return proof;
    }

    function getProofIdByPixChargeId(string calldata pixChargeId) external view returns (bytes32) {
        return _proofIdByPixHash[keccak256(bytes(pixChargeId))];
    }

    function hasProof(bytes32 proofId) external view returns (bool) {
        return _proofById[proofId].exists;
    }

    function _recordProof(
        bytes32 proofId,
        string calldata pixChargeId,
        bytes32 txHash,
        string calldata metadata
    ) internal {
        if (proofId == bytes32(0)) revert InvalidProofId();
        if (txHash == bytes32(0)) revert InvalidSettlementTxHash();
        if (bytes(pixChargeId).length == 0) revert EmptyPixChargeId();

        bytes32 pixHash = keccak256(bytes(pixChargeId));
        bytes32 metadataHash = keccak256(bytes(metadata));
        bytes32 existingProofId = _proofIdByPixHash[pixHash];

        if (existingProofId != bytes32(0)) {
            ProofRecord storage existingByPix = _proofById[existingProofId];
            if (
                existingByPix.settlementTxHash == txHash &&
                existingByPix.metadataHash == metadataHash
            ) {
                return;
            }
            revert PixChargeAlreadyRegistered(pixHash);
        }

        ProofRecord storage existingById = _proofById[proofId];
        if (existingById.exists) {
            if (
                existingById.pixChargeIdHash == pixHash &&
                existingById.settlementTxHash == txHash &&
                existingById.metadataHash == metadataHash
            ) {
                return;
            }
            revert ProofAlreadyRegistered(proofId);
        }

        _proofById[proofId] = ProofRecord({
            proofId: proofId,
            pixChargeIdHash: pixHash,
            settlementTxHash: txHash,
            writer: msg.sender,
            recordedAt: uint64(block.timestamp),
            metadataHash: metadataHash,
            exists: true
        });
        _proofIdByPixHash[pixHash] = proofId;

        emit ProofRecorded(
            proofId,
            pixHash,
            txHash,
            msg.sender,
            pixChargeId,
            metadata,
            metadataHash
        );
    }
}

/**
 *  █▀▀ █░░ █▀█ █░▄░█ █▀█ ▄▀█ █▄█
 *  █▀░ █▄▄ █▄█ ▀▄▀▄▀ █▀▀ █▀█ ░█
 *
 *  NΞØ SMART FACTORY v0.5.3 - NEØ PROTOCOL | FLOWPAY
 *  Author: NEØ MELLØ
 *
 *  Licensed under MIT. Attribution to NΞØ Protocol is required for derivatives.
 *  "Powered by NEO SMART FACTORY"
 */
