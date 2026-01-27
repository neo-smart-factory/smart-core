// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  NSF GOVERNANCE - Layer 3 Protocol Governance
 *  Author: Eurycles Ramos Neto / NODE NEØ
 *
 *  GOVERNANCE SCOPE (HIGHLY LIMITED):
 *  ===================================
 *  This governance system can ONLY vote on:
 *  - minBalanceForAccess parameter (FactoryQualification)
 *  - Fee structure parameters (future FactoryCore)
 *  - Proposal threshold adjustments
 *  - Voting delay/period parameters
 *  
 *  EXPLICITLY NOT VOTABLE:
 *  - Treasury movements (admin-only via timelock)
 *  - Emergency pause controls (guardian-only)
 *  - Security parameters (admin-only)
 *  - Admin role changes (timelock-only)
 *  - Contract upgrades (admin-only)
 *
 *  SECURITY DESIGN:
 *  - Timelock delay: 48 hours minimum
 *  - Voting delay: 1 day (deliberation period)
 *  - Voting period: 3 days (execution window)
 *  - Quorum: 10% of token supply
 *  - Proposal threshold: 0.01% of supply (100k NSF)
 *  - Whitelist enforcement: only pre-approved functions
 */

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

/**
 * @title NSFGovernance
 * @notice Limited-scope governance for NSF protocol parameters
 * @dev Uses OpenZeppelin Governor with strict function whitelisting
 * 
 * ARCHITECTURAL DECISIONS:
 * - Whitelist approach (not blacklist) for security
 * - Timelock integration for 48h delay
 * - Quorum requirement prevents low-participation attacks
 * - Proposal threshold prevents spam
 * - Function selector validation on proposal creation
 */
