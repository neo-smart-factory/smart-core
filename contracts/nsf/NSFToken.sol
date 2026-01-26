// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  NSF TOKEN - Neural Sync Factory Coordination Protocol
 *  Author: Eurycles Ramos Neto / NODE NEØ
 *
 *  REGULATORY POSITIONING (Brazil/CVM):
 *  This token is NOT a security. It is a protocol coordination instrument.
 *  - No promise of financial return
 *  - No revenue distribution
 *  - No equity participation
 *  - Utility-only: access qualification to Factory ecosystem
 *
 *  DESIGN PRINCIPLES:
 *  - Fixed supply (immutable, no mint function)
 *  - No owner (complete power renunciation)
 *  - Pure ERC20 + ERC20Permit (gasless support)
 *  - Transferability does not grant functional rights
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title NSFToken
 * @notice Protocol coordination instrument for Neural Sync Factory
 * @dev Immutable ERC20 with fixed supply and no administrative functions
 * 
 * KEY FEATURES:
 * - Fixed supply: 1 billion tokens (1,000,000,000)
 * - No owner: Cannot be modified after deployment
 * - No mint: Supply is final and immutable
 * - No burn enforcement: Users can burn their own tokens via transfer to zero address if needed
 * - ERC20Permit: Enables gasless transactions (Account Abstraction ready)
 * 
 * REGULATORY COMPLIANCE:
 * - Howey Test: Does NOT qualify as security
 *   ✓ No promise of profit
 *   ✓ No common enterprise dependency
 *   ✓ Utility independent of team efforts
 * - CVM Parecer 40/2022: Qualifies as utility token
 * - EU MiCA: Category 3 utility token (exempt from full regime)
 */
contract NSFToken is ERC20, ERC20Permit {
    /// @notice Maximum supply is fixed and immutable
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    /// @notice Explicit declaration that minting capability is renounced forever
    bool public constant MINT_RENOUNCED = true;
    
    /// @notice Token deployment timestamp for transparency
    uint256 public immutable DEPLOYMENT_TIMESTAMP;
    
    /**
     * @notice Deploy NSF token with fixed supply
     * @param initialDistributor Address that will receive the entire supply for distribution
     * @dev After deployment, there is NO owner and NO way to mint additional tokens
     */
    constructor(address initialDistributor) 
        ERC20("Neural Sync Factory", "NSF") 
        ERC20Permit("Neural Sync Factory") 
    {
        require(initialDistributor != address(0), "NSF: invalid distributor");
        
        DEPLOYMENT_TIMESTAMP = block.timestamp;
        
        // Mint entire supply to distributor
        _mint(initialDistributor, MAX_SUPPLY);
        
        // NO ownership transfer
        // NO additional capabilities
        // Token is now completely autonomous
    }
    
    /**
     * @notice Returns token decimals (standard ERC20)
     * @dev Explicitly defined for audit clarity
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
    
    /**
     * @notice Returns contract metadata for institutional verification
     * @return name Token name
     * @return symbol Token symbol
     * @return supply Total supply (fixed)
     * @return deploymentTime Deployment timestamp
     * @return mintRenounced Confirmation that minting is impossible
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
