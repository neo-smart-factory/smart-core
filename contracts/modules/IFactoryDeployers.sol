// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./FactoryTypes.sol";

interface IFactoryProtocolDeployer {
    function deployProtocol(
        address creator,
        FactoryTypes.TokenConfig calldata tokenConfig,
        FactoryTypes.VestingConfig[] calldata vestingConfigs,
        bool rewardsEnabled
    ) external returns (address tokenAddress, address vestingAddress, address rewardsAddress);
}

interface IFactoryAssetDeployer {
    function deployToken(
        address creator,
        FactoryTypes.TokenConfig calldata tokenConfig
    ) external returns (address tokenAddress);

    function deployNFT(
        address creator,
        string calldata name,
        string calldata symbol,
        string calldata baseURI,
        bool mintable
    ) external returns (address nftAddress);
}
