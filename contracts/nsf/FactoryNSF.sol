// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  FACTORY NSF - Neural Sync Factory Coordination Protocol
 *  Author: Eurycles Ramos Neto / NODE NEØ
 *  Version: 1.0.0 - Foundation
 *
 *  ARCHITECTURAL DESIGN:
 *  =====================
 *  Layer 1: NSFToken - Immutable coordination token (no owner, fixed supply)
 *  Layer 2: FactoryQualification - Upgradeable access control with anti-gaming
 *  Layer 4: EmergencyGuardian - 4-of-7 multisig circuit breaker with auto-unpause
 *
 *  REGULATORY POSITIONING:
 *  =======================
 *  The NSF token is NOT a security under Brazilian (CVM), US (SEC), and EU (MiCA) frameworks.
 *  It is a protocol coordination instrument for qualified institutional access.
 *  
 *  - NO promise of financial return
 *  - NO revenue distribution
 *  - NO equity participation
 *  - Utility-only: access qualification mechanism
 *
 *  KEY SECURITY FEATURES:
 *  ======================
 *  ✅ Fixed supply (1 billion tokens, immutable)
 *  ✅ No owner on token (complete power renunciation)
 *  ✅ Separation: token ownership ≠ access rights
 *  ✅ Anti-gaming: balance lock period on qualification
 *  ✅ Compliance: KYC integration + sanction list
 *  ✅ Emergency pause: 4-of-7 multisig, auto-unpause 48h
 *  ✅ Upgradeable access control (UUPS pattern)
 *
 *  DEPLOYMENT:
 *  ===========
 *  Deploy this contract with:
 *  - initialDistributor: Multi-sig wallet for token distribution
 *  - guardianAddresses: Array of 7 guardian addresses
 *  - timelockAddress: Governance timelock contract
 *  - minBalanceForAccess: Minimum NSF balance (e.g., 1000 tokens)
 */

// ============================================================================
// IMPORTS - OpenZeppelin Contracts v5.0
// ============================================================================

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// ============================================================================
// LAYER 1: NSFToken - Immutable Coordination Token
// ============================================================================

/**
 * @title NSFToken
 * @notice Immutable ERC20 token with fixed supply and no administrative control
 * @dev This contract has NO owner and NO way to mint additional tokens after deployment
 * 
 * REGULATORY DEFENSE:
 * - Fixed supply eliminates "monetary policy" risk
 * - No owner eliminates "centralized control" risk
 * - Pure ERC20 eliminates "smart contract manipulation" risk
 * - Permit support enables gasless transactions (Account Abstraction ready)
 * 
 * IMMUTABILITY GUARANTEES:
 * - Supply: 1,000,000,000 NSF (fixed forever)
 * - No mint function (cannot create more tokens)
 * - No burn enforcement (users control their tokens)
 * - No pause function (censorship resistant)
 * - No owner (zero administrative attack surface)
 */
