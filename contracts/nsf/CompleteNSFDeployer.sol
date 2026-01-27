// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  COMPLETE NSF SYSTEM DEPLOYER - All 4 Layers
 *  Author: Eurycles Ramos Neto / NODE NEØ
 *  Version: 2.0.0 - Complete Implementation
 *
 *  ARCHITECTURAL LAYERS:
 *  ====================
 *  Layer 1: NSFToken - Immutable coordination token with governance support
 *  Layer 2: FactoryQualification - Upgradeable access control
 *  Layer 3: NSFGovernance + TimelockController - Limited-scope governance
 *  Layer 4: EmergencyGuardian - Multisig circuit breaker
 *
 *  DEPLOYMENT SEQUENCE:
 *  ===================
 *  1. Deploy NSFToken (no owner, fixed supply, ERC20Votes enabled)
 *  2. Deploy TimelockController (48h delay)
 *  3. Deploy NSFGovernance (connected to token + timelock)
 *  4. Deploy FactoryQualification (upgradeable)
 *  5. Deploy EmergencyGuardian (7 guardians)
 *  6. Wire all systems together
 *  7. Transfer admin roles to timelock
 *  8. Grant governance roles
 */

import "./NSFToken.sol";
import "./FactoryQualification.sol";
import "./NSFGovernance.sol";
import "./EmergencyGuardian.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title CompleteNSFDeployer
 * @notice Single-transaction deployment of complete 4-layer NSF system
 * @dev Deploys and wires all components with proper role management
 */
