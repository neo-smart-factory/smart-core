// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  NΞØ SMART FACTORY v0.5.3 | GENESIS NFT
 *  Author: NEØ MELLØ // NEØ PROTOCOL
 *
 *  Licensed under MIT. Attribution to NΞØ Protocol is required for derivatives.
 *  "Powered by NEØ SMART FACTORY"
 */

/// @title  NeoGenesisNFT — NEØ Protocol Genesis NFT
/// @author MELLØ
/// @notice Soulbound 1/1 NFT (ERC-721 + ERC-5192) representing the genesis moment
///         of a project incubated or originated by NEØ SMART FACTORY.
///         Minted once to nsfactory.eth. Never transfers. Linked to a PoE hash
///         registered in NeoAttestationRegistry.
/// @dev    One deploy per project. Project identity is passed in the constructor.
///         ERC-5192 implemented inline (not available in OpenZeppelin v5).
///         Token ID is always 0 (fixed, single token).
///         mint() validates on-chain that the linked PoE exists and is not revoked
///         before minting — the NFT Genesis cannot exist without a valid attestation.

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/*//////////////////////////////////////////////////////////////
                        ERC-5192 INTERFACE
//////////////////////////////////////////////////////////////*/

/// @dev Minimal Soulbound Token standard — https://eips.ethereum.org/EIPS/eip-5192
interface IERC5192 {
    /// @notice Emitted when the locking status is changed to locked.
    event Locked(uint256 tokenId);

    /// @notice Emitted when the locking status is changed to unlocked.
    /// @dev Not emitted by this contract — all tokens are permanently locked.
    event Unlocked(uint256 tokenId);

    /// @notice Returns the locking status of an Soulbound Token.
    /// @param tokenId The identifier for an NFT.
    function locked(uint256 tokenId) external view returns (bool);
}

/*//////////////////////////////////////////////////////////////
                   ATTESTATION REGISTRY INTERFACE
//////////////////////////////////////////////////////////////*/

/// @dev Minimal interface to verify a proof in NeoAttestationRegistry
interface INeoAttestationRegistry {
    function verifyAttestation(bytes32 contentHash)
        external
        view
        returns (bool exists, bool revoked, uint256 timestamp);
}

/*//////////////////////////////////////////////////////////////
                            CONTRACT
//////////////////////////////////////////////////////////////*/

