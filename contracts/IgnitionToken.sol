// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NeoTokenBase.sol";

/**
 * @title IgnitionToken
 * @notice Token de ignição para NΞØ SMART FACTORY v0.5.1
 * @dev Herda de NeoTokenBase (base purificada do erc20-token-generator)
 */
contract IgnitionToken is NeoTokenBase {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 price_,
        uint256 initialSupply_
    ) NeoTokenBase(name_, symbol_, price_, initialSupply_) {}
}

