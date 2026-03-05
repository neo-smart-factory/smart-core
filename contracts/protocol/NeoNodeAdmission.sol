// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title NEØ Protocol — Node Admission Contract (Generic)
/// @author MELLØ
/// @notice Generic node admission system supporting multiple node types (Designer, Research, Systems, Governance, etc.)
/// @dev This contract is PRE-NODE, CONDITIONAL, AUDITABLE, and FOUNDATION-LOCKED
/// @dev VERSIONABLE: This contract may be replaced in the future. What persists are events and state.
/// @dev Events are the protocol's narrative - they are permanent, indexable, and form the basis of the Identity Graph.

contract NeoNodeAdmission {

    // =============================
    // Protocol Anchors
    // =============================

    string public constant PROTOCOL = unicode"NEØ Protocol";
    bytes32 public constant PROTOCOL_ID = keccak256(unicode"NEØ_PROTOCOL_CORE");
    string public constant MODULE = "NeoNodeAdmission";

    address public architect;

    constructor() {
        architect = msg.sender;
    }

    modifier onlyArchitect() {
        require(msg.sender == architect, "Not authorized");
        _;
    }

    // =============================
    // Mission State Machine
    // =============================

    enum Status {
        NONE,
        INVITED,
        ACCEPTED,
        SUBMITTED,
        VALIDATED,
        EXPIRED
    }

    struct NodeMission {
        address candidate;
        string nodeType;              // e.g. "Designer", "Research", "Systems", "Governance"
        string scope;                 // Mission scope/description
        bytes32 proofOfIntent;        // PoI hash
        uint256 invitedAt;
        uint256 acceptedAt;
        uint256 deadline;
        uint256 submittedAt;
        bytes32 proofOfDelivery;      // hash of Notion/IPFS/GitHub material
        Status status;
    }

    mapping(address => NodeMission) public missions;

    // =============================
    // Events (Narrative Index - Historical Log)
    // =============================
    // 
    // Events are the PROTOCOL'S NARRATIVE.
    // They are:
    // - Historical log of NEØ
    // - Future base for Identity Graph
    // - Public proof of admission
    // - Indexable and queryable forever

    event NodeInvited(
        address indexed candidate,
        string indexed nodeType,
        bytes32 proofOfIntent,
        uint256 deadline,
        string scope
    );

    event NodeAccepted(
        address indexed candidate,
        string indexed nodeType
    );

    event NodeSubmitted(
        address indexed candidate,
        string indexed nodeType,
        bytes32 proofOfDelivery
    );

    event NodeValidated(
        address indexed candidate,
        string indexed nodeType
    );

    event NodeExpired(
        address indexed candidate,
        string indexed nodeType
    );

    // =============================
    // 1. Invite Node Candidate (PoI)
    // =============================

    function inviteNode(
        address _candidate,
        string calldata _nodeType,    // "Designer", "Research", "Systems", etc.
        string calldata _scope,
        uint256 _deadline,
        bytes32 _proofOfIntent
    ) external onlyArchitect {
        require(
            missions[_candidate].status == Status.NONE,
            "Mission already exists"
        );

        missions[_candidate] = NodeMission({
            candidate: _candidate,
            nodeType: _nodeType,
            scope: _scope,
            proofOfIntent: _proofOfIntent,
            invitedAt: block.timestamp,
            acceptedAt: 0,
            deadline: _deadline,
            submittedAt: 0,
            proofOfDelivery: bytes32(0),
            status: Status.INVITED
        });

        emit NodeInvited(_candidate, _nodeType, _proofOfIntent, _deadline, _scope);
    }

    // =============================
    // 2. Accept Mission
    // =============================

    function acceptMission() external {
        NodeMission storage m = missions[msg.sender];
        require(m.status == Status.INVITED, "Not invited");

        m.acceptedAt = block.timestamp;
        m.status = Status.ACCEPTED;

        emit NodeAccepted(msg.sender, m.nodeType);
    }

    // =============================
    // 3. Submit Mission
    // =============================

    function submitMission(bytes32 _proofOfDelivery) external {
        NodeMission storage m = missions[msg.sender];
        require(m.status == Status.ACCEPTED, "Mission not accepted");
        require(block.timestamp <= m.deadline, "Deadline exceeded");

        m.proofOfDelivery = _proofOfDelivery;
        m.submittedAt = block.timestamp;
        m.status = Status.SUBMITTED;

        emit NodeSubmitted(msg.sender, m.nodeType, _proofOfDelivery);
    }

    // =============================
    // 4. Validate Mission
    // =============================

    function validateMission(address _candidate) external onlyArchitect {
        NodeMission storage m = missions[_candidate];
        require(m.status == Status.SUBMITTED, "Mission not submitted");

        m.status = Status.VALIDATED;

        emit NodeValidated(_candidate, m.nodeType);
    }

    // =============================
    // 5. Expire Mission
    // =============================

    function expireMission(address _candidate) external {
        NodeMission storage m = missions[_candidate];
        require(
            m.status == Status.INVITED || m.status == Status.ACCEPTED,
            "Cannot expire"
        );
        require(block.timestamp > m.deadline, "Deadline not reached");

        m.status = Status.EXPIRED;

        emit NodeExpired(_candidate, m.nodeType);
    }

    // =============================
    // View Helpers
    // =============================

    function getStatus(address _candidate) external view returns (Status) {
        return missions[_candidate].status;
    }

    function getMission(address _candidate) external view returns (NodeMission memory) {
        return missions[_candidate];
    }
}
