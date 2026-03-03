// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockPausable
 * @notice Minimal pausable mock for EmergencyGuardian tests
 */
contract MockPausable {
    bool private _paused;

    function pause() external {
        _paused = true;
    }

    function unpause() external {
        _paused = false;
    }

    function paused() external view returns (bool) {
        return _paused;
    }
}
