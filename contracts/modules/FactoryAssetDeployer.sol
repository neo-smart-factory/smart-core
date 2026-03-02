// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../tokens/NeoERC20.sol";
import "../tokens/NeoERC721.sol";
import "./FactoryTypes.sol";

/**
 * @title FactoryAssetDeployer
 * @notice Módulo especializado para deploy de ativos isolados (ERC20 / ERC721)
 */
contract FactoryAssetDeployer {
    error NotFactory();
    error ZeroFactory();

    address public immutable factory;

    constructor(address factoryAddress) {
        if (factoryAddress == address(0)) revert ZeroFactory();
        factory = factoryAddress;
    }

    modifier onlyFactory() {
        if (msg.sender != factory) revert NotFactory();
        _;
    }

    function deployToken(
        address creator,
        FactoryTypes.TokenConfig calldata tokenConfig
    ) external onlyFactory returns (address tokenAddress) {
        NeoERC20 token = new NeoERC20(
            tokenConfig.name,
            tokenConfig.symbol,
            tokenConfig.totalSupply,
            tokenConfig.decimals,
            tokenConfig.mintable,
            tokenConfig.burnable,
            tokenConfig.pausable,
            creator
        );
        tokenAddress = address(token);
    }

    function deployNFT(
        address creator,
        string calldata name,
        string calldata symbol,
        string calldata baseURI,
        bool mintable
    ) external onlyFactory returns (address nftAddress) {
        NeoERC721 nft = new NeoERC721(name, symbol, baseURI, mintable, creator);
        nftAddress = address(nft);
    }
}