contract NSFGovernance is 
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    // ========================================================================
    // CONSTANTS
    // ========================================================================
    
    /// @notice Voting delay in blocks (~1 day at 12s per block)
    uint256 private constant VOTING_DELAY = 1 days;
    
    /// @notice Voting period in blocks (~3 days at 12s per block)
    uint256 private constant VOTING_PERIOD = 3 days;
    
    /// @notice Minimum NSF tokens required to create proposal (100,000 NSF = 0.01% of supply)
    uint256 private constant PROPOSAL_THRESHOLD = 100_000 * 10**18;
    
    /// @notice Quorum percentage (10% of total supply must participate)
    uint256 private constant QUORUM_PERCENTAGE = 10;
    
    // ========================================================================
    // STATE
    // ========================================================================
    
    /// @notice Whitelist of function selectors that can be voted on
    /// @dev Key: function selector (bytes4), Value: allowed (bool)
    mapping(bytes4 => bool) public votableFunction;
    
    /// @notice Human-readable names for votable functions (for transparency)
    mapping(bytes4 => string) public functionName;
    
    // ========================================================================
    // EVENTS
    // ========================================================================
    
    event VotableFunctionAdded(bytes4 indexed selector, string name);
    event VotableFunctionRemoved(bytes4 indexed selector, string name);
    
    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================
    
    /**
     * @notice Initialize NSF Governance with timelock
     * @param _token NSF token address (must implement IVotes/ERC20Votes)
     * @param _timelock TimelockController address
     * @dev Token must have voting power delegation enabled
     */
    constructor(
        IVotes _token,
        TimelockController _timelock
    )
        Governor("NSF Governance")
        GovernorSettings(
            VOTING_DELAY,     // 1 day voting delay
            VOTING_PERIOD,    // 3 day voting period
            PROPOSAL_THRESHOLD // 100k NSF proposal threshold
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(QUORUM_PERCENTAGE)
        GovernorTimelockControl(_timelock)
    {
        // No initial votable functions - must be added explicitly by timelock
    }
    
    // ========================================================================
    // ADMIN FUNCTIONS (Timelock Only)
    // ========================================================================
    
    /**
     * @notice Add a function to the votable whitelist
     * @param selector Function selector (bytes4)
     * @param name Human-readable function name
     * @dev Only callable by timelock (admin)
     * 
     * Example: addVotableFunction(
     *   FactoryQualification.setMinBalance.selector,
     *   "setMinBalance(uint256)"
     * )
     */
    function addVotableFunction(bytes4 selector, string calldata name) 
        external 
        onlyGovernance 
    {
        require(selector != bytes4(0), "Invalid selector");
        require(!votableFunction[selector], "Already votable");
        
        votableFunction[selector] = true;
        functionName[selector] = name;
        
        emit VotableFunctionAdded(selector, name);
    }
    
    /**
     * @notice Remove a function from the votable whitelist
     * @param selector Function selector to remove
     */
    function removeVotableFunction(bytes4 selector) 
        external 
        onlyGovernance 
    {
        require(votableFunction[selector], "Not votable");
        
        string memory name = functionName[selector];
        
        votableFunction[selector] = false;
        delete functionName[selector];
        
        emit VotableFunctionRemoved(selector, name);
    }
    
    // ========================================================================
    // PROPOSAL VALIDATION (Critical Security)
    // ========================================================================
    
    /**
     * @notice Create a proposal with automatic validation
     * @param targets Array of contract addresses to call
     * @param values Array of ETH values to send
     * @param calldatas Array of encoded function calls
     * @param description Proposal description
     * @return uint256 Proposal ID
     * 
     * @dev SECURITY: Validates that all function calls are whitelisted
     * This prevents governance from calling unauthorized functions
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) 
        public 
        override(Governor, IGovernor) 
        returns (uint256) 
    {
        // Validate all function calls are whitelisted
        for (uint256 i = 0; i < calldatas.length; i++) {
            require(calldatas[i].length >= 4, "Invalid calldata");
            
            bytes4 selector = bytes4(calldatas[i]);
            
            require(
                votableFunction[selector],
                "Function not votable"
            );
        }
        
        return super.propose(targets, values, calldatas, description);
    }
    
    // ========================================================================
    // REQUIRED OVERRIDES
    // ========================================================================
    
    /**
     * @notice Get voting delay
     * @return uint256 Delay in seconds before voting starts
     */
    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }
    
    /**
     * @notice Get voting period
     * @return uint256 Duration in seconds for voting
     */
    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }
    
    /**
     * @notice Get quorum for a specific block
     * @param blockNumber Block number to check
     * @return uint256 Required quorum at that block
     */
    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }
    
    /**
     * @notice Get proposal state
     * @param proposalId ID of proposal
     * @return ProposalState Current state
     */
    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }
    
    /**
     * @notice Check if proposal needs to be queued
     * @param proposalId ID of proposal
     * @return bool True if queueing required
     */
    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }
    
    /**
     * @notice Get proposal threshold
     * @return uint256 Minimum tokens needed to propose
     */
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }
    
    /**
     * @notice Execute a proposal
     * @dev Internal function with timelock integration
     */
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
    {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }
    
    /**
     * @notice Cancel a proposal
     * @dev Internal function with timelock integration
     */
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }
    
    /**
     * @notice Get executor (timelock)
     * @return address Address of timelock contract
     */
    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
    
    // ========================================================================
    // VIEW FUNCTIONS
    // ========================================================================
    
    /**
     * @notice Check if a function selector is votable
     * @param selector Function selector to check
     * @return isVotable True if function can be voted on
     * @return name Human-readable function name
     */
    function isVotable(bytes4 selector) 
        external 
        view 
        returns (bool isVotable, string memory name) 
    {
        return (votableFunction[selector], functionName[selector]);
    }
    
    /**
     * @notice Get governance parameters
     * @return votingDelay_ Voting delay in seconds
     * @return votingPeriod_ Voting period in seconds
     * @return proposalThreshold_ Minimum tokens to propose
     * @return quorumPercentage Quorum percentage required
     */
    function getGovernanceParameters() 
        external 
        view 
        returns (
            uint256 votingDelay_,
            uint256 votingPeriod_,
            uint256 proposalThreshold_,
            uint256 quorumPercentage
        ) 
    {
        return (
            votingDelay(),
            votingPeriod(),
            proposalThreshold(),
            QUORUM_PERCENTAGE
        );
    }
}