contract NeoGenesisNFT is ERC721URIStorage, Ownable2Step, IERC5192 {

    /*//////////////////////////////////////////////////////////////
                          PROTOCOL ANCHORS
    //////////////////////////////////////////////////////////////*/

    string  public constant PROTOCOL    = unicode"NEØ Protocol";
    bytes32 public constant PROTOCOL_ID = keccak256(unicode"NEØ_PROTOCOL_CORE");
    string  public constant MODULE      = "NeoGenesisNFT";
    string  public constant VERSION     = "1.0.0";

    /*//////////////////////////////////////////////////////////////
                               ERRORS
    //////////////////////////////////////////////////////////////*/

    error SoulboundTransferNotAllowed();
    error AlreadyMinted();
    error NotYetMinted();
    error InvalidHash();
    error ZeroAddress();
    error EmptyURI();
    error PoENotFound();    // poeHash not registered in NeoAttestationRegistry
    error PoERevoked();     // poeHash exists but has been revoked

    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Fixed token ID — this contract holds exactly one NFT
    uint256 public constant GENESIS_TOKEN_ID = 0;

    /// @notice Human-readable project name encoded in this genesis
    string public projectName;

    /// @notice contentHash registered in NeoAttestationRegistry for this genesis event
    /// @dev immutable — set once at deploy, verifiable without IPFS
    bytes32 public immutable poeHash;

    /// @notice Address of the NeoAttestationRegistry that holds the linked PoE
    address public immutable poeRegistry;

    /// @notice True after mint() has been called — supply is 0 or 1
    bool public minted;

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @notice Deploy a genesis NFT for a specific project
    /// @param _projectName   Human-readable project name (e.g. "FlowPay-Core")
    /// @param _projectSymbol Token symbol (e.g. "FLOWGEN")
    /// @param _poeHash       contentHash registered in NeoAttestationRegistry
    /// @param _poeRegistry   Address of the NeoAttestationRegistry contract
    /// @param _tokenURI      IPFS URI for the JSON metadata (e.g. "ipfs://Qm...")
    /// @param _initialOwner  Receiving address — always nsfactory.eth
    constructor(
        string  memory _projectName,
        string  memory _projectSymbol,
        bytes32        _poeHash,
        address        _poeRegistry,
        string  memory _tokenURI,
        address        _initialOwner
    )
        ERC721(_projectName, _projectSymbol)
        Ownable(_initialOwner)
    {
        if (_poeHash == bytes32(0))       revert InvalidHash();
        if (_poeRegistry == address(0))   revert ZeroAddress();
        if (_initialOwner == address(0))  revert ZeroAddress();
        if (bytes(_tokenURI).length == 0) revert EmptyURI();

        projectName = _projectName;
        poeHash     = _poeHash;
        poeRegistry = _poeRegistry;

        // Pre-set the token URI before mint — owner can still update before minting
        _setTokenURI(GENESIS_TOKEN_ID, _tokenURI);
    }

    /*//////////////////////////////////////////////////////////////
                            MINT (ONCE)
    //////////////////////////////////////////////////////////////*/

    /// @notice Mint the genesis NFT to the owner (nsfactory.eth)
    /// @dev    Can only be called once. Before minting, validates on-chain that the
    ///         linked poeHash exists in NeoAttestationRegistry and is not revoked.
    ///         The Genesis NFT cannot exist without a valid, active attestation.
    ///         Emits Locked(0) per ERC-5192.
    function mint() external onlyOwner {
        if (minted) revert AlreadyMinted();

        // On-chain PoE validation — NFT cannot exist without a valid attestation
        (bool exists, bool revoked, ) =
            INeoAttestationRegistry(poeRegistry).verifyAttestation(poeHash);

        if (!exists)  revert PoENotFound();
        if (revoked)  revert PoERevoked();

        minted = true;
        _safeMint(owner(), GENESIS_TOKEN_ID);

        emit Locked(GENESIS_TOKEN_ID);
    }

    /*//////////////////////////////////////////////////////////////
                          ERC-5192 SOULBOUND
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IERC5192
    /// @dev Always returns true — this NFT is permanently locked
    function locked(uint256 /*tokenId*/) external pure override returns (bool) {
        return true;
    }

    /// @dev Override _update to block all transfers after initial mint.
    ///      Transfer is only allowed when `from` is address(0) (mint).
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Block any transfer — mint is the only allowed movement (from == address(0))
        if (from != address(0)) revert SoulboundTransferNotAllowed();

        return super._update(to, tokenId, auth);
    }

    /*//////////////////////////////////////////////////////////////
                         TOKEN URI MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /// @notice Update the IPFS metadata URI before minting
    /// @dev    Once minted, the token URI can still be updated by owner
    ///         if the IPFS content needs to be revised (e.g. final artwork)
    /// @param _tokenURI New IPFS URI for the metadata JSON
    function setTokenURI(string calldata _tokenURI) external onlyOwner {
        if (bytes(_tokenURI).length == 0) revert EmptyURI();
        _setTokenURI(GENESIS_TOKEN_ID, _tokenURI);
    }

    /*//////////////////////////////////////////////////////////////
                           VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Returns the total supply (0 before mint, 1 after)
    function totalSupply() external view returns (uint256) {
        return minted ? 1 : 0;
    }

    /// @notice Returns the owner of the genesis token
    /// @dev    Reverts if not yet minted
    function genesisOwner() external view returns (address) {
        if (!minted) revert NotYetMinted();
        return ownerOf(GENESIS_TOKEN_ID);
    }

    /*//////////////////////////////////////////////////////////////
                         ERC-165 INTERFACE SUPPORT
    //////////////////////////////////////////////////////////////*/

    /// @dev Declare support for ERC-5192 interface
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage)
        returns (bool)
    {
        // IERC5192 interfaceId = 0xb45a3c0e
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }
}
