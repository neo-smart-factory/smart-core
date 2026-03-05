// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title NodeRegistry — NHIP-001
/// @author MELLØ
/// @notice Registro on-chain de nós reconhecidos pelo Protocolo NΞØ
/// @dev Contrato minimalista. Validação ocorre off-chain (NHIP-000 + MCP).

contract NodeRegistry {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error NotGuardian();
    error NodeAlreadyRegistered();
    error NodeNotRegistered();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event NodeRegistered(
        address indexed nodeAddress,
        string domain,
        uint256 registeredAt
    );

    event NodeDeactivated(
        address indexed nodeAddress,
        uint256 deactivatedAt
    );

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    address public guardian;

    struct Node {
        address nodeAddress;
        string domain;
        uint256 registeredAt;
        bool active;
    }

    mapping(address => Node) private nodes;

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyGuardian() {
        if (msg.sender != guardian) revert NotGuardian();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _guardian) {
        guardian = _guardian;
    }

    /*//////////////////////////////////////////////////////////////
                        CORE REGISTRY LOGIC
    //////////////////////////////////////////////////////////////*/

    /// @notice Registra um novo nó reconhecido pelo protocolo
    /// @param nodeAddress Endereço do nó a ser registrado
    /// @param domain Domínio declarado pelo nó
    function registerNode(
        address nodeAddress,
        string calldata domain
    ) external onlyGuardian {
        if (nodes[nodeAddress].registeredAt != 0)
            revert NodeAlreadyRegistered();

        nodes[nodeAddress] = Node({
            nodeAddress: nodeAddress,
            domain: domain,
            registeredAt: block.timestamp,
            active: true
        });

        emit NodeRegistered(nodeAddress, domain, block.timestamp);
    }

    /// @notice Desativa um nó existente (não apaga histórico)
    /// @param nodeAddress Endereço do nó a ser desativado
    function deactivateNode(address nodeAddress)
        external
        onlyGuardian
    {
        if (nodes[nodeAddress].registeredAt == 0)
            revert NodeNotRegistered();

        nodes[nodeAddress].active = false;

        emit NodeDeactivated(nodeAddress, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Verifica se um endereço está registrado
    /// @param nodeAddress Endereço a verificar
    /// @return true se o nó está registrado, false caso contrário
    function isRegistered(address nodeAddress)
        external
        view
        returns (bool)
    {
        return nodes[nodeAddress].registeredAt != 0;
    }

    /// @notice Retorna os dados completos de um nó
    /// @param nodeAddress Endereço do nó
    /// @return Node struct com todos os dados do nó
    function getNode(address nodeAddress)
        external
        view
        returns (Node memory)
    {
        if (nodes[nodeAddress].registeredAt == 0)
            revert NodeNotRegistered();

        return nodes[nodeAddress];
    }
}
