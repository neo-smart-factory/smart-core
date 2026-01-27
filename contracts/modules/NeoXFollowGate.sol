// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  NΞØ SMART FACTORY v0.5.3 - TRIGGER SOCIAL | ACCESS
 *  Author: Eurycles Ramos Neto / NODE NEØ
 *
 *  Licensed under MIT. Attribution to NΞØ Protocol is required for derivatives.
 *  Any fork or usage of this factory for financial protocols must reference:
 *  "Powered by NEO SMART FACTORY"
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title NeoXFollowGate
 * @notice Canonical blueprint module for social-triggered access grants.
 * @dev Trigger concept (off-chain validated): User follows the target X handle.
 * Reward concept (off-chain executed): User receives email access to members area.
 * IMPORTANT: Contract DOES NOT validate X-follow on-chain.
 * A trusted Attester (NODE NEØ / MCP) validates off-chain and signs proof.
 * Contract verifies proof (EIP-712) and emits event.
 * Backend consumes event and executes the email + access provisioning.
 * This is meant to live in NΞØ Smart Factory as a reference module.
 * It can be wired later into the Factory router / module registry.
 */
contract NeoXFollowGate is Ownable, EIP712 {
    using ECDSA for bytes32;

    // =====================================================
    // CONSTANTS / IDENTIFIERS
    // =====================================================

    string public constant TARGET_X_HANDLE = "@neoflowoff.eth";
    bytes32 private constant TARGET_X_HANDLE_HASH = keccak256(bytes("@neoflowoff.eth"));

    // Domain: "NEO"
    // Version: "0.5.3" (align with Smart Factory)
    constructor(address _attester)
        Ownable(msg.sender)
        EIP712("NEO", "0.5.3")
    {
        require(_attester != address(0), "attester=0");
        attester = _attester;
    }

    // =====================================================
    // STATE
    // =====================================================

    address public attester;

    mapping(address => bool) public granted;
    mapping(bytes32 => bool) public usedNonce;

    // =====================================================
    // STRUCTS (EIP-712)
    // =====================================================

    /**
     * @dev Proof that a wallet is eligible due to an off-chain action.
     * emailHash = keccak256(email normalized)
     * nonce = unique random value to avoid replay
     */
    struct FollowProof {
        address user;
        bytes32 emailHash;
        string xHandle;     // optional, allows internal audit / analytics
        string target;      // should be "@neoflowoff.eth"
        uint256 deadline;
        bytes32 nonce;
    }

    bytes32 public constant FOLLOWPROOF_TYPEHASH =
        keccak256(
            "FollowProof(address user,bytes32 emailHash,string xHandle,string target,uint256 deadline,bytes32 nonce)"
        );

    // =====================================================
    // EVENTS (BUS / OUTPUT)
    // =====================================================

    /**
     * @notice Single source of truth for off-chain execution.
     * Backend reads this event to:
     * - send email
     * - provision member access
     * - optionally mint pass / set user tier
     */
    event AccessGranted(
        address indexed user,
        bytes32 indexed emailHash,
        string xHandle,
        string target,
        uint256 timestamp,
        bytes32 nonce
    );

    event AttesterUpdated(address indexed oldAttester, address indexed newAttester);

    // =====================================================
    // ADMIN
    // =====================================================

    function setAttester(address _attester) external onlyOwner {
        require(_attester != address(0), "attester=0");
        emit AttesterUpdated(attester, _attester);
        attester = _attester;
    }

    // =====================================================
    // CORE
    // =====================================================

    function claimAccess(FollowProof calldata proof, bytes calldata signature) external {
        require(msg.sender == proof.user, "sender!=user");
        require(!granted[proof.user], "already granted");
        require(block.timestamp <= proof.deadline, "expired");
        require(keccak256(bytes(proof.target)) == TARGET_X_HANDLE_HASH, "wrong target");
        require(!usedNonce[proof.nonce], "nonce replay");

        // verify typed signature
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    FOLLOWPROOF_TYPEHASH,
                    proof.user,
                    proof.emailHash,
                    keccak256(bytes(proof.xHandle)),
                    keccak256(bytes(proof.target)),
                    proof.deadline,
                    proof.nonce
                )
            )
        );

        address signer = digest.recover(signature);
        require(signer == attester, "bad sig");

        usedNonce[proof.nonce] = true;
        granted[proof.user] = true;

        emit AccessGranted(
            proof.user,
            proof.emailHash,
            proof.xHandle,
            proof.target,
            block.timestamp,
            proof.nonce
        );
    }
}
