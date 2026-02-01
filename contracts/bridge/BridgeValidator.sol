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
 
/**
 * @title BridgeValidator
 * @notice Validation library for the bridge system
 * @dev Helper functions for data validation and security
 */
library BridgeValidator {
    
    /**
     * @notice Validates parameters of a bridge request
     * @param token Token address
     * @param from Origin address
     * @param to Destination address
     * @param amount Quantity
     * @param sourceChainId Source Chain ID
     * @param targetChainId Target Chain ID
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
     * @notice Validates timestamp of a bridge request
     * @param timestamp Request timestamp
     * @param maxAge Maximum allowed age in seconds
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
     * @notice Validates minimum and maximum amounts
     * @param amount Amount to validate
     * @param minAmount Minimum amount
     * @param maxAmount Maximum amount
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
     * @notice Generates a unique bridge ID
     * @param token Token address
     * @param from Origin address
     * @param to Destination address
     * @param amount Quantity
     * @param sourceChainId Source Chain ID
     * @param targetChainId Target Chain ID
     * @param sourceTxHash Source TX hash
     * @param nonce Nonce
     * @return bytes32 Unique bridge ID
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
     * @notice Validates that an address array has no duplicates
     * @param addresses Address array
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
     * @notice Validates if a chain ID is supported
     * @param chainId Chain ID to validate
     * @param supportedChains Array of supported chain IDs
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
