// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  NΞØ SMART FACTORY v0.5.3 | ATTESTATION
 *  Author: NEØ MELLØ // NEØ PROTOCOL
 *
 *  Licensed under MIT. Attribution to NΞØ Protocol is required for derivatives.
 *  "Powered by NEØ SMART FACTORY"
 */

/// @title NeoAttestationRegistry — NEØ Protocol PoE Registry
/// @author MELLØ
/// @notice Registro imutável on-chain de eventos e marcos do Protocolo NΞØ
/// @dev Proof of Existence (PoE) sem token. Guardian + whitelist de attesters.
///      O contentHash é computado off-chain (keccak256). Eventos são a prova
///      permanente e imutável. Storage é minimal e intencional.
///      VERSIONABLE: este contrato pode ser substituído. O que persiste são os eventos.

/*//////////////////////////////////////////////////////////////
                        PROTOCOL ANCHORS
//////////////////////////////////////////////////////////////*/

contract NeoAttestationRegistry {

    string  public constant PROTOCOL    = unicode"NEØ Protocol";
    bytes32 public constant PROTOCOL_ID = keccak256(unicode"NEØ_PROTOCOL_CORE");
    string  public constant MODULE      = "NeoAttestationRegistry";
    string  public constant VERSION     = "1.0.0";

    /*//////////////////////////////////////////////////////////////
                               ERRORS
    //////////////////////////////////////////////////////////////*/

    error NotGuardian();
    error NotAttester();
    error ZeroAddress();
    error InvalidHash();
    error AttestationAlreadyExists();
    error AttestationNotFound();
    error AlreadyAttester();
    error NotAnAttester();
    error Unauthorized();

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitido quando uma prova é registrada — esta é a prova imutável
    event AttestationRegistered(
        bytes32 indexed contentHash,
        address indexed attester,
        uint256 indexed timestamp,
        string  metadata
    );

    /// @notice Emitido quando uma prova é revogada (dado preservado, prova marcada inválida)
    event AttestationRevoked(
        bytes32 indexed contentHash,
        address indexed revokedBy,
        uint256 timestamp
    );

    event AttesterAdded(address indexed attester);
    event AttesterRemoved(address indexed attester);
    event GuardianTransferred(address indexed oldGuardian, address indexed newGuardian);

    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/

    address public guardian;

    /// @notice Whitelist de endereços autorizados a registrar provas
    mapping(address => bool) public isAttester;

    struct Attestation {
        bytes32 contentHash; // keccak256 do evento/documento (computado off-chain)
        address attester;    // quem registrou
        uint256 timestamp;   // block.timestamp no momento do registro
        string  metadata;    // descrição legível, URI IPFS, link GitHub, versão, etc.
        bool    revoked;     // true = prova revogada (histórico preservado, nunca deletado)
    }

    /// @dev Mapeamento principal: hash → attestation
    mapping(bytes32 => Attestation) private _attestations;

    /*//////////////////////////////////////////////////////////////
                             MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyGuardian() {
        if (msg.sender != guardian) revert NotGuardian();
        _;
    }

    modifier onlyAttester() {
        if (!isAttester[msg.sender]) revert NotAttester();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @param _guardian Endereço do guardian inicial (owner do registro)
    constructor(address _guardian) {
        if (_guardian == address(0)) revert ZeroAddress();
        guardian = _guardian;
    }

    /*//////////////////////////////////////////////////////////////
                          CORE REGISTRY LOGIC
    //////////////////////////////////////////////////////////////*/

    /// @notice Registra uma prova de existência on-chain
    /// @param contentHash keccak256 do evento/documento computado off-chain
    /// @param metadata Descrição legível, URI IPFS, link, versão ou qualquer metadado relevante
    /// @dev Apenas attesters autorizados. Não sobrescreve provas existentes.
    function registerAttestation(
        bytes32 contentHash,
        string calldata metadata
    ) external onlyAttester {
        if (contentHash == bytes32(0)) revert InvalidHash();
        if (_attestations[contentHash].timestamp != 0) revert AttestationAlreadyExists();

        _attestations[contentHash] = Attestation({
            contentHash: contentHash,
            attester:    msg.sender,
            timestamp:   block.timestamp,
            metadata:    metadata,
            revoked:     false
        });

        emit AttestationRegistered(contentHash, msg.sender, block.timestamp, metadata);
    }

    /// @notice Revoga uma prova existente (não apaga — histórico preservado)
    /// @param contentHash Hash da prova a ser revogada
    /// @dev Guardian pode revogar qualquer prova. Attester pode revogar apenas as suas.
    function revokeAttestation(bytes32 contentHash) external {
        Attestation storage att = _attestations[contentHash];

        if (att.timestamp == 0) revert AttestationNotFound();
        if (msg.sender != guardian && msg.sender != att.attester) revert Unauthorized();

        att.revoked = true;

        emit AttestationRevoked(contentHash, msg.sender, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                        WHITELIST MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /// @notice Adiciona um endereço à whitelist de attesters
    /// @param attester Endereço a ser autorizado
    function addAttester(address attester) external onlyGuardian {
        if (attester == address(0)) revert ZeroAddress();
        if (isAttester[attester]) revert AlreadyAttester();

        isAttester[attester] = true;

        emit AttesterAdded(attester);
    }

    /// @notice Remove um endereço da whitelist de attesters
    /// @param attester Endereço a ser removido
    function removeAttester(address attester) external onlyGuardian {
        if (!isAttester[attester]) revert NotAnAttester();

        isAttester[attester] = false;

        emit AttesterRemoved(attester);
    }

    /*//////////////////////////////////////////////////////////////
                        GUARDIAN MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /// @notice Transfere o controle do guardian para outro endereço
    /// @param newGuardian Novo endereço guardian
    function transferGuardian(address newGuardian) external onlyGuardian {
        if (newGuardian == address(0)) revert ZeroAddress();

        address old = guardian;
        guardian = newGuardian;

        emit GuardianTransferred(old, newGuardian);
    }

    /*//////////////////////////////////////////////////////////////
                           VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Retorna os dados completos de uma attestation
    /// @param contentHash Hash da prova
    /// @return Attestation struct com todos os campos
    function getAttestation(bytes32 contentHash)
        external
        view
        returns (Attestation memory)
    {
        if (_attestations[contentHash].timestamp == 0) revert AttestationNotFound();
        return _attestations[contentHash];
    }

    /// @notice Verifica se uma prova existe e seu estado atual
    /// @param contentHash Hash a verificar
    /// @return exists    true se a prova foi registrada
    /// @return revoked   true se a prova foi revogada
    /// @return timestamp Quando foi registrada (0 se não existe)
    /// @dev Nunca reverte — seguro para verificações externas sem try/catch
    function verifyAttestation(bytes32 contentHash)
        external
        view
        returns (bool exists, bool revoked, uint256 timestamp)
    {
        Attestation storage att = _attestations[contentHash];
        if (att.timestamp == 0) return (false, false, 0);
        return (true, att.revoked, att.timestamp);
    }
}
