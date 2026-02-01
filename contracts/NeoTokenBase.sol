// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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
contract NeoTokenBase is ERC20, Ownable {
    uint256 public immutable PRICE;
    uint256 public immutable INITIAL_SUPPLY;
    mapping(address => bool) public hasMinted;
    bool public mintEnabled = true;

    event Minted(address indexed to, uint256 amount);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 price_,
        uint256 initialSupply_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        PRICE = price_;
        INITIAL_SUPPLY = initialSupply_;
    }

    /**
     * @notice Single mint per wallet with fixed price
     */
    function mint() external payable {
        require(mintEnabled, "Mint disabled");
        require(msg.value == PRICE, "Incorrect price");
        require(!hasMinted[msg.sender], "Already minted");

        hasMinted[msg.sender] = true;
        _mint(msg.sender, INITIAL_SUPPLY);
        
        emit Minted(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @notice Disables minting (Owner only)
     */
    function disableMint() external onlyOwner {
        mintEnabled = false;
    }

    /**
     * @notice Enables minting (Owner only)
     */
    function enableMint() external onlyOwner {
        mintEnabled = true;
    }

    /**
     * @notice Withdraws accumulated funds (Owner only)
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
