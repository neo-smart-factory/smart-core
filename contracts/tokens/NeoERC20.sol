// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * 
 *  ███╗   ██╗     ███████╗    ███████╗ █████╗  ██████╗████████╗ ██████╗ ██████╗ ██╗   ██╗
 *  ████╗  ██║     ██╔════╝    ██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝
 *  ██╔██╗ ██║     ███████╗    █████╗  ███████║██║        ██║   ██║   ██║██████╔╝ ╚████╔╝ 
 *  ██║╚██╗██║     ╚════██║    ██╔══╝  ██╔══██║██║        ██║   ██║   ██║██╔══██╗  ╚██╔╝  
 *  ██║ ╚████║     ███████║    ██║     ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║   ██║   
 *  ╚═╝  ╚═══╝     ╚══════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   
 *
 *  NΞØ SMART FACTORY v0.5.2 — FOUNDATION
 */

/**
 * @title NeoERC20
 * @notice Token ERC20 customizável criado pela NeoSmartFactory
 * @dev Suporta mint, burn e pause conforme configuração
 */
contract NeoERC20 is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    bool public immutable isMintable;
    bool public immutable isBurnable;
    bool public immutable isPausable;

    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 decimals,
        bool mintable,
        bool burnable,
        bool pausable,
        address creator
    ) ERC20(name, symbol) Ownable(creator) {
        isMintable = mintable;
        isBurnable = burnable;
        isPausable = pausable;
        
        if (totalSupply > 0) {
            _mint(creator, totalSupply);
        }
    }

    /**
     * @notice Cria novos tokens (apenas se mintable)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(isMintable, "Token is not mintable");
        _mint(to, amount);
    }

    /**
     * @notice Queima tokens (apenas se burnable)
     */
    function burn(uint256 amount) public override {
        require(isBurnable, "Token is not burnable");
        super.burn(amount);
    }

    /**
     * @notice Pausa o token (apenas se pausable)
     */
    function pause() external onlyOwner {
        require(isPausable, "Token is not pausable");
        _pause();
    }

    /**
     * @notice Despausa o token (apenas se pausable)
     */
    function unpause() external onlyOwner {
        require(isPausable, "Token is not pausable");
        _unpause();
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}