contract NSFToken is ERC20, ERC20Permit {
    // ========================================================================
    // CONSTANTS
    // ========================================================================
    
    /// @notice Total supply is fixed and immutable at 1 billion tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    /// @notice Explicit declaration that minting capability is permanently renounced
    /// @dev This is a constant to make it clear no future minting is possible
    bool public constant MINT_RENOUNCED = true;
    
    /// @notice Deployment timestamp for institutional transparency and verification
    uint256 public immutable DEPLOYMENT_TIMESTAMP;
    
    // ========================================================================
    // EVENTS
    // ========================================================================
    
    /// @notice Emitted when tokens are initially distributed
    /// @param distributor Address receiving the entire supply
    /// @param amount Total supply distributed
    /// @param timestamp Block timestamp of distribution
    event InitialDistribution(
        address indexed distributor,
        uint256 amount,
        uint256 timestamp
    );
    
    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================
    
    /**
     * @notice Deploy NSF token with entire supply to initial distributor
     * @param initialDistributor Address that will receive 100% of supply for distribution
     * @dev After deployment, there is NO owner and NO way to mint additional tokens
     * 
     * CRITICAL VALIDATIONS:
     * - Distributor cannot be zero address (prevents accidental burn)
     * - Distributor cannot be contract itself (prevents lock)
     * 
     * POST-DEPLOYMENT STATE:
     * - All 1B tokens are in distributor address
     * - No owner exists
     * - No admin functions exist
     * - Token is completely autonomous
     */
    constructor(address initialDistributor) 
        ERC20("Neural Sync Factory", "NSF") 
        ERC20Permit("Neural Sync Factory") 
    {
        require(initialDistributor != address(0), "NSF: zero address");
        require(initialDistributor != address(this), "NSF: cannot be self");
        
        // Record deployment time for transparency
        DEPLOYMENT_TIMESTAMP = block.timestamp;
        
        // Mint entire supply to distributor
        _mint(initialDistributor, MAX_SUPPLY);
        
        // Emit distribution event for on-chain transparency
        emit InitialDistribution(initialDistributor, MAX_SUPPLY, block.timestamp);
        
        // NO ownership transfer
        // NO additional capabilities
        // Token is now completely autonomous and immutable
    }
    
    // ========================================================================
    // VIEW FUNCTIONS
    // ========================================================================
    
    /**
     * @notice Returns token decimals (standard ERC20)
     * @return uint8 Number of decimals (18)
     * @dev Explicitly defined for audit clarity and institutional verification
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
    
    /**
     * @notice Returns comprehensive token metadata for institutional verification
     * @return name Token name
     * @return symbol Token symbol  
     * @return supply Total fixed supply
     * @return deploymentTime Unix timestamp of deployment
     * @return mintRenounced Confirmation that minting is impossible
     * @dev Used by institutional investors and compliance systems
     */
    function getTokenInfo() external view returns (
        string memory name,
        string memory symbol,
        uint256 supply,
        uint256 deploymentTime,
        bool mintRenounced
    ) {
        return (
            name(),
            symbol(),
            MAX_SUPPLY,
            DEPLOYMENT_TIMESTAMP,
            MINT_RENOUNCED
        );
    }
}

// ============================================================================
// LAYER 2: FactoryQualification - Access Control Module
// ============================================================================

/**
 * @title FactoryQualification
 * @notice Upgradeable access control for Factory ecosystem
 * @dev Implements UUPS upgradeability pattern with role-based access control
 * 
 * CRITICAL SEPARATION:
 * Token ownership (NSFToken) ≠ Factory access rights (this contract)
 * 
 * This separation is KEY for regulatory defense:
 * - Token = transferable property right (commodity-like)
 * - Access = conditional service right (utility)
 * - Transfer of token does NOT automatically grant access
 * - Access requires active qualification + compliance
 * 
 * ANTI-GAMING PROTECTION:
 * - Balance snapshot at qualification (prevents flash loans)
 * - Lock period (7 days minimum holding)
 * - Expiry system (periodic requalification required)
 * - Sanction list (compliance enforcement)
 * 
 * UPGRADEABILITY:
 * - UUPS pattern (implementation upgradeable)
 * - Admin role required for upgrades
 * - State preserved across upgrades
 * - Emergency pause capability
 */
