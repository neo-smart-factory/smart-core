// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  TOKENIZE-SE | NEO SMART FACTORY v0.5.3
 */
 
contract NeoERC721 is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    string private _baseTokenURI;
    bool public immutable isMintable;

    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI,
        bool mintable,
        address creator
    ) ERC721(name, symbol) Ownable(creator) {
        _baseTokenURI = baseURI;
        isMintable = mintable;
    }

    /**
     * @notice Cria um novo NFT
     */
    function mint(address to, string memory tokenURI) external onlyOwner {
        require(isMintable, "NFT is not mintable");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
    }

    /**
     * @notice Cria múltiplos NFTs de uma vez
     */
    function batchMint(
        address[] memory recipients,
        string[] memory tokenURIs
    ) external onlyOwner {
        require(isMintable, "NFT is not mintable");
        require(
            recipients.length == tokenURIs.length,
            "Arrays length mismatch"
        );
        
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);
        }
    }

    /**
     * @notice Retorna o próximo token ID que será mintado
     */
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @notice Retorna o total de tokens mintados
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @notice Atualiza a base URI
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}

