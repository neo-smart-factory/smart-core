// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  TOKENIZE | NΞØ SMART FACTORY v0.5.3
 */
 
contract NeoERC721 is ERC721URIStorage, Ownable, Pausable {
    uint256 private _nextTokenId;
    string private _baseTokenURI;
    bool public immutable isMintable;
    address public guardian;

    event GuardianUpdated(address indexed newGuardian);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI,
        bool mintable,
        address creator
    ) ERC721(name, symbol) Ownable(creator) {
        _baseTokenURI = baseURI;
        isMintable = mintable;
        guardian = creator;
    }

    /**
     * @notice Cria um novo NFT
     */
    function mint(address to, string memory tokenURI) external onlyOwner whenNotPaused {
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
    ) external onlyOwner whenNotPaused {
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

    // --- Security & Governance ---

    /**
     * @notice Pausa o contrato (Owner ou Guardian)
     */
    function pause() external {
        require(msg.sender == owner() || msg.sender == guardian, "Not authorized");
        _pause();
    }

    /**
     * @notice Despausa o contrato (Apenas Owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Atualiza o Guardian
     */
    function setGuardian(address _newGuardian) external onlyOwner {
        require(_newGuardian != address(0), "Invalid guardian");
        guardian = _newGuardian;
        emit GuardianUpdated(_newGuardian);
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

    function _update(address to, uint256 tokenId, address auth) internal override whenNotPaused returns (address) {
        return super._update(to, tokenId, auth);
    }
}

