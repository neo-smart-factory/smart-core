// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  NSF EMERGENCY GUARDIAN - Circuit Breaker System
 *  Author: Eurycles Ramos Neto / NODE NEØ
 *
 *  SECURITY DESIGN:
 *  - 4-of-7 multisig for emergency pause
 *  - Auto-unpause after 48h unless renewed
 *  - Transparent voting with events
 *  - Timelock required for manual unpause
 */

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IPausable {
    function pause() external;
    function unpause() external;
}

/**
 * @title EmergencyGuardian
 * @notice Multisig circuit breaker for emergency system pause
 * @dev Implements 4-of-7 guardian voting with automatic expiry
 * 
 * KEY FEATURES:
 * - Decentralized emergency response (no single point of failure)
 * - Transparent voting process with on-chain records
 * - Time-limited pause (forces active monitoring)
 * - Timelock integration for governance oversight
 */
contract EmergencyGuardian is AccessControl {
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN");
    bytes32 public constant TIMELOCK_ROLE = keccak256("TIMELOCK");
    
    uint256 public constant GUARDIAN_COUNT = 7;
    uint256 public constant PAUSE_THRESHOLD = 4; // 4/7 required
    uint256 public constant AUTO_UNPAUSE_DELAY = 48 hours;
    
    /// @notice System pause status
    bool public systemPaused;
    
    /// @notice Timestamp when system was paused
    uint256 public pausedAt;
    
    /// @notice Addresses that can be paused by this guardian
    address[] public pausableContracts;
    
    /// @notice Proposal voting tracking
    struct EmergencyProposal {
        uint256 voteCount;
        uint256 proposedAt;
        bool executed;
        mapping(address => bool) hasVoted;
    }
    
    /// @notice Active emergency proposals
    mapping(bytes32 => EmergencyProposal) public proposals;
    
    /// @notice Current active proposal ID
    bytes32 public activeProposalId;
    
    // Events
    event GuardianAdded(address indexed guardian);
    event GuardianRemoved(address indexed guardian);
    event EmergencyPauseProposed(bytes32 indexed proposalId, address indexed proposer, string reason);
    event EmergencyPauseVoted(bytes32 indexed proposalId, address indexed voter, uint256 currentVotes);
    event EmergencyPauseExecuted(bytes32 indexed proposalId, uint256 executedAt);
    event EmergencyUnpause(address indexed executor, string reason);
    event PausableContractAdded(address indexed contractAddress);
    event PausableContractRemoved(address indexed contractAddress);
    
    /**
     * @notice Initialize emergency guardian with initial guardians and timelock
     * @param guardians Array of 7 guardian addresses
     * @param timelock Address of timelock contract
     */
    constructor(address[GUARDIAN_COUNT] memory guardians, address timelock) {
        require(timelock != address(0), "Invalid timelock");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TIMELOCK_ROLE, timelock);
        
        for (uint256 i = 0; i < GUARDIAN_COUNT; i++) {
            require(guardians[i] != address(0), "Invalid guardian address");
            _grantRole(GUARDIAN_ROLE, guardians[i]);
            emit GuardianAdded(guardians[i]);
        }
    }
    
    /**
     * @notice Add a contract that can be paused by this guardian
     * @param contractAddress Address of pausable contract
     */
    function addPausableContract(address contractAddress) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(contractAddress != address(0), "Invalid contract address");
        pausableContracts.push(contractAddress);
        emit PausableContractAdded(contractAddress);
    }
    
    /**
     * @notice Propose emergency pause with reason
     * @param reason Description of emergency
     */
    function proposeEmergencyPause(string calldata reason) external {
        require(hasRole(GUARDIAN_ROLE, msg.sender), "Not a guardian");
        require(!systemPaused, "System already paused");
        
        // Create new proposal ID
        bytes32 proposalId = keccak256(abi.encodePacked(
            block.timestamp,
            block.number,
            reason,
            msg.sender
        ));
        
        require(proposals[proposalId].proposedAt == 0, "Proposal already exists");
        
        EmergencyProposal storage proposal = proposals[proposalId];
        proposal.proposedAt = block.timestamp;
        proposal.voteCount = 1;
        proposal.hasVoted[msg.sender] = true;
        
        activeProposalId = proposalId;
        
        emit EmergencyPauseProposed(proposalId, msg.sender, reason);
        emit EmergencyPauseVoted(proposalId, msg.sender, 1);
        
        // Auto-execute if threshold reached
        if (proposal.voteCount >= PAUSE_THRESHOLD) {
            _executePause(proposalId);
        }
    }
    
    /**
     * @notice Vote on active emergency pause proposal
     * @param proposalId ID of proposal to vote on
     */
    function voteEmergencyPause(bytes32 proposalId) external {
        require(hasRole(GUARDIAN_ROLE, msg.sender), "Not a guardian");
        require(!systemPaused, "System already paused");
        
        EmergencyProposal storage proposal = proposals[proposalId];
        require(proposal.proposedAt > 0, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        // Proposal expires after 24 hours
        require(block.timestamp < proposal.proposedAt + 24 hours, "Proposal expired");
        
        proposal.hasVoted[msg.sender] = true;
        proposal.voteCount++;
        
        emit EmergencyPauseVoted(proposalId, msg.sender, proposal.voteCount);
        
        // Auto-execute if threshold reached
        if (proposal.voteCount >= PAUSE_THRESHOLD) {
            _executePause(proposalId);
        }
    }
    
    /**
     * @notice Execute emergency pause
     * @param proposalId ID of proposal
     */
    function _executePause(bytes32 proposalId) internal {
        EmergencyProposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        
        proposal.executed = true;
        systemPaused = true;
        pausedAt = block.timestamp;
        
        // Pause all registered contracts
        for (uint256 i = 0; i < pausableContracts.length; i++) {
            try IPausable(pausableContracts[i]).pause() {
                // Success
            } catch {
                // Continue even if one fails
            }
        }
        
        emit EmergencyPauseExecuted(proposalId, block.timestamp);
    }
    
    /**
     * @notice Unpause system (only timelock or after auto-unpause delay)
     * @param reason Reason for unpause
     */
    function unpause(string calldata reason) external {
        require(systemPaused, "System not paused");
        
        bool canUnpause = false;
        
        // Timelock can always unpause
        if (hasRole(TIMELOCK_ROLE, msg.sender)) {
            canUnpause = true;
        }
        // Auto-unpause after delay
        else if (block.timestamp >= pausedAt + AUTO_UNPAUSE_DELAY) {
            require(hasRole(GUARDIAN_ROLE, msg.sender), "Not authorized");
            canUnpause = true;
        }
        
        require(canUnpause, "Cannot unpause yet");
        
        systemPaused = false;
        
        // Unpause all registered contracts
        for (uint256 i = 0; i < pausableContracts.length; i++) {
            try IPausable(pausableContracts[i]).unpause() {
                // Success
            } catch {
                // Continue even if one fails
            }
        }
        
        emit EmergencyUnpause(msg.sender, reason);
    }
    
    /**
     * @notice Check if system can be unpaused
     * @return canUnpause If unpause is allowed
     * @return timeRemaining Seconds until auto-unpause (0 if can unpause now)
     */
    function canUnpauseAt() external view returns (bool canUnpause, uint256 timeRemaining) {
        if (!systemPaused) {
            return (false, 0);
        }
        
        uint256 unpauseTime = pausedAt + AUTO_UNPAUSE_DELAY;
        
        if (block.timestamp >= unpauseTime) {
            return (true, 0);
        }
        
        return (false, unpauseTime - block.timestamp);
    }
    
    /**
     * @notice Get proposal details
     * @param proposalId ID of proposal
     * @return voteCount Current vote count
     * @return proposedAt Timestamp of proposal
     * @return executed If proposal was executed
     */
    function getProposal(bytes32 proposalId) external view returns (
        uint256 voteCount,
        uint256 proposedAt,
        bool executed
    ) {
        EmergencyProposal storage proposal = proposals[proposalId];
        return (
            proposal.voteCount,
            proposal.proposedAt,
            proposal.executed
        );
    }
    
    /**
     * @notice Check if address has voted on proposal
     * @param proposalId ID of proposal
     * @param guardian Address to check
     * @return hasVoted If guardian has voted
     */
    function hasVotedOnProposal(bytes32 proposalId, address guardian) 
        external 
        view 
        returns (bool) 
    {
        return proposals[proposalId].hasVoted[guardian];
    }
    
    /**
     * @notice Get all pausable contracts
     * @return Array of pausable contract addresses
     */
    function getPausableContracts() external view returns (address[] memory) {
        return pausableContracts;
    }
}
