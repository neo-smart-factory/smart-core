// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../tokens/NeoERC20.sol";
import "../vesting/NeoVesting.sol";
import "../rewards/NeoRewards.sol";
import "./FactoryTypes.sol";

/**
 * @title FactoryProtocolDeployer
 * @notice Módulo especializado para deploy do protocolo completo (token + vesting + rewards)
 * @dev Mantém a NeoSmartFactory leve e abaixo do limite de code size em mainnet.
 */
contract FactoryProtocolDeployer {
    error NotFactory();
    error ZeroFactory();

    address public immutable factory;

    constructor(address factoryAddress) {
        if (factoryAddress == address(0)) revert ZeroFactory();
        factory = factoryAddress;
    }

    modifier onlyFactory() {
        if (msg.sender != factory) revert NotFactory();
        _;
    }

    function deployProtocol(
        address creator,
        FactoryTypes.TokenConfig calldata tokenConfig,
        FactoryTypes.VestingConfig[] calldata vestingConfigs,
        bool rewardsEnabled
    )
        external
        onlyFactory
        returns (address tokenAddress, address vestingAddress, address rewardsAddress)
    {
        NeoERC20 token = new NeoERC20(
            tokenConfig.name,
            tokenConfig.symbol,
            tokenConfig.totalSupply,
            tokenConfig.decimals,
            tokenConfig.mintable,
            tokenConfig.burnable,
            tokenConfig.pausable,
            address(this)
        );

        tokenAddress = address(token);

        if (vestingConfigs.length > 0) {
            NeoVesting vesting = new NeoVesting(tokenAddress, creator);
            vestingAddress = address(vesting);

            uint256 totalVestingRequested = 0;
            for (uint256 i = 0; i < vestingConfigs.length; i++) {
                FactoryTypes.VestingConfig calldata v = vestingConfigs[i];

                require(v.beneficiary != address(0), "Invalid beneficiary");
                require(v.totalAmount > 0, "Amount must be > 0");
                require(v.duration > 0, "Duration must be > 0");
                require(v.cliff <= v.duration, "Cliff > duration");
                require(v.startTime >= block.timestamp, "Start time in past");

                totalVestingRequested += v.totalAmount;
                require(totalVestingRequested <= tokenConfig.totalSupply, "Vesting exceeds supply");

                token.transfer(vestingAddress, v.totalAmount);
                vesting.createVestingSchedule(
                    v.beneficiary,
                    v.totalAmount,
                    v.startTime,
                    v.duration,
                    v.cliff,
                    v.revocable
                );
            }
        }

        if (rewardsEnabled) {
            NeoRewards rewards = new NeoRewards(tokenAddress, creator);
            rewardsAddress = address(rewards);
        }

        uint256 remainingTokens = token.balanceOf(address(this));
        if (remainingTokens > 0) {
            token.transfer(creator, remainingTokens);
        }

        token.transferOwnership(creator);
    }
}