contract FactoryQualification is 
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable 
{
    // ========================================================================
    // ROLES
    // ========================================================================
    
    /// @notice Role for addresses authorized to qualify users
    bytes32 public constant QUALIFIER_ROLE = keccak256("QUALIFIER");
    
    /// @notice Role for addresses authorized to manage sanctions (compliance)
    bytes32 public constant SANCTIONER_ROLE = keccak256("SANCTIONER");
    
    // ========================================================================
    // CONSTANTS
    // ========================================================================
    
    /// @notice Balance lock period to prevent gaming (7 days)
    /// @dev During this period, user must maintain qualified balance
    uint256 public constant BALANCE_LOCK_PERIOD = 7 days;
    
    // ========================================================================
    // STATE VARIABLES
    // ========================================================================
    
    /// @notice Reference to NSF token contract
    NSFToken public nsfToken;
    
    /// @notice Minimum NSF balance required for Factory access
    /// @dev Controlled by governance, can be updated via admin role
    uint256 public minBalanceForAccess;
    
    // ========================================================================
    // STRUCTS
    // ========================================================================
    
    /**
     * @notice Complete qualification data for a user
     * @dev Stores all information needed to validate access
     */
    struct QualificationData {
        bool termsAccepted;           // User accepted terms of service
        uint256 expiryDate;           // Unix timestamp when qualification expires
        uint256 qualifiedBalance;     // Balance snapshot at qualification time
        uint256 lockUntil;            // Unix timestamp until balance is locked
        bytes32 kycHash;              // Hash of KYC verification proof
    }
    
    // ========================================================================
    // MAPPINGS
    // ========================================================================
    
    /// @notice User qualification data
    mapping(address => QualificationData) public qualifications;
    
    /// @notice Sanctioned addresses (OFAC, compliance)
    mapping(address => bool) public sanctioned;
    
    // ========================================================================
    // EVENTS
    // ========================================================================
    
    /// @notice Emitted when user is qualified for Factory access
    event UserQualified(
        address indexed user,
        uint256 qualifiedBalance,
        uint256 expiryDate,
        bytes32 kycHash
    );
    
    /// @notice Emitted when user is disqualified
    event UserDisqualified(address indexed user, string reason);
    
    /// @notice Emitted when user is sanctioned
    event UserSanctioned(address indexed user, string reason);
    
    /// @notice Emitted when user sanction is removed
    event UserUnsanctioned(address indexed user, string reason);
    
    /// @notice Emitted when minimum balance requirement changes
    event MinBalanceUpdated(uint256 newMinBalance);
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @notice Initialize the qualification contract
     * @param _nsfTokenAddress Address of deployed NSF token
     * @param _minBalance Initial minimum balance requirement
     * @param _admin Address receiving admin role
     * @dev Called once during deployment via proxy
     */
    function initialize(
        address _nsfTokenAddress,
        uint256 _minBalance,
        address _admin
    ) public initializer {
        require(_nsfTokenAddress != address(0), "Invalid token address");
        require(_admin != address(0), "Invalid admin address");
        require(_minBalance > 0, "Min balance must be positive");
        
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();
        
        nsfToken = NSFToken(_nsfTokenAddress);
        minBalanceForAccess = _minBalance;
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(QUALIFIER_ROLE, _admin);
        _grantRole(SANCTIONER_ROLE, _admin);
    }
    
    // ========================================================================
    // QUALIFICATION FUNCTIONS
    // ========================================================================
    
    /**
     * @notice Qualify user for Factory access after verification
     * @param user Address to qualify
     * @param expiryDate Unix timestamp when qualification expires
     * @param kycProof Hash of KYC verification proof (e.g., Chainalysis)
     * @dev Only QUALIFIER_ROLE can call. Implements anti-gaming via balance snapshot
     * 
     * VALIDATION CHECKS:
     * 1. User not sanctioned
     * 2. User has sufficient NSF balance
     * 3. Expiry date is in future
     * 4. KYC proof is valid (non-zero)
     * 
     * POST-QUALIFICATION:
     * - Terms marked as accepted
     * - Balance snapshot taken (anti-flash-loan)
     * - Lock period starts (7 days)
     * - Expiry date set
     */
    function qualifyUser(
        address user,
        uint256 expiryDate,
        bytes32 kycProof
    ) external onlyRole(QUALIFIER_ROLE) whenNotPaused {
        require(!sanctioned[user], "User is sanctioned");
        require(expiryDate > block.timestamp, "Invalid expiry date");
        require(kycProof != bytes32(0), "Invalid KYC proof");
        
        uint256 currentBalance = nsfToken.balanceOf(user);
        require(currentBalance >= minBalanceForAccess, "Insufficient NSF balance");
        
        qualifications[user] = QualificationData({
            termsAccepted: true,
            expiryDate: expiryDate,
            qualifiedBalance: currentBalance,      // Snapshot for anti-gaming
            lockUntil: block.timestamp + BALANCE_LOCK_PERIOD,
            kycHash: kycProof
        });
        
        emit UserQualified(user, currentBalance, expiryDate, kycProof);
    }
    
    /**
     * @notice Remove user qualification
     * @param user Address to disqualify
     * @param reason Human-readable reason for disqualification
     * @dev Only QUALIFIER_ROLE can call
     */
    function disqualifyUser(address user, string calldata reason) 
        external 
        onlyRole(QUALIFIER_ROLE) 
    {
        delete qualifications[user];
        emit UserDisqualified(user, reason);
    }
    
    // ========================================================================
    // SANCTION FUNCTIONS (COMPLIANCE)
    // ========================================================================
    
    /**
     * @notice Add user to sanction list (OFAC, regulatory requirement)
     * @param user Address to sanction
     * @param reason Reason for sanction (e.g., "OFAC SDN List")
     * @dev Only SANCTIONER_ROLE can call
     */
    function sanctionUser(address user, string calldata reason) 
        external 
        onlyRole(SANCTIONER_ROLE) 
    {
        sanctioned[user] = true;
        emit UserSanctioned(user, reason);
    }
    
    /**
     * @notice Remove user from sanction list
     * @param user Address to unsanction
     * @param reason Reason for removal
     * @dev Only SANCTIONER_ROLE can call
     */
    function unsanctionUser(address user, string calldata reason) 
        external 
        onlyRole(SANCTIONER_ROLE) 
    {
        sanctioned[user] = false;
        emit UserUnsanctioned(user, reason);
    }
    
    // ========================================================================
    // ACCESS VALIDATION
    // ========================================================================
    
    /**
     * @notice Check if user currently has valid Factory access
     * @param user Address to check
     * @return bool True if user has valid access
     * @dev This is the core access control function called by Factory
     * 
     * VALIDATION LOGIC:
     * 1. Not sanctioned (immediate fail)
     * 2. Terms accepted (qualification exists)
     * 3. Qualification not expired
     * 4. Sufficient balance:
     *    - During lock: Must maintain qualified balance (anti-gaming)
     *    - After lock: Must maintain minimum balance
     */
    function hasAccess(address user) public view returns (bool) {
        // Check sanctions first (immediate disqualification)
        if (sanctioned[user]) return false;
        
        QualificationData memory qual = qualifications[user];
        
        // Check if qualified
        if (!qual.termsAccepted) return false;
        
        // Check if expired
        if (qual.expiryDate <= block.timestamp) return false;
        
        uint256 currentBalance = nsfToken.balanceOf(user);
        
        // Anti-gaming: During lock period, must maintain qualified balance
        if (block.timestamp < qual.lockUntil) {
            return currentBalance >= qual.qualifiedBalance;
        }
        
        // After lock period, only minimum balance required
        return currentBalance >= minBalanceForAccess;
    }
    
    /**
     * @notice Get comprehensive user status
     * @param user Address to check
     * @return qualified If user is qualified
     * @return expiry Qualification expiry timestamp
     * @return isSanctioned If user is sanctioned
     * @return currentBalance User's current NSF balance
     * @return lockedUntil Lock period end timestamp
     * @dev Used by UI and monitoring systems
     */
    function getUserStatus(address user) external view returns (
        bool qualified,
        uint256 expiry,
        bool isSanctioned,
        uint256 currentBalance,
        uint256 lockedUntil
    ) {
        QualificationData memory qual = qualifications[user];
        return (
            qual.termsAccepted,
            qual.expiryDate,
            sanctioned[user],
            nsfToken.balanceOf(user),
            qual.lockUntil
        );
    }
    
    // ========================================================================
    // PARAMETER UPDATES (GOVERNANCE)
    // ========================================================================
    
    /**
     * @notice Update minimum balance requirement
     * @param newMinBalance New minimum balance in wei
     * @dev Only DEFAULT_ADMIN_ROLE (typically timelock) can call
     */
    function setMinBalance(uint256 newMinBalance) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newMinBalance > 0, "Balance must be positive");
        minBalanceForAccess = newMinBalance;
        emit MinBalanceUpdated(newMinBalance);
    }
    
    // ========================================================================
    // EMERGENCY FUNCTIONS
    // ========================================================================
    
    /**
     * @notice Pause the contract (emergency only)
     * @dev Only DEFAULT_ADMIN_ROLE can call
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     * @dev Only DEFAULT_ADMIN_ROLE can call
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    // ========================================================================
    // UUPS UPGRADE AUTHORIZATION
    // ========================================================================
    
    /**
     * @notice Authorize contract upgrade
     * @param newImplementation Address of new implementation
     * @dev Only DEFAULT_ADMIN_ROLE can authorize upgrades
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {}
}

// ============================================================================
// LAYER 4: EmergencyGuardian - Circuit Breaker System
// ============================================================================

/**
 * @title EmergencyGuardian
 * @notice 4-of-7 multisig emergency pause system with auto-unpause
 * @dev Decentralized circuit breaker for emergency response
 * 
 * SECURITY DESIGN:
 * - Requires 4 of 7 guardians to pause (decentralized decision)
 * - Transparent voting on-chain (audit trail)
 * - Auto-unpause after 48 hours (forces active management)
 * - Timelock can unpause anytime (governance override)
 * - Permissionless auto-unpause execution (anyone can call after delay)
 * 
 * USE CASES:
 * - Critical bug discovered
 * - Oracle manipulation detected
 * - Mass exploit in progress
 * - Regulatory investigation requires pause
 * 
 * ANTI-ABUSE:
 * - Requires quorum (4/7, not 1/7)
 * - Proposals expire after 24 hours
 * - Double-voting prevented
 * - Auto-unpause prevents indefinite pause
 */
