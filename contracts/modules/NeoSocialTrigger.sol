// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  NΞØ SMART FACTORY v0.5.3 — TRIGGER-BASED SC | SOCIALFI
 *  Author: Eurycles Ramos Neto / NODE NEØ
 *
 *  Licensed under MIT. Attribution to NΞØ Protocol is required for derivatives.
 *  Any fork or usage of this factory for financial protocols must reference:
 *  "Powered by NEO SMART FACTORY"
 */

/**
 * @title NeoSocialTrigger
 * @notice Trigger-based Smart Contract para SocialFi.
 *         Permite que ações sociais off-chain (follow, like, repost, etc.)
 *         disparem recompensas on-chain via prova assinada por um oracle confiável.
 *
 * @dev Arquitetura Oracle:
 *   1. Usuário executa ação social em plataforma Web2 (X, Instagram, etc.)
 *   2. Oracle (Attester) — NODE NEØ / MCP — valida a ação via API da plataforma
 *   3. Attester assina TriggerProof (EIP-712) com os dados da ação
 *   4. Usuário submete a prova on-chain via executeTrigger()
 *   5. Contrato verifica assinatura, consome nonce e roteia para NeoGamification
 *   6. Eventos emitidos são indexados pelo backend para analytics e notificações
 *
 *   Por que não Chainlink direto?
 *   - Chainlink Functions seria viável mas adiciona latência e custo por ação
 *   - O modelo de attester off-chain é mais eficiente para ações sociais de alta frequência
 *   - Chainlink pode ser integrado futuramente na camada de oracle como validador adicional
 *   - Referência: NeoXFollowGate.sol já estabeleceu este padrão no protocolo
 *
 * Ações Suportadas:
 *   FOLLOW, LIKE, REPOST, SUBSCRIBE, COMMENT
 *
 * Plataformas:
 *   Qualquer string identificadora: "x", "instagram", "tiktok", "youtube", etc.
 */

// =========================================================
// INTERFACE — NeoGamification
// =========================================================

interface INeoGamification {
    function awardXP(
        address user,
        uint256 xpAmount,
        uint256 tokenAmount,
        string calldata reason
    ) external;

    function awardBadge(address user, uint256 badgeId) external;
}

// =========================================================
// CONTRACT
// =========================================================

