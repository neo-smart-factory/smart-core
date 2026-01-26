// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NeoTokenBase.sol";

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  TOKENIZE | NΞØ SMART FACTORY v0.5.3
 */
 
contract IgnitionToken is NeoTokenBase {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 price_,
        uint256 initialSupply_
    ) NeoTokenBase(name_, symbol_, price_, initialSupply_) {}
}