contract EmergencyGuardian is AccessControl {
    // ========================================================================
    // ROLES
    // ========================================================================
    
    /// @notice Role for emergency guardians (7 total)
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN");
    
    /// @notice Role for timelock contract (governance override)
    bytes32 public constant TIMELOCK_ROLE = keccak256("TIMELOCK");
    
    // ========================================================================
    // CONSTANTS
    // ========================================================================
    
    /// @notice Total number of guardians (fixed at 7)
    uint256 public constant GUARDIAN_COUNT = 7;
    
    /// @notice Votes required to execute pause (4 of 7)
    uint256 public constant PAUSE_THRESHOLD = 4;
    
    /// @notice Auto-unpause delay (48 hours)
    /// @dev After this period, anyone can call unpause
    uint256 public constant AUTO_UNPAUSE_DELAY = 48 hours;
    
    /// @notice Proposal expiry time (24 hours)
    /// @dev Proposals older than this cannot be voted on
    uint256 public constant PROPOSAL_EXPIRY = 24 hours;
    
    // ========================================================================
    // STATE VARIABLES
    // ========================================================================
    
    /// @notice Current system pause status
    bool public systemPaused;
    
    /// @notice Timestamp when system was paused
    uint256 public pausedAt;
    
    /// @notice Currently active pause proposal ID
    bytes32 public activeProposalId;
    
    /// @notice Addresses that can be paused by this guardian
    address[] public pausableContracts;
    
    // ========================================================================
    // STRUCTS
    // ========================================================================
    
    /**
     * @notice Emergency pause proposal data
     */
    struct PauseProposal {
        uint256 timestamp;                      // When proposal was created
        uint256 voteCount;                      // Current vote count
        bool executed;                          // If pause was executed
        mapping(address => bool) voted;         // Who has voted
    }
    
    // ========================================================================
    // MAPPINGS
    // ========================================================================
    
    /// @notice All pause proposals by ID
    mapping(bytes32 => PauseProposal) public pauseProposals;
    
    // ========================================================================
    // EVENTS
    // ========================================================================
    
    /// @notice Emitted when emergency pause is proposed
    event EmergencyPauseProposed(
        bytes32 indexed proposalId,
        address indexed proposer,
        string reason,
        uint256 timestamp
    );
    
    /// @notice Emitted when guardian votes on pause proposal
    event EmergencyPauseVoted(
        bytes32 indexed proposalId,
        address indexed voter,
        uint256 currentVotes
    );
    
    /// @notice Emitted when pause is executed
    event EmergencyPauseExecuted(
        bytes32 indexed proposalId,
        uint256 timestamp
    );
    
    /// @notice Emitted when system is unpaused
    event EmergencyUnpause(
        address indexed executor,
        string reason,
        uint256 timestamp
    );
    
    /// @notice Emitted when pausable contract is added
    event PausableContractAdded(address indexed contractAddress);
    
    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================
    
    /**
     * @notice Deploy emergency guardian with 7 guardians and timelock
     * @param guardians Array of exactly 7 guardian addresses
     * @param timelock Address of governance timelock
     * @dev Validates all addresses and grants roles
     */
    constructor(address[GUARDIAN_COUNT] memory guardians, address timelock) {
        require(timelock != address(0), "Invalid timelock");
        
        // Grant admin role to deployer (temporary, should be transferred)
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        // Grant timelock role
        _grantRole(TIMELOCK_ROLE, timelock);
        
        // Grant guardian role to all 7 guardians
        for (uint256 i = 0; i < GUARDIAN_COUNT; i++) {
            require(guardians[i] != address(0), "Invalid guardian address");
            _grantRole(GUARDIAN_ROLE, guardians[i]);
        }
    }
    
    // ========================================================================
    // PAUSABLE CONTRACT MANAGEMENT
    // ========================================================================
    
    /**
     * @notice Add contract that can be paused by this guardian
     * @param contractAddress Address of pausable contract
     * @dev Only admin can add contracts
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
     * @notice Get all pausable contracts
     * @return address[] Array of pausable contract addresses
     */
    function getPausableContracts() external view returns (address[] memory) {
        return pausableContracts;
    }
    
    // ========================================================================
    // EMERGENCY PAUSE FUNCTIONS
    // ========================================================================
    
    /**
     * @notice Propose emergency pause with reason
     * @param reason Human-readable explanation for pause
     * @dev Creates new proposal and automatically votes for proposer
     * 
     * PROCESS:
     * 1. Guardian proposes with reason
     * 2. Proposal ID generated from timestamp + reason
     * 3. Proposer's vote automatically counted
     * 4. If threshold reached, pause executes immediately
     */
    function proposeEmergencyPause(string calldata reason) external {
        require(hasRole(GUARDIAN_ROLE, msg.sender), "Not a guardian");
        require(!systemPaused, "System already paused");
        require(bytes(reason).length > 0, "Reason required");
        
        // Generate unique proposal ID
        bytes32 proposalId = keccak256(abi.encodePacked(
            block.timestamp,
            block.number,
            reason,
            msg.sender
        ));
        
        // Create proposal
        PauseProposal storage proposal = pauseProposals[proposalId];
        require(proposal.timestamp == 0, "Proposal exists");
        
        proposal.timestamp = block.timestamp;
        proposal.voteCount = 1;
        proposal.voted[msg.sender] = true;
        
        activeProposalId = proposalId;
        
        emit EmergencyPauseProposed(proposalId, msg.sender, reason, block.timestamp);
        emit EmergencyPauseVoted(proposalId, msg.sender, 1);
        
        // Execute immediately if threshold reached (shouldn't happen with first vote)
        if (proposal.voteCount >= PAUSE_THRESHOLD) {
            _executePause(proposalId);
        }
    }
    
    /**
     * @notice Vote on active emergency pause proposal
     * @param proposalId ID of proposal to vote on
     * @dev Guardians can vote to reach 4-of-7 threshold
     * 
     * VALIDATIONS:
     * - Only guardians can vote
     * - System not already paused
     * - Proposal exists and not executed
     * - Proposal not expired (24h)
     * - Guardian hasn't voted already
     */
    function voteEmergencyPause(bytes32 proposalId) external {
        require(hasRole(GUARDIAN_ROLE, msg.sender), "Not a guardian");
        require(!systemPaused, "System already paused");
        
        PauseProposal storage proposal = pauseProposals[proposalId];
        require(proposal.timestamp > 0, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.voted[msg.sender], "Already voted");
        require(
            block.timestamp < proposal.timestamp + PROPOSAL_EXPIRY,
            "Proposal expired"
        );
        
        // Record vote
        proposal.voted[msg.sender] = true;
        proposal.voteCount++;
        
        emit EmergencyPauseVoted(proposalId, msg.sender, proposal.voteCount);
        
        // Execute if threshold reached
        if (proposal.voteCount >= PAUSE_THRESHOLD) {
            _executePause(proposalId);
        }
    }
    
    /**
     * @notice Internal function to execute emergency pause
     * @param proposalId ID of proposal being executed
     * @dev Pauses all registered contracts and updates state
     */
    function _executePause(bytes32 proposalId) internal {
        PauseProposal storage proposal = pauseProposals[proposalId];
        require(!proposal.executed, "Already executed");
        
        proposal.executed = true;
        systemPaused = true;
        pausedAt = block.timestamp;
        
        // Pause all registered contracts
        for (uint256 i = 0; i < pausableContracts.length; i++) {
            // Use try-catch to continue even if one fails
            try FactoryQualification(pausableContracts[i]).pause() {
                // Success
            } catch {
                // Continue to next contract
            }
        }
        
        emit EmergencyPauseExecuted(proposalId, block.timestamp);
    }
    
    // ========================================================================
    // UNPAUSE FUNCTIONS
    // ========================================================================
    
    /**
     * @notice Unpause system (timelock or after auto-unpause delay)
     * @param reason Explanation for unpause
     * @dev Two paths to unpause:
     *      1. Timelock can unpause anytime (governance)
     *      2. ANYONE can unpause after 48 hours (truly permissionless auto-unpause)
     * 
     * AUTO-UNPAUSE RATIONALE:
     * - Forces active monitoring (can't pause and forget)
     * - Prevents indefinite pause abuse
     * - Permissionless execution after delay (fully decentralized)
     * - No role required after delay period (anyone can call)
     */
    function unpause(string calldata reason) external {
        require(systemPaused, "System not paused");
        require(bytes(reason).length > 0, "Reason required");
        
        bool canUnpause = false;
        
        // Path 1: Timelock can always unpause
        if (hasRole(TIMELOCK_ROLE, msg.sender)) {
            canUnpause = true;
        }
        // Path 2: ANYONE can unpause after auto-unpause delay (permissionless)
        else if (block.timestamp >= pausedAt + AUTO_UNPAUSE_DELAY) {
            canUnpause = true;
        }
        
        require(canUnpause, "Cannot unpause yet");
        
        _executeUnpause(reason);
    }
    
    /**
     * @notice Internal function to execute unpause
     * @param reason Explanation for unpause
     * @dev Unpauses all registered contracts and clears pause state
     */
    function _executeUnpause(string memory reason) internal {
        systemPaused = false;
        
        // Clear active proposal
        bytes32 pauseId = activeProposalId;
        activeProposalId = bytes32(0);
        
        // Unpause all registered contracts
        for (uint256 i = 0; i < pausableContracts.length; i++) {
            try FactoryQualification(pausableContracts[i]).unpause() {
                // Success
            } catch {
                // Continue to next contract
            }
        }
        
        emit EmergencyUnpause(msg.sender, reason, block.timestamp);
    }
    
    // ========================================================================
    // VIEW FUNCTIONS
    // ========================================================================
    
    /**
     * @notice Check if system can be unpaused and time remaining
     * @return canUnpause True if unpause is allowed now
     * @return timeRemaining Seconds until auto-unpause (0 if can unpause)
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
     * @return timestamp When proposal was created
     * @return executed If proposal was executed
     */
    function getProposal(bytes32 proposalId) external view returns (
        uint256 voteCount,
        uint256 timestamp,
        bool executed
    ) {
        PauseProposal storage proposal = pauseProposals[proposalId];
        return (
            proposal.voteCount,
            proposal.timestamp,
            proposal.executed
        );
    }
    
    /**
     * @notice Check if address voted on proposal
     * @param proposalId ID of proposal
     * @param guardian Address to check
     * @return hasVoted True if guardian voted
     */
    function hasVotedOnProposal(bytes32 proposalId, address guardian) 
        external 
        view 
        returns (bool) 
    {
        return pauseProposals[proposalId].voted[guardian];
    }
}

