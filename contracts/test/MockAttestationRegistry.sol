// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev Mock registry for NeoGenesisNFT tests only — NOT for production
contract MockAttestationRegistry {

    struct MockResult {
        bool exists;
        bool revoked;
        uint256 timestamp;
    }

    mapping(bytes32 => MockResult) private _results;

    /// @dev Set the mock response for a given contentHash
    function setResult(bytes32 contentHash, bool exists, bool revoked) external {
        _results[contentHash] = MockResult({
            exists:    exists,
            revoked:   revoked,
            timestamp: exists ? block.timestamp : 0
        });
    }

    /// @dev Mirrors NeoAttestationRegistry.verifyAttestation()
    function verifyAttestation(bytes32 contentHash)
        external
        view
        returns (bool exists, bool revoked, uint256 timestamp)
    {
        MockResult storage r = _results[contentHash];
        return (r.exists, r.revoked, r.timestamp);
    }
}
