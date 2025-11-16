// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IgnitionToken
 * @notice Token de ignição para NΞØ SMART FACTORY v0.5.1
 * @dev Token com mint único por wallet e preço fixo
 */
contract IgnitionToken is ERC20, Ownable {
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
    ) ERC20(name_, symbol_) {
        PRICE = price_;
        INITIAL_SUPPLY = initialSupply_;
    }

    /**
     * @notice Mint único por wallet com preço fixo
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
     * @notice Desabilita mint (apenas owner)
     */
    function disableMint() external onlyOwner {
        mintEnabled = false;
    }

    /**
     * @notice Habilita mint (apenas owner)
     */
    function enableMint() external onlyOwner {
        mintEnabled = true;
    }

    /**
     * @notice Retira fundos acumulados (apenas owner)
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}

