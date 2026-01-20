// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * 
 *  ███╗   ██╗     ███████╗    ███████╗ █████╗  ██████╗████████╗ ██████╗ ██████╗ ██╗   ██╗
 *  ████╗  ██║     ██╔════╝    ██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝
 *  ██╔██╗ ██║     ███████╗    █████╗  ███████║██║        ██║   ██║   ██║██████╔╝ ╚████╔╝ 
 *  ██║╚██╗██║     ╚════██║    ██╔══╝  ██╔══██║██║        ██║   ██║   ██║██╔══██╗  ╚██╔╝  
 *  ██║ ╚████║     ███████║    ██║     ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║   ██║   
 *  ╚═╝  ╚═══╝     ╚══════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   
 *
 *  NΞØ SMART FACTORY v0.5.3 — MANUAL BRIDGE SYSTEM
 *  Multi-Sig Bridge para tokens NeoTokenV2
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
 * @notice Sistema de bridge manual com multi-sig para tokens NeoTokenV2
 * @dev Permite bridge cross-chain com validação multi-assinatura
 * 
 * Fluxo:
 * 1. Usuário bloqueia tokens na Chain A (lock)
 * 2. Backend monitora evento e gera provas assinadas
 * 3. Relayer submete provas na Chain B
 * 4. Bridge valida assinaturas e minta tokens
 */
contract ManualBridge is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Estrutura de Bridge Request
    struct BridgeRequest {
        address token;           // Endereço do token
        address from;            // Origem (quem bloqueou)
        address to;              // Destino (quem receberá)
        uint256 amount;          // Quantidade
        uint256 sourceChainId;   // Chain de origem
        uint256 targetChainId;   // Chain de destino
        bytes32 sourceTxHash;    // Hash da tx de origem
        uint256 nonce;           // Nonce único
        uint256 timestamp;       // Timestamp do lock
    }

    // Estado
    mapping(bytes32 => bool) public processedBridges;      // Bridges já processadas
    mapping(address => bool) public authorizedSigners;     // Signers autorizados
    mapping(address => bool) public supportedTokens;       // Tokens suportados
    mapping(address => uint256) public nonces;             // Nonces por usuário
    
    uint256 public requiredSignatures;                     // Número de assinaturas necessárias
    uint256 public signerCount;                            // Total de signers
    uint256 public bridgeFee;                              // Fee por bridge (em wei)
    
    // Eventos
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
     * @notice Bloqueia tokens para bridge (Chain A)
     * @param token Endereço do token
     * @param to Endereço de destino na outra chain
     * @param amount Quantidade a ser bloqueada
     * @param targetChainId Chain ID de destino
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
        
        // Transfere tokens para o bridge (burn ou lock)
        INeoTokenV2(token).transferFrom(msg.sender, address(this), amount);
        
        // Incrementa nonce do usuário
        uint256 nonce = nonces[msg.sender]++;
        
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
     * @notice Processa bridge com provas multi-sig (Chain B)
     * @param request Dados da bridge request
     * @param signatures Array de assinaturas dos signers
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
        
        // Gera ID único da bridge
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
        
        // Previne replay attacks
        require(!processedBridges[bridgeId], "Bridge already processed");
        
        // Valida assinaturas
        _validateSignatures(bridgeId, signatures);
        
        // Marca como processada
        processedBridges[bridgeId] = true;
        
        // Minta tokens na chain de destino
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
     * @notice Valida assinaturas multi-sig
     * @param bridgeId ID da bridge
     * @param signatures Array de assinaturas
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
            
            // Previne assinaturas duplicadas
            for (uint256 j = 0; j < i; j++) {
                require(signers[j] != signer, "Duplicate signature");
            }
            
            signers[i] = signer;
        }
    }

    /**
     * @notice Adiciona um signer autorizado
     * @param signer Endereço do signer
     */
    function addSigner(address signer) external onlyOwner {
        require(signer != address(0), "Invalid signer");
        require(!authorizedSigners[signer], "Signer already authorized");
        
        authorizedSigners[signer] = true;
        signerCount++;
        
        emit SignerAdded(signer);
    }

    /**
     * @notice Remove um signer autorizado
     * @param signer Endereço do signer
     */
    function removeSigner(address signer) external onlyOwner {
        require(authorizedSigners[signer], "Signer not authorized");
        require(signerCount - 1 >= requiredSignatures, "Would break multi-sig");
        
        authorizedSigners[signer] = false;
        signerCount--;
        
        emit SignerRemoved(signer);
    }

    /**
     * @notice Adiciona token suportado
     * @param token Endereço do token
     */
    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(!supportedTokens[token], "Token already supported");
        
        supportedTokens[token] = true;
        emit TokenSupported(token);
    }

    /**
     * @notice Remove token suportado
     * @param token Endereço do token
     */
    function removeSupportedToken(address token) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        
        supportedTokens[token] = false;
        emit TokenUnsupported(token);
    }

    /**
     * @notice Atualiza número de assinaturas necessárias
     * @param _requiredSignatures Novo número de assinaturas
     */
    function setRequiredSignatures(uint256 _requiredSignatures) external onlyOwner {
        require(_requiredSignatures >= 2, "Min 2 signatures required");
        require(_requiredSignatures <= signerCount, "Cannot exceed signer count");
        
        requiredSignatures = _requiredSignatures;
        emit RequiredSignaturesUpdated(_requiredSignatures);
    }

    /**
     * @notice Atualiza fee de bridge
     * @param _bridgeFee Novo fee em wei
     */
    function setBridgeFee(uint256 _bridgeFee) external onlyOwner {
        bridgeFee = _bridgeFee;
        emit BridgeFeeUpdated(_bridgeFee);
    }

    /**
     * @notice Retira fees acumulados
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @notice Verifica se uma bridge já foi processada
     * @param request Dados da bridge request
     * @return bool True se já foi processada
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
     * @notice Retorna informações do bridge
     */
    function getBridgeInfo() external view returns (
        uint256 _requiredSignatures,
        uint256 _signerCount,
        uint256 _bridgeFee
    ) {
        return (requiredSignatures, signerCount, bridgeFee);
    }
}
