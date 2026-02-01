// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NeoTokenBase.sol";

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
 *  Any fork or usage by financial protocols must reference:
 *  "Powered by NEO SMART FACTORY"
 */
 
contract IgnitionToken is NeoTokenBase {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 price_,
        uint256 initialSupply_
    ) NeoTokenBase(name_, symbol_, price_, initialSupply_) {}
}

