// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  TOKENIZE | NΞØ SMART FACTORY v0.5.3
 */
 
/**
 * @title BridgeValidator
 * @notice Biblioteca de validação para o sistema de bridge
 * @dev Funções auxiliares para validação de dados e segurança
 */
library BridgeValidator {
    
    /**
     * @notice Valida parâmetros de uma bridge request
     * @param token Endereço do token
     * @param from Endereço de origem
     * @param to Endereço de destino
     * @param amount Quantidade
     * @param sourceChainId Chain ID de origem
     * @param targetChainId Chain ID de destino
     */
    function validateBridgeRequest(
        address token,
        address from,
        address to,
        uint256 amount,
        uint256 sourceChainId,
        uint256 targetChainId
    ) internal view {
        require(token != address(0), "BridgeValidator: Invalid token");
        require(from != address(0), "BridgeValidator: Invalid from address");
        require(to != address(0), "BridgeValidator: Invalid to address");
        require(amount > 0, "BridgeValidator: Amount must be > 0");
        require(sourceChainId != 0, "BridgeValidator: Invalid source chain");
        require(targetChainId != 0, "BridgeValidator: Invalid target chain");
        require(sourceChainId != targetChainId, "BridgeValidator: Same chain bridge");
        require(targetChainId == block.chainid, "BridgeValidator: Wrong target chain");
    }

    /**
     * @notice Valida timestamp de uma bridge request
     * @param timestamp Timestamp da request
     * @param maxAge Idade máxima permitida em segundos
     */
    function validateTimestamp(uint256 timestamp, uint256 maxAge) internal view {
        require(timestamp > 0, "BridgeValidator: Invalid timestamp");
        require(timestamp <= block.timestamp, "BridgeValidator: Future timestamp");
        require(
            block.timestamp - timestamp <= maxAge,
            "BridgeValidator: Request expired"
        );
    }

    /**
     * @notice Valida quantidade mínima e máxima
     * @param amount Quantidade a validar
     * @param minAmount Quantidade mínima
     * @param maxAmount Quantidade máxima
     */
    function validateAmount(
        uint256 amount,
        uint256 minAmount,
        uint256 maxAmount
    ) internal pure {
        require(amount >= minAmount, "BridgeValidator: Amount below minimum");
        require(amount <= maxAmount, "BridgeValidator: Amount above maximum");
    }

    /**
     * @notice Gera ID único de uma bridge
     * @param token Endereço do token
     * @param from Endereço de origem
     * @param to Endereço de destino
     * @param amount Quantidade
     * @param sourceChainId Chain ID de origem
     * @param targetChainId Chain ID de destino
     * @param sourceTxHash Hash da tx de origem
     * @param nonce Nonce
     * @return bytes32 ID único da bridge
     */
    function generateBridgeId(
        address token,
        address from,
        address to,
        uint256 amount,
        uint256 sourceChainId,
        uint256 targetChainId,
        bytes32 sourceTxHash,
        uint256 nonce
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                token,
                from,
                to,
                amount,
                sourceChainId,
                targetChainId,
                sourceTxHash,
                nonce
            )
        );
    }

    /**
     * @notice Valida que um array de endereços não tem duplicatas
     * @param addresses Array de endereços
     */
    function validateNoDuplicates(address[] memory addresses) internal pure {
        for (uint256 i = 0; i < addresses.length; i++) {
            for (uint256 j = i + 1; j < addresses.length; j++) {
                require(
                    addresses[i] != addresses[j],
                    "BridgeValidator: Duplicate address"
                );
            }
        }
    }

    /**
     * @notice Valida chain ID suportada
     * @param chainId Chain ID a validar
     * @param supportedChains Array de chains suportadas
     */
    function validateChainId(
        uint256 chainId,
        uint256[] memory supportedChains
    ) internal pure {
        bool isSupported = false;
        
        for (uint256 i = 0; i < supportedChains.length; i++) {
            if (supportedChains[i] == chainId) {
                isSupported = true;
                break;
            }
        }
        
        require(isSupported, "BridgeValidator: Chain not supported");
    }
}
