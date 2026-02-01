// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./tokens/NeoERC20.sol";
import "./tokens/NeoERC721.sol";
import "./vesting/NeoVesting.sol";
import "./rewards/NeoRewards.sol";

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  NEO SMART FACTORY v0.5.3 - PROTOCOL | TOKENIZE-SE
 *
 *  Official Repository: https://github.com/neo-smart-token-factory/smart-core
 *  Maintained by: NEO Protocol (team@neosmart.factory)
 *  
 *  Licensed under MIT. Attribution to NEO Protocol is required for derivatives.
 *  Any fork or usage of this factory for financial protocols must reference:
 *  "Powered by NEO SMART FACTORY"
 */

/**
 * @title NeoSmartFactory
 * @notice Decentralized factory for creating complete protocols
 * @dev Modular system that allows creating tokens, vestings, rewards, and badges
 */
contract NeoSmartFactory is Ownable, ReentrancyGuard {
    // Data structures
    struct Protocol {
        address creator;
        string name;
        string symbol;
        address tokenAddress;
        address vestingAddress;
        address rewardsAddress;
        uint256 createdAt;
        bool active;
    }

    struct TokenConfig {
        string name;
        string symbol;
        uint256 totalSupply;
        uint8 decimals;
        bool mintable;
        bool burnable;
        bool pausable;
    }

    struct VestingConfig {
        address beneficiary;
        uint256 totalAmount;
        uint256 startTime;
        uint256 duration;
        uint256 cliff;
        bool revocable;
    }

    // Mappings
    mapping(uint256 => Protocol) public protocols;
    mapping(address => uint256[]) public creatorProtocols;
    mapping(address => bool) public authorizedCreators;
    
    // Counters and Fees
    uint256 public protocolCounter;
    uint256 public creationFee;
    
    // Security Limits
    uint256 public constant MAX_VESTING_SCHEDULES = 20;

    // Events
    event ProtocolCreated(
        uint256 indexed protocolId,
        address indexed creator,
        string name,
        address tokenAddress,
        address vestingAddress,
        address rewardsAddress
    );

    event TokenCreated(
        uint256 indexed protocolId,
        address indexed tokenAddress,
        string name,
        string symbol
    );

    event VestingScheduleAdded(
        uint256 indexed protocolId,
        address indexed vestingAddress,
        address indexed beneficiary,
        uint256 amount
    );

    event RewardsCreated(
        uint256 indexed protocolId,
        address indexed rewardsAddress
    );

    event ProtocolStatusChanged(uint256 indexed protocolId, bool active);

    constructor(uint256 _creationFee) Ownable(msg.sender) {
        creationFee = _creationFee;
        authorizedCreators[msg.sender] = true;
    }

    /**
     * @notice Creates a complete protocol with token, vesting, and reward system
     * @param tokenConfig ERC20 token configuration
     * @param vestingConfigs Array of vesting configurations
     * @param rewardsEnabled Whether to create a reward system
     */
    function createProtocol(
        TokenConfig memory tokenConfig,
        VestingConfig[] memory vestingConfigs,
        bool rewardsEnabled
    ) external payable nonReentrant returns (uint256 protocolId) {
        require(msg.value >= creationFee, "Insufficient fee");
        require(bytes(tokenConfig.name).length > 0, "Invalid token name");
        require(bytes(tokenConfig.symbol).length > 0, "Invalid token symbol");
        require(vestingConfigs.length <= MAX_VESTING_SCHEDULES, "Too many vesting schedules");

        protocolId = protocolCounter++;
        
        // Create ERC20 token - Mint to Factory first for distribution
        NeoERC20 token = new NeoERC20(
            tokenConfig.name,
            tokenConfig.symbol,
            tokenConfig.totalSupply,
            tokenConfig.decimals,
            tokenConfig.mintable,
            tokenConfig.burnable,
            tokenConfig.pausable,
            address(this) // Factory receives initial supply
        );

        address vestingAddress = address(0);
        address rewardsAddress = address(0);

        // Create vesting if configurations exist
        if (vestingConfigs.length > 0) {
            NeoVesting vesting = new NeoVesting(
                address(token),
                msg.sender
            );
            vestingAddress = address(vesting);

            // Configure vestings
            uint256 totalVestingRequested = 0;
            for (uint256 i = 0; i < vestingConfigs.length; i++) {
                VestingConfig memory v = vestingConfigs[i];
                
                // Robust validations
                require(v.beneficiary != address(0), "Invalid beneficiary");
                require(v.totalAmount > 0, "Amount must be > 0");
                require(v.duration > 0, "Duration must be > 0");
                require(v.cliff <= v.duration, "Cliff > duration");
                require(v.startTime >= block.timestamp, "Start time in past");
                
                totalVestingRequested += v.totalAmount;
                require(totalVestingRequested <= tokenConfig.totalSupply, "Vesting exceeds supply");

                token.transfer(vestingAddress, v.totalAmount);
                
                vesting.createVestingSchedule(
                    v.beneficiary,
                    v.totalAmount,
                    v.startTime,
                    v.duration,
                    v.cliff,
                    v.revocable
                );

                emit VestingScheduleAdded(protocolId, vestingAddress, v.beneficiary, v.totalAmount);
            }
        }

        // Create reward system if enabled
        if (rewardsEnabled) {
            NeoRewards rewards = new NeoRewards(
                address(token),
                msg.sender
            );
            rewardsAddress = address(rewards);
        }

        // Transfer remaining tokens to the creator
        uint256 remainingTokens = token.balanceOf(address(this));
        if (remainingTokens > 0) {
            token.transfer(msg.sender, remainingTokens);
        }

        // Transfer token ownership to the creator (if the token is Ownable)
        token.transferOwnership(msg.sender);

        // Register protocol
        protocols[protocolId] = Protocol({
            creator: msg.sender,
            name: tokenConfig.name,
            symbol: tokenConfig.symbol,
            tokenAddress: address(token),
            vestingAddress: vestingAddress,
            rewardsAddress: rewardsAddress,
            createdAt: block.timestamp,
            active: true
        });

        creatorProtocols[msg.sender].push(protocolId);

        emit ProtocolCreated(
            protocolId,
            msg.sender,
            tokenConfig.name,
            address(token),
            vestingAddress,
            rewardsAddress
        );

        emit TokenCreated(protocolId, address(token), tokenConfig.name, tokenConfig.symbol);
        
        if (rewardsAddress != address(0)) {
            emit RewardsCreated(protocolId, rewardsAddress);
        }

        return protocolId;
    }

    /**
     * @notice Toggles active status of the protocol (Owner or Creator only)
     */
    function toggleProtocolActive(uint256 protocolId) external {
        Protocol storage p = protocols[protocolId];
        require(msg.sender == owner() || msg.sender == p.creator, "Not authorized");
        p.active = !p.active;
        emit ProtocolStatusChanged(protocolId, p.active);
    }

    /**
     * @notice Creates only an ERC20 token
     */
    function createToken(TokenConfig memory tokenConfig)
        external
        payable
        nonReentrant
        returns (address tokenAddress)
    {
        require(msg.value >= creationFee, "Insufficient fee");
        
        NeoERC20 token = new NeoERC20(
            tokenConfig.name,
            tokenConfig.symbol,
            tokenConfig.totalSupply,
            tokenConfig.decimals,
            tokenConfig.mintable,
            tokenConfig.burnable,
            tokenConfig.pausable,
            msg.sender
        );

        return address(token);
    }

    /**
     * @notice Creates only an NFT (ERC721)
     */
    function createNFT(
        string memory name,
        string memory symbol,
        string memory baseURI,
        bool mintable
    ) external payable nonReentrant returns (address nftAddress) {
        require(msg.value >= creationFee, "Insufficient fee");
        
        NeoERC721 nft = new NeoERC721(
            name,
            symbol,
            baseURI,
            mintable,
            msg.sender
        );

        return address(nft);
    }

    /**
     * @notice Returns all protocols created by an address
     */
    function getCreatorProtocols(address creator)
        external
        view
        returns (uint256[] memory)
    {
        return creatorProtocols[creator];
    }

    /**
     * @notice Returns protocol information
     */
    function getProtocol(uint256 protocolId)
        external
        view
        returns (Protocol memory)
    {
        return protocols[protocolId];
    }

    /**
     * @notice Updates creation fee (Owner only)
     */
    function setCreationFee(uint256 _creationFee) external onlyOwner {
        creationFee = _creationFee;
    }

    /**
     * @notice Authorizes a creator (Owner only)
     */
    function authorizeCreator(address creator) external onlyOwner {
        authorizedCreators[creator] = true;
    }

    /**
     * @notice Revokes a creator's authorization (Owner only)
     */
    function revokeCreator(address creator) external onlyOwner {
        authorizedCreators[creator] = false;
    }

    /**
     * @notice Withdraws accumulated funds (Owner only)
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
