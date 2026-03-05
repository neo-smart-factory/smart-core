// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library FactoryTypes {
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
}
