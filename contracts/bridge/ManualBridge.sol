// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
 *  Any fork or usage of this factory for financial protocols must reference:
 *  "Powered by NEO SMART FACTORY"
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

interface INeoTokenV2 {
    function bridgeMint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title ManualBridge
 * @notice Manual multi-sig bridge system for NeoTokenV2 tokens
 * @dev Allows cross-chain bridge with multi-signature validation
 * 
 * Flow:
 * 1. User locks tokens on Chain A (lock)
 * 2. Backend monitors event and generates signed proofs
 * 3. Relayer submits proofs on Chain B
 * 4. Bridge validates signatures and mints tokens
 */
contract ManualBridge is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Bridge Request structure
    struct BridgeRequest {
        address token;           // Endereço do token
        address from;            // Origem (quem bloqueou)
        address to;              // Destino (quem receberá)
        uint256 amount;          // Quantidade
        uint256 sourceChainId;   // Chain de origem
        uint256 targetChainId;   // Chain de destino
        bytes32 sourceTxHash;    // Hash da tx de origem
        uint256 nonce;           // Nonce único
        uint256 timestamp;       // Lock timestamp
    }

    // State
    mapping(bytes32 => bool) public processedBridges;      // Bridges already processed
    mapping(address => bool) public authorizedSigners;     // Authorized signers
    mapping(address => bool) public supportedTokens;       // Supported tokens
    mapping(address => uint256) public nonces;             // Nonces per user
    
    uint256 public requiredSignatures;                     // Required number of signatures
    uint256 public signerCount;                            // Total signers
    uint256 public bridgeFee;                              // Bridge fee (in wei)
    
    // Events
    event TokenLocked(
        address indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 targetChainId,
        uint256 nonce,
        uint256 timestamp
    );
    
    event TokenBridged(
        bytes32 indexed bridgeId,
        address indexed token,
        address indexed to,
        uint256 amount,
        uint256 sourceChainId,
        bytes32 sourceTxHash
    );
    
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event TokenSupported(address indexed token);
    event TokenUnsupported(address indexed token);
    event BridgeFeeUpdated(uint256 newFee);
    event RequiredSignaturesUpdated(uint256 newRequired);

    constructor(
        address[] memory _initialSigners,
        uint256 _requiredSignatures
    ) Ownable(msg.sender) {
        require(_initialSigners.length >= _requiredSignatures, "Not enough signers");
        require(_requiredSignatures >= 2, "Min 2 signatures required");
        
        for (uint256 i = 0; i < _initialSigners.length; i++) {
            require(_initialSigners[i] != address(0), "Invalid signer");
            require(!authorizedSigners[_initialSigners[i]], "Duplicate signer");
            
            authorizedSigners[_initialSigners[i]] = true;
            emit SignerAdded(_initialSigners[i]);
        }
        
        signerCount = _initialSigners.length;
        requiredSignatures = _requiredSignatures;
    }

    /**
     * @notice Locks tokens for bridge (Chain A)
     * @param token Token address
     * @param to Destination address on the other chain
     * @param amount Amount to be locked
     * @param targetChainId Target Chain ID
     */
    function lockTokens(
        address token,
        address to,
        uint256 amount,
        uint256 targetChainId
    ) external payable nonReentrant {
        require(supportedTokens[token], "Token not supported");
        require(to != address(0), "Invalid destination");
        require(amount > 0, "Amount must be > 0");
        require(msg.value >= bridgeFee, "Insufficient bridge fee");
        require(targetChainId != block.chainid, "Cannot bridge to same chain");
        
        // Transfers tokens to the bridge (burn or lock)
        INeoTokenV2(token).transferFrom(msg.sender, address(this), amount);
        
        // Increments user nonce        uint256 nonce = nonces[msg.sender]++;
        
        emit TokenLocked(
            token,
            msg.sender,
            to,
            amount,
            targetChainId,
            nonce,
            block.timestamp
        );
    }