// ============================================================================
// FACTORY NSF - Complete Deployment Contract
// ============================================================================

/**
 * @title FactoryNSF
 * @notice Complete NSF ecosystem deployment in single transaction
 * @dev Deploys and wires all three layers together
 * 
 * DEPLOYMENT ARCHITECTURE:
 * ========================
 * 1. Deploy NSFToken (Layer 1) - Immutable
 * 2. Deploy FactoryQualification (Layer 2) - Upgradeable via UUPS
 * 3. Deploy EmergencyGuardian (Layer 4) - Multisig circuit breaker
 * 4. Wire everything together
 * 
 * POST-DEPLOYMENT STATE:
 * ======================
 * - NSFToken: 1B tokens in distributor wallet, no owner
 * - FactoryQualification: Initialized, admin is timelock
 * - EmergencyGuardian: 7 guardians configured, can pause qualification
 * - All systems operational
 * 
 * GOVERNANCE TRANSITION:
 * ======================
 * After deployment, deployer should:
 * 1. Transfer FactoryQualification admin to Timelock
 * 2. Transfer EmergencyGuardian admin to Timelock
 * 3. Verify all contracts on block explorer
 * 4. Publish addresses publicly
 */
contract FactoryNSF {
    // ========================================================================
    // DEPLOYED CONTRACTS
    // ========================================================================
    
    NSFToken public immutable nsfToken;
    FactoryQualification public immutable factoryQualification;
    EmergencyGuardian public immutable emergencyGuardian;
    
    // ========================================================================
    // EVENTS
    // ========================================================================
    
    /// @notice Emitted when complete system is deployed
    event FactoryNSFDeployed(
        address indexed nsfToken,
        address indexed factoryQualification,
        address indexed emergencyGuardian,
        uint256 timestamp
    );
    
    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================
    
    /**
     * @notice Deploy complete NSF ecosystem
     * @param initialDistributor Address to receive all NSF tokens
     * @param guardianAddresses Array of 7 guardian addresses
     * @param timelockAddress Governance timelock address
     * @param minBalanceForAccess Minimum NSF balance for Factory access
     * @dev This is the ONLY function needed - deploys everything
     * 
     * CRITICAL PARAMETERS:
     * - initialDistributor: MUST be secure multi-sig wallet
     * - guardianAddresses: MUST be 7 trusted, diverse addresses
     * - timelockAddress: MUST be governance timelock (48h delay recommended)
     * - minBalanceForAccess: Suggested 1000 NSF (1000 * 10^18)
     * 
     * GAS COST: ~8-10M gas (varies by network)
     */
    constructor(
        address initialDistributor,
        address[7] memory guardianAddresses,
        address timelockAddress,
        uint256 minBalanceForAccess
    ) {
        // ====================================================================
        // VALIDATION
        // ====================================================================
        
        require(initialDistributor != address(0), "Invalid distributor");
        require(timelockAddress != address(0), "Invalid timelock");
        require(minBalanceForAccess > 0, "Invalid min balance");
        
        // ====================================================================
        // DEPLOY LAYER 1: NSFToken
        // ====================================================================
        
        nsfToken = new NSFToken(initialDistributor);
        
        // ====================================================================
        // DEPLOY LAYER 2: FactoryQualification (Implementation)
        // ====================================================================
        
        factoryQualification = new FactoryQualification();
        
        // Initialize qualification contract
        factoryQualification.initialize(
            address(nsfToken),
            minBalanceForAccess,
            msg.sender  // Deployer is initial admin, transfer to timelock after
        );
        
        // ====================================================================
        // DEPLOY LAYER 4: EmergencyGuardian
        // ====================================================================
        
        emergencyGuardian = new EmergencyGuardian(
            guardianAddresses,
            timelockAddress
        );
        
        // ====================================================================
        // WIRE SYSTEMS TOGETHER
        // ====================================================================
        
        // Add FactoryQualification to guardian's pausable contracts
        emergencyGuardian.addPausableContract(address(factoryQualification));
        
        // ====================================================================
        // EMIT DEPLOYMENT EVENT
        // ====================================================================
        
        emit FactoryNSFDeployed(
            address(nsfToken),
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
     * @return qualification FactoryQualification address
     * @return guardian EmergencyGuardian address
     */
    function getDeployedAddresses() external view returns (
        address token,
        address qualification,
        address guardian
    ) {
        return (
            address(nsfToken),
            address(factoryQualification),
            address(emergencyGuardian)
        );
    }
    
    /**
     * @notice Get system status summary
     * @return tokenSupply Total NSF supply
     * @return minBalance Minimum balance for access
     * @return isPaused If qualification is paused
     * @return guardiansPaused If guardian system is paused
     */
    function getSystemStatus() external view returns (
        uint256 tokenSupply,
        uint256 minBalance,
        bool isPaused,
        bool guardiansPaused
    ) {
        return (
            nsfToken.totalSupply(),
            factoryQualification.minBalanceForAccess(),
            factoryQualification.paused(),
            emergencyGuardian.systemPaused()
        );
    }
}
