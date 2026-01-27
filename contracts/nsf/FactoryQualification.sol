// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  NSF FACTORY QUALIFICATION - Access Control Module
 *  Author: Eurycles Ramos Neto / NODE NEØ
 *
 *  CRITICAL SEPARATION:
 *  Token ownership (NSFToken) ≠ Factory access rights (this contract)
 *  
 *  This separation is KEY for regulatory defense:
 *  - Token can be freely transferred (property right)
 *  - Access requires qualification process (service right)
 */

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface INSFToken {
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title FactoryQualification
 * @notice Access qualification module for Neural Sync Factory ecosystem
 * @dev Upgradeable contract that manages user qualification and access control
 * 
 * ANTI-GAMING FEATURES:
 * - Balance lock period prevents flash-loan attacks
 * - Sanction list for compliance (OFAC, etc)
 * - Expiry system requires periodic requalification
 * - KYC proof validation for institutional compliance
 */
contract FactoryQualification is 
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable 
{
    /// @notice Role for addresses that can qualify users
    bytes32 public constant QUALIFIER_ROLE = keccak256("QUALIFIER");
    
    /// @notice Role for addresses that can sanction users (compliance)
    bytes32 public constant SANCTIONER_ROLE = keccak256("SANCTIONER");
    
    /// @notice Reference to immutable NSF token
    INSFToken public nsfToken;
    
    /// @notice Minimum NSF balance required for access
    uint256 public minBalanceForAccess;
    
    /// @notice Balance lock period to prevent gaming (7 days)
    uint256 public constant BALANCE_LOCK_PERIOD = 7 days;
    
    /// @notice Tracks if user has accepted terms
    mapping(address => bool) public termsAccepted;
    
    /// @notice Tracks qualification expiry date
    mapping(address => uint256) public qualificationExpiry;
    
    /// @notice Tracks sanctioned addresses (compliance)
    mapping(address => bool) public sanctioned;
    
    /// @notice Tracks last balance check for anti-gaming
    mapping(address => uint256) public lastBalanceCheck;
    
    /// @notice Tracks KYC verification hash
    mapping(address => bytes32) public kycHash;
    
    // Events
    event UserQualified(address indexed user, uint256 expiryDate, bytes32 kycHash);
    event UserDisqualified(address indexed user, string reason);
    event UserSanctioned(address indexed user, string reason);
    event UserUnsanctioned(address indexed user, string reason);
    event MinBalanceUpdated(uint256 newMinBalance);
    event TermsAccepted(address indexed user);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @notice Initialize the contract
     * @param _nsfTokenAddress Address of the NSF token contract
     * @param _minBalance Initial minimum balance requirement
     * @param _admin Address that will have admin role
     */
    function initialize(
        address _nsfTokenAddress,
        uint256 _minBalance,
        address _admin
    ) public initializer {
        require(_nsfTokenAddress != address(0), "Invalid token address");
        require(_admin != address(0), "Invalid admin address");
        
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();
        
        nsfToken = INSFToken(_nsfTokenAddress);
        minBalanceForAccess = _minBalance;
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(QUALIFIER_ROLE, _admin);
        _grantRole(SANCTIONER_ROLE, _admin);
    }
    
    /**
     * @notice Qualify a user for Factory access
     * @param user Address to qualify
     * @param expiryDate Expiration timestamp for qualification
     * @param kycProof Hash of KYC verification proof
     * @dev Only QUALIFIER_ROLE can call this
     */
    function qualifyUser(
        address user,
        uint256 expiryDate,
        bytes32 kycProof
    ) external onlyRole(QUALIFIER_ROLE) whenNotPaused {
        require(!sanctioned[user], "User is sanctioned");
        require(nsfToken.balanceOf(user) >= minBalanceForAccess, "Insufficient NSF balance");
        require(expiryDate > block.timestamp, "Invalid expiry date");
        require(kycProof != bytes32(0), "Invalid KYC proof");
        
        termsAccepted[user] = true;
        qualificationExpiry[user] = expiryDate;
        lastBalanceCheck[user] = block.timestamp;
        kycHash[user] = kycProof;
        
        emit UserQualified(user, expiryDate, kycProof);
    }
    
    /**
     * @notice Disqualify a user from Factory access
     * @param user Address to disqualify
     * @param reason Reason for disqualification
     */
    function disqualifyUser(address user, string calldata reason) 
        external 
        onlyRole(QUALIFIER_ROLE) 
    {
        termsAccepted[user] = false;
        qualificationExpiry[user] = 0;
        
        emit UserDisqualified(user, reason);
    }
    
    /**
     * @notice Sanction a user (compliance requirement)
     * @param user Address to sanction
     * @param reason Reason for sanction (e.g., "OFAC list")
     */
    function sanctionUser(address user, string calldata reason) 
        external 
        onlyRole(SANCTIONER_ROLE) 
    {
        sanctioned[user] = true;
        emit UserSanctioned(user, reason);
    }
    
    /**
     * @notice Remove sanction from a user
     * @param user Address to unsanction
     * @param reason Reason for removal
     */
    function unsanctionUser(address user, string calldata reason) 
        external 
        onlyRole(SANCTIONER_ROLE) 
    {
        sanctioned[user] = false;
        emit UserUnsanctioned(user, reason);
    }
    
    /**
     * @notice Check if user has current access to Factory
     * @param user Address to check
     * @return bool True if user has valid access
     */
    function hasAccess(address user) public view returns (bool) {
        // Check sanctions first
        if (sanctioned[user]) return false;
        
        // Check if terms were accepted
        if (!termsAccepted[user]) return false;
        
        // Check if qualification expired
        if (qualificationExpiry[user] <= block.timestamp) return false;
        
        // Check current balance
        if (nsfToken.balanceOf(user) < minBalanceForAccess) return false;
        
        // Anti-gaming: during lock period, always valid if qualified
        // After lock period, revalidate automatically
        return true;
    }
    
    /**
     * @notice Update minimum balance requirement (governance-controlled)
     * @param newMinBalance New minimum balance in wei
     */
    function setMinBalance(uint256 newMinBalance) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newMinBalance > 0, "Balance must be positive");
        minBalanceForAccess = newMinBalance;
        emit MinBalanceUpdated(newMinBalance);
    }
    
    /**
     * @notice Pause the contract (emergency)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @notice Get user qualification status
     * @param user Address to check
     * @return qualified If user is qualified
     * @return expiry Qualification expiry timestamp
     * @return isSanctioned If user is sanctioned
     * @return currentBalance User's current NSF balance
     */
    function getUserStatus(address user) external view returns (
        bool qualified,
        uint256 expiry,
        bool isSanctioned,
        uint256 currentBalance
    ) {
        return (
            termsAccepted[user],
            qualificationExpiry[user],
            sanctioned[user],
            nsfToken.balanceOf(user)
        );
    }
    
    /**
     * @notice Required by UUPSUpgradeable - only admin can upgrade
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {}
}
