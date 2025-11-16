// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NeoVesting
 * @notice Sistema de vesting programável para tokens
 * @dev Permite criar múltiplos schedules de vesting com cliff e revogação
 */
contract NeoVesting is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct VestingSchedule {
        address beneficiary;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 duration;
        uint256 cliff;
        bool revocable;
        bool revoked;
    }

    IERC20 public immutable token;
    mapping(bytes32 => VestingSchedule) public vestingSchedules;
    mapping(address => bytes32[]) public beneficiarySchedules;
    
    uint256 public totalVestingAmount;
    uint256 public totalReleasedAmount;

    event VestingScheduleCreated(
        bytes32 indexed scheduleId,
        address indexed beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 duration,
        uint256 cliff
    );

    event TokensReleased(
        bytes32 indexed scheduleId,
        address indexed beneficiary,
        uint256 amount
    );

    event VestingRevoked(
        bytes32 indexed scheduleId,
        address indexed beneficiary,
        uint256 revokedAmount
    );

    constructor(address _token, address creator) {
        token = IERC20(_token);
        _transferOwnership(creator);
    }

    /**
     * @notice Cria um novo schedule de vesting
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 duration,
        uint256 cliff,
        bool revocable
    ) external onlyOwner returns (bytes32 scheduleId) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(totalAmount > 0, "Invalid amount");
        require(duration > 0, "Invalid duration");
        require(cliff <= duration, "Cliff exceeds duration");

        scheduleId = keccak256(
            abi.encodePacked(
                beneficiary,
                totalAmount,
                startTime,
                duration,
                cliff,
                block.timestamp
            )
        );

        require(
            vestingSchedules[scheduleId].totalAmount == 0,
            "Schedule already exists"
        );

        vestingSchedules[scheduleId] = VestingSchedule({
            beneficiary: beneficiary,
            totalAmount: totalAmount,
            releasedAmount: 0,
            startTime: startTime == 0 ? block.timestamp : startTime,
            duration: duration,
            cliff: cliff,
            revocable: revocable,
            revoked: false
        });

        beneficiarySchedules[beneficiary].push(scheduleId);
        totalVestingAmount += totalAmount;

        emit VestingScheduleCreated(
            scheduleId,
            beneficiary,
            totalAmount,
            vestingSchedules[scheduleId].startTime,
            duration,
            cliff
        );
    }

    /**
     * @notice Libera tokens de um schedule específico
     */
    function release(bytes32 scheduleId) external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[scheduleId];
        require(schedule.beneficiary == msg.sender, "Not beneficiary");
        require(!schedule.revoked, "Schedule revoked");

        uint256 releasable = _calculateReleasableAmount(schedule);
        require(releasable > 0, "No tokens to release");

        schedule.releasedAmount += releasable;
        totalReleasedAmount += releasable;

        token.safeTransfer(schedule.beneficiary, releasable);

        emit TokensReleased(scheduleId, schedule.beneficiary, releasable);
    }

    /**
     * @notice Libera tokens de todos os schedules do chamador
     */
    function releaseAll() external nonReentrant {
        bytes32[] memory schedules = beneficiarySchedules[msg.sender];
        uint256 totalReleasable = 0;

        for (uint256 i = 0; i < schedules.length; i++) {
            VestingSchedule storage schedule = vestingSchedules[schedules[i]];
            if (!schedule.revoked) {
                uint256 releasable = _calculateReleasableAmount(schedule);
                if (releasable > 0) {
                    schedule.releasedAmount += releasable;
                    totalReleasable += releasable;
                    emit TokensReleased(
                        schedules[i],
                        schedule.beneficiary,
                        releasable
                    );
                }
            }
        }

        require(totalReleasable > 0, "No tokens to release");
        totalReleasedAmount += totalReleasable;
        token.safeTransfer(msg.sender, totalReleasable);
    }

    /**
     * @notice Revoga um schedule de vesting (apenas se revocable)
     */
    function revoke(bytes32 scheduleId) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[scheduleId];
        require(schedule.revocable, "Schedule not revocable");
        require(!schedule.revoked, "Already revoked");

        uint256 releasable = _calculateReleasableAmount(schedule);
        uint256 revokedAmount = schedule.totalAmount - schedule.releasedAmount - releasable;

        schedule.revoked = true;
        totalVestingAmount -= revokedAmount;

        if (releasable > 0) {
            schedule.releasedAmount += releasable;
            totalReleasedAmount += releasable;
            token.safeTransfer(schedule.beneficiary, releasable);
        }

        emit VestingRevoked(scheduleId, schedule.beneficiary, revokedAmount);
    }

    /**
     * @notice Calcula a quantidade de tokens que podem ser liberados
     */
    function getReleasableAmount(bytes32 scheduleId)
        external
        view
        returns (uint256)
    {
        VestingSchedule storage schedule = vestingSchedules[scheduleId];
        if (schedule.revoked) {
            return 0;
        }
        return _calculateReleasableAmount(schedule);
    }

    /**
     * @notice Retorna todos os schedules de um beneficiário
     */
    function getBeneficiarySchedules(address beneficiary)
        external
        view
        returns (bytes32[] memory)
    {
        return beneficiarySchedules[beneficiary];
    }

    /**
     * @notice Calcula a quantidade liberável baseada no tempo decorrido
     */
    function _calculateReleasableAmount(VestingSchedule storage schedule)
        internal
        view
        returns (uint256)
    {
        if (block.timestamp < schedule.startTime + schedule.cliff) {
            return 0;
        }

        if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount - schedule.releasedAmount;
        }

        uint256 elapsed = block.timestamp - schedule.startTime;
        uint256 vestedAmount = (schedule.totalAmount * elapsed) /
            schedule.duration;

        return vestedAmount - schedule.releasedAmount;
    }
}