contract CompleteNSFDeployer {
    // ========================================================================
    // STATE VARIABLES
    // ========================================================================
    
    /// @notice Deployed NSFToken contract
    NSFToken public nsfToken;
    
    /// @notice Deployed TimelockController
    TimelockController public timelock;
    
    /// @notice Deployed NSFGovernance
    NSFGovernance public governance;
    
    /// @notice Deployed FactoryQualification
    FactoryQualification public factoryQualification;
    
    /// @notice Deployed EmergencyGuardian
    EmergencyGuardian public emergencyGuardian;
    
    /// @notice Deployment timestamp
    uint256 public immutable deploymentTime;
    
    // ========================================================================
    // EVENTS
    // ========================================================================
    
    event SystemDeployed(
        address indexed token,
        address indexed timelock,
        address indexed governance,
        address qualification,
        address guardian,
        uint256 timestamp
    );
    
    event LayerDeployed(uint8 layer, address contractAddress, string name);
    
    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================
    
    /**
     * @notice Deploy complete NSF system in single transaction
     * @param initialDistributor Multi-sig wallet to receive initial token supply
     * @param guardianAddresses Array of 7 guardian addresses for emergency control
     * @param minBalanceForAccess Minimum NSF balance required for factory access (e.g., 1000 NSF)
     * @param timelockDelay Timelock delay in seconds (recommended: 48 hours = 172800)
     * 
     * IMPORTANT POST-DEPLOYMENT STEPS:
     * 1. Distribute NSF tokens from initialDistributor
     * 2. Add votable functions to governance via timelock
     * 3. Verify all role assignments
     * 4. Test emergency pause mechanism
     */
    constructor(
        address initialDistributor,
        address[7] memory guardianAddresses,
        uint256 minBalanceForAccess,
        uint256 timelockDelay
    ) {
        require(initialDistributor != address(0), "Invalid distributor");
        require(minBalanceForAccess > 0, "Invalid min balance");
        require(timelockDelay >= 24 hours, "Timelock delay too short");
        
        deploymentTime = block.timestamp;
        
        // ====================================================================
        // LAYER 1: Deploy NSFToken (Immutable, No Owner, ERC20Votes)
        // ====================================================================
        
        nsfToken = new NSFToken(initialDistributor);
        emit LayerDeployed(1, address(nsfToken), "NSFToken");
        
        // ====================================================================
        // LAYER 3A: Deploy TimelockController
        // ====================================================================
        
        address[] memory proposers = new address[](1);
        proposers[0] = address(this); // Temporary, will be updated
        
        address[] memory executors = new address[](1);
        executors[0] = address(0); // Anyone can execute after delay
        
        timelock = new TimelockController(
            timelockDelay,
            proposers,
            executors,
            address(this) // Temporary admin
        );
        emit LayerDeployed(3, address(timelock), "TimelockController");
        
        // ====================================================================
        // LAYER 3B: Deploy NSFGovernance
        // ====================================================================
        
        governance = new NSFGovernance(
            IVotes(address(nsfToken)),
            timelock
        );
        emit LayerDeployed(3, address(governance), "NSFGovernance");
        
        // ====================================================================
        // LAYER 2: Deploy FactoryQualification (Upgradeable)
        // ====================================================================
        
        factoryQualification = new FactoryQualification();
        factoryQualification.initialize(
            address(nsfToken),
            minBalanceForAccess,
            address(timelock) // Timelock is admin from the start
        );
        emit LayerDeployed(2, address(factoryQualification), "FactoryQualification");
        
        // ====================================================================
        // LAYER 4: Deploy EmergencyGuardian
        // ====================================================================
        
        emergencyGuardian = new EmergencyGuardian(
            guardianAddresses,
            address(timelock)
        );
        emit LayerDeployed(4, address(emergencyGuardian), "EmergencyGuardian");
        
        // ====================================================================
        // SYSTEM WIRING
        // ====================================================================
        
        // Add qualification to guardian's pausable contracts
        emergencyGuardian.addPausableContract(address(factoryQualification));
        
        // Grant proposer role to governance on timelock
        bytes32 PROPOSER_ROLE = timelock.PROPOSER_ROLE();
        timelock.grantRole(PROPOSER_ROLE, address(governance));
        
        // Grant executor role to governance (optional, executors can be anyone)
        bytes32 EXECUTOR_ROLE = timelock.EXECUTOR_ROLE();
        timelock.grantRole(EXECUTOR_ROLE, address(governance));
        
        // Renounce deployer's proposer and admin roles
        timelock.revokeRole(PROPOSER_ROLE, address(this));
        
        // Renounce admin role on guardian (roles already set in constructor)
        bytes32 DEFAULT_ADMIN_ROLE = emergencyGuardian.DEFAULT_ADMIN_ROLE();
        emergencyGuardian.grantRole(DEFAULT_ADMIN_ROLE, address(timelock));
        emergencyGuardian.revokeRole(DEFAULT_ADMIN_ROLE, address(this));
        
        // Final: Renounce timelock admin (makes timelock self-administered via governance)
        bytes32 TIMELOCK_ADMIN_ROLE = timelock.DEFAULT_ADMIN_ROLE();
        timelock.revokeRole(TIMELOCK_ADMIN_ROLE, address(this));
        
        // ====================================================================
        // DEPLOYMENT COMPLETE
        // ====================================================================
        
        emit SystemDeployed(
            address(nsfToken),
            address(timelock),
            address(governance),
            address(factoryQualification),
            address(emergencyGuardian),
            block.timestamp
        );
    }
    
    // ========================================================================
    // VIEW FUNCTIONS
    // ========================================================================
    
    /**
     * @notice Get all deployed contract addresses
     * @return token NSFToken address
     * @return timelock_ TimelockController address
     * @return governance_ NSFGovernance address
     * @return qualification FactoryQualification address
     * @return guardian EmergencyGuardian address
     */
    function getDeployedAddresses() external view returns (
        address token,
        address timelock_,
        address governance_,
        address qualification,
        address guardian
    ) {
        return (
            address(nsfToken),
            address(timelock),
            address(governance),
            address(factoryQualification),
            address(emergencyGuardian)
        );
    }
    
    /**
     * @notice Get comprehensive system status
     * @return tokenSupply Total NSF supply
     * @return minBalance Minimum balance for access
     * @return qualificationPaused If qualification is paused
     * @return guardiansPaused If guardian system is paused
     * @return timelockDelay Current timelock delay
     * @return votingDelay Governance voting delay
     * @return votingPeriod Governance voting period
     * @return proposalThreshold Minimum tokens needed to propose
     */
    function getSystemStatus() external view returns (
        uint256 tokenSupply,
        uint256 minBalance,
        bool qualificationPaused,
        bool guardiansPaused,
        uint256 timelockDelay,
        uint256 votingDelay,
        uint256 votingPeriod,
        uint256 proposalThreshold
    ) {
        (
            uint256 vDelay,
            uint256 vPeriod,
            uint256 pThreshold,
        ) = governance.getGovernanceParameters();
        
        return (
            nsfToken.totalSupply(),
            factoryQualification.minBalanceForAccess(),
            factoryQualification.paused(),
            emergencyGuardian.systemPaused(),
            timelock.getMinDelay(),
            vDelay,
            vPeriod,
            pThreshold
        );
    }
    
    /**
     * @notice Verify system integrity
     * @return isValid True if all components are properly connected
     * @return issues Array of issue descriptions (empty if valid)
     */
    function verifySystemIntegrity() external view returns (
        bool isValid,
        string[] memory issues
    ) {
        string[] memory foundIssues = new string[](10);
        uint256 issueCount = 0;
        
        // Check token
        if (address(nsfToken) == address(0)) {
            foundIssues[issueCount++] = "Token not deployed";
        }
        
        // Check timelock
        if (address(timelock) == address(0)) {
            foundIssues[issueCount++] = "Timelock not deployed";
        }
        
        // Check governance
        if (address(governance) == address(0)) {
            foundIssues[issueCount++] = "Governance not deployed";
        } else {
            // Verify governance has proposer role on timelock
            bytes32 PROPOSER_ROLE = timelock.PROPOSER_ROLE();
            if (!timelock.hasRole(PROPOSER_ROLE, address(governance))) {
                foundIssues[issueCount++] = "Governance missing proposer role";
            }
        }
        
        // Check qualification
        if (address(factoryQualification) == address(0)) {
            foundIssues[issueCount++] = "Qualification not deployed";
        } else {
            // Verify timelock is admin
            bytes32 DEFAULT_ADMIN_ROLE = factoryQualification.DEFAULT_ADMIN_ROLE();
            if (!factoryQualification.hasRole(DEFAULT_ADMIN_ROLE, address(timelock))) {
                foundIssues[issueCount++] = "Timelock not admin of qualification";
            }
        }
        
        // Check guardian
        if (address(emergencyGuardian) == address(0)) {
            foundIssues[issueCount++] = "Guardian not deployed";
        }
        
        // Check token supply
        if (nsfToken.totalSupply() != nsfToken.MAX_SUPPLY()) {
            foundIssues[issueCount++] = "Token supply mismatch";
        }
        
        // Return results
        if (issueCount == 0) {
            return (true, new string[](0));
        }
        
        string[] memory actualIssues = new string[](issueCount);
        for (uint256 i = 0; i < issueCount; i++) {
            actualIssues[i] = foundIssues[i];
        }
        
        return (false, actualIssues);
    }
    
    /**
     * @notice Get governance info for UI/monitoring
     * @return token NSF token address
     * @return votingDelay Delay before voting starts
     * @return votingPeriod Duration of voting
     * @return proposalThreshold Tokens needed to propose
     * @return quorumPercentage Percentage of supply needed for quorum
     */
    function getGovernanceInfo() external view returns (
        address token,
        uint256 votingDelay,
        uint256 votingPeriod,
        uint256 proposalThreshold,
        uint256 quorumPercentage
    ) {
        (
            uint256 vDelay,
            uint256 vPeriod,
            uint256 pThreshold,
            uint256 qPercent
        ) = governance.getGovernanceParameters();
        
        return (
            address(nsfToken),
            vDelay,
            vPeriod,
            pThreshold,
            qPercent
        );
    }
}