contract NeoSocialTrigger is Ownable, EIP712 {
    using ECDSA for bytes32;

    // =========================================================
    // TIPOS DE AÇÃO SOCIAL
    // =========================================================

    enum SocialAction {
        FOLLOW,     // 0 — Seguiu o perfil alvo
        LIKE,       // 1 — Curtiu uma publicação
        REPOST,     // 2 — Compartilhou / retweetou
        SUBSCRIBE,  // 3 — Assinou canal / newsletter
        COMMENT     // 4 — Comentou em publicação
    }

    // =========================================================
    // CONFIGURAÇÃO DE AÇÃO
    // =========================================================

    struct ActionConfig {
        uint256 xpAmount;     // XP base concedido (streak bonus aplicado no gamification)
        uint256 tokenAmount;  // Tokens ERC-20 concedidos (0 = apenas XP)
        uint256 badgeId;      // ID do badge (ignorado se !awardsBadge)
        bool awardsBadge;     // Concede badge ao executar esta ação?
        bool enabled;         // Ação habilitada?
    }

    mapping(SocialAction => ActionConfig) public actionConfigs;

    // =========================================================
    // ESTADO
    // =========================================================

    INeoGamification public gamification;
    address public attester;
    mapping(bytes32 => bool) public usedNonce;

    // =========================================================
    // EIP-712 — TRIGGER PROOF
    // =========================================================

    struct TriggerProof {
        address user;
        SocialAction action;
        string platform;      // "x", "instagram", "tiktok", "youtube", etc.
        string targetHandle;  // Handle / ID do alvo da ação
        uint256 deadline;
        bytes32 nonce;
    }

    bytes32 public constant TRIGGERPROOF_TYPEHASH =
        keccak256(
            "TriggerProof(address user,uint8 action,string platform,string targetHandle,uint256 deadline,bytes32 nonce)"
        );

    // =========================================================
    // EVENTOS (bus para backend / indexadores)
    // =========================================================

    /**
     * @notice Disparado ao executar um trigger social com sucesso.
     * @dev Backend consome este evento para analytics e notificações.
     */
    event TriggerExecuted(
        address indexed user,
        SocialAction indexed action,
        string platform,
        string targetHandle,
        uint256 timestamp,
        bytes32 nonce
    );

    event ActionConfigSet(
        SocialAction indexed action,
        uint256 xpAmount,
        uint256 tokenAmount,
        bool awardsBadge,
        uint256 badgeId,
        bool enabled
    );

    event AttesterUpdated(address indexed oldAttester, address indexed newAttester);
    event GamificationSet(address indexed gamification);

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    constructor(address _gamification, address _attester)
        Ownable(msg.sender)
        EIP712("NeoSocialTrigger", "1.0.0")
    {
        require(_attester != address(0), "attester=0");
        if (_gamification != address(0)) {
            gamification = INeoGamification(_gamification);
        }
        attester = _attester;
    }

    // =========================================================
    // ADMIN
    // =========================================================

    /// @notice Atualiza o oracle/attester responsável por validar ações sociais
    function setAttester(address _attester) external onlyOwner {
        require(_attester != address(0), "attester=0");
        emit AttesterUpdated(attester, _attester);
        attester = _attester;
    }

    /// @notice Define o contrato NeoGamification para receber as recompensas
    function setGamification(address _gamification) external onlyOwner {
        gamification = INeoGamification(_gamification);
        emit GamificationSet(_gamification);
    }

    /**
     * @notice Configura recompensas para um tipo de ação social.
     * @param action Tipo de ação (FOLLOW, LIKE, etc.)
     * @param xpAmount XP base por ação (streak bonus aplicado no gamification)
     * @param tokenAmount Tokens ERC-20 por ação (0 = apenas XP)
     * @param awardsBadge Concede badge ao executar esta ação?
     * @param badgeId ID do badge no NeoGamification (ignorado se !awardsBadge)
     * @param enabled Habilita ou desabilita o tipo de ação
     */
    function setActionConfig(
        SocialAction action,
        uint256 xpAmount,
        uint256 tokenAmount,
        bool awardsBadge,
        uint256 badgeId,
        bool enabled
    ) external onlyOwner {
        actionConfigs[action] = ActionConfig({
            xpAmount: xpAmount,
            tokenAmount: tokenAmount,
            badgeId: badgeId,
            awardsBadge: awardsBadge,
            enabled: enabled
        });
        emit ActionConfigSet(action, xpAmount, tokenAmount, awardsBadge, badgeId, enabled);
    }

    // =========================================================
    // CORE — execução do trigger social
    // =========================================================

    /**
     * @notice Executa um trigger social com prova assinada pelo oracle.
     * @dev Segue padrão CEI (Checks-Effects-Interactions):
     *   1. Checks: valida sender, deadline, nonce, ação e assinatura
     *   2. Effects: consome nonce, emite evento
     *   3. Interactions: chama NeoGamification para distribuir recompensas
     *
     * @param proof Prova da ação social assinada pelo attester off-chain
     * @param signature Assinatura EIP-712 do attester
     */
    function executeTrigger(TriggerProof calldata proof, bytes calldata signature)
        external
    {
        // --- Checks ---
        require(msg.sender == proof.user, "sender!=user");
        require(block.timestamp <= proof.deadline, "expired");
        require(!usedNonce[proof.nonce], "nonce replay");

        ActionConfig memory config = actionConfigs[proof.action];
        require(config.enabled, "action not enabled");

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    TRIGGERPROOF_TYPEHASH,
                    proof.user,
                    uint8(proof.action),
                    keccak256(bytes(proof.platform)),
                    keccak256(bytes(proof.targetHandle)),
                    proof.deadline,
                    proof.nonce
                )
            )
        );

        address signer = digest.recover(signature);
        require(signer == attester, "bad sig");

        // --- Effects ---
        usedNonce[proof.nonce] = true;

        emit TriggerExecuted(
            proof.user,
            proof.action,
            proof.platform,
            proof.targetHandle,
            block.timestamp,
            proof.nonce
        );

        // --- Interactions ---
        if (address(gamification) != address(0)) {
            string memory reason = _actionToString(proof.action);
            gamification.awardXP(
                proof.user,
                config.xpAmount,
                config.tokenAmount,
                reason
            );
            if (config.awardsBadge) {
                gamification.awardBadge(proof.user, config.badgeId);
            }
        }
    }

    // =========================================================
    // INTERNAL
    // =========================================================

    function _actionToString(SocialAction action) internal pure returns (string memory) {
        if (action == SocialAction.FOLLOW)    return "social_follow";
        if (action == SocialAction.LIKE)      return "social_like";
        if (action == SocialAction.REPOST)    return "social_repost";
        if (action == SocialAction.SUBSCRIBE) return "social_subscribe";
        return "social_comment";
    }

    // =========================================================
    // VIEW
    // =========================================================

    function getActionConfig(SocialAction action)
        external
        view
        returns (ActionConfig memory)
    {
        return actionConfigs[action];
    }
}