    /**
     * @notice Processes bridge with multi-sig proofs (Chain B)
     * @param request Bridge request data
     * @param signatures Array of signer signatures
     */
    function bridgeWithProof(
        BridgeRequest calldata request,
        bytes[] calldata signatures
    ) external nonReentrant {
        require(supportedTokens[request.token], "Token not supported");
        require(request.to != address(0), "Invalid destination");
        require(request.amount > 0, "Amount must be > 0");
        require(signatures.length >= requiredSignatures, "Not enough signatures");
        require(request.targetChainId == block.chainid, "Wrong target chain");
        
        // Generates unique bridge ID
        bytes32 bridgeId = keccak256(
            abi.encodePacked(
                request.token,
                request.from,
                request.to,
                request.amount,
                request.sourceChainId,
                request.targetChainId,
                request.sourceTxHash,
                request.nonce
            )
        );
        
        // Prevents replay attacks
        require(!processedBridges[bridgeId], "Bridge already processed");
        
        // Validates signatures
        _validateSignatures(bridgeId, signatures);
        
        // Marks as processed
        processedBridges[bridgeId] = true;
        
        // Mints tokens on target chain
        INeoTokenV2(request.token).bridgeMint(request.to, request.amount);
        
        emit TokenBridged(
            bridgeId,
            request.token,
            request.to,
            request.amount,
            request.sourceChainId,
            request.sourceTxHash
        );
    }

    /**
     * @notice Validates multi-sig signatures
     * @param bridgeId Bridge ID
     * @param signatures Signatures array
     */
    function _validateSignatures(
        bytes32 bridgeId,
        bytes[] calldata signatures
    ) internal view {
        bytes32 ethSignedMessageHash = bridgeId.toEthSignedMessageHash();
        
        address[] memory signers = new address[](signatures.length);
        
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = ethSignedMessageHash.recover(signatures[i]);
            
            require(authorizedSigners[signer], "Invalid signer");
            
            // Prevents duplicate signatures
            for (uint256 j = 0; j < i; j++) {
                require(signers[j] != signer, "Duplicate signature");
            }
            
            signers[i] = signer;
        }
    }

    /**
     * @notice Adds an authorized signer
     * @param signer Signer address
     */
    function addSigner(address signer) external onlyOwner {
        require(signer != address(0), "Invalid signer");
        require(!authorizedSigners[signer], "Signer already authorized");
        
        authorizedSigners[signer] = true;
        signerCount++;
        
        emit SignerAdded(signer);
    }

    /**
     * @notice Removes an authorized signer
     * @param signer Signer address
     */
    function removeSigner(address signer) external onlyOwner {
        require(authorizedSigners[signer], "Signer not authorized");
        require(signerCount - 1 >= requiredSignatures, "Would break multi-sig");
        
        authorizedSigners[signer] = false;
        signerCount--;
        
        emit SignerRemoved(signer);
    }

    /**
     * @notice Adds supported token
     * @param token Token address
     */
    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(!supportedTokens[token], "Token already supported");
        
        supportedTokens[token] = true;
        emit TokenSupported(token);
    }

    /**
     * @notice Removes supported token
     * @param token Token address
     */
    function removeSupportedToken(address token) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        
        supportedTokens[token] = false;
        emit TokenUnsupported(token);
    }

    /**
     * @notice Updates required signatures count
     * @param _requiredSignatures New signatures count
     */
    function setRequiredSignatures(uint256 _requiredSignatures) external onlyOwner {
        require(_requiredSignatures >= 2, "Min 2 signatures required");
        require(_requiredSignatures <= signerCount, "Cannot exceed signer count");
        
        requiredSignatures = _requiredSignatures;
        emit RequiredSignaturesUpdated(_requiredSignatures);
    }

    /**
     * @notice Updates bridge fee
     * @param _bridgeFee New fee in wei
     */
    function setBridgeFee(uint256 _bridgeFee) external onlyOwner {
        bridgeFee = _bridgeFee;
        emit BridgeFeeUpdated(_bridgeFee);
    }

    /**
     * @notice Withdraws accumulated fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @notice Checks if a bridge request has already been processed
     * @param request Bridge request data
     * @return bool True if already processed
     */
    function isBridgeProcessed(BridgeRequest calldata request) external view returns (bool) {
        bytes32 bridgeId = keccak256(
            abi.encodePacked(
                request.token,
                request.from,
                request.to,
                request.amount,
                request.sourceChainId,
                request.targetChainId,
                request.sourceTxHash,
                request.nonce
            )
        );
        
        return processedBridges[bridgeId];
    }

    /**
     * @notice Returns bridge information
     */
    function getBridgeInfo() external view returns (
        uint256 _requiredSignatures,
        uint256 _signerCount,
        uint256 _bridgeFee
    ) {
        return (requiredSignatures, signerCount, bridgeFee);
    }
}
