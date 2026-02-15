// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title NEØ Protocol — Reputation Bootstrap
/// @author MELLØ
/// @notice Minimal on-chain reputation store, fed by validated off-chain events
/// @dev Reputation does not emerge from nothing. It emerges from validated off-chain events.
/// @dev This contract does NOT calculate graph, does NOT decide impact, ONLY receives authorized deltas.

contract ReputationBootstrap {

    // =============================
    // Protocol Anchors
    // =============================

    string public constant PROTOCOL = unicode"NEØ Protocol";
    bytes32 public constant PROTOCOL_ID = keccak256(unicode"NEØ_PROTOCOL_CORE");
    string public constant MODULE = "ReputationBootstrap";

    address public architect;

    constructor() {
        architect = msg.sender;
    }

    modifier onlyArchitect() {
        require(msg.sender == architect, "Not authorized");
        _;
    }

    // =============================
    // Storage
    // =============================

    /// @notice Reputation mapping: address => reputation score (can be negative)
    mapping(address => int256) public reputation;

    // =============================
    // Events
    // =============================

    event ReputationUpdated(
        address indexed node,
        int256 delta,
        int256 newReputation,
        bytes32 source
    );

    // =============================
    // Core Functions
    // =============================

    /// @notice Update reputation for a node
    /// @param _node Address of the node
    /// @param _delta Reputation change (can be positive or negative)
    /// @param _source Source identifier (e.g., keccak256("NodeDesignerReview"))
    function updateReputation(
        address _node,
        int256 _delta,
        bytes32 _source
    ) external onlyArchitect {
        reputation[_node] += _delta;

        emit ReputationUpdated(
            _node,
            _delta,
            reputation[_node],
            _source
        );
    }

    /// @notice Get current reputation for a node
    /// @param _node Address of the node
    /// @return Current reputation score
    function getReputation(address _node) external view returns (int256) {
        return reputation[_node];
    }
}
