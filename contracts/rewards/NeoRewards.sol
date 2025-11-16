// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NeoRewards
 * @notice Sistema de recompensas e badges programável
 * @dev Permite distribuir recompensas e criar badges para usuários
 */
contract NeoRewards is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Badge {
        string name;
        string description;
        string metadataURI;
        uint256 createdAt;
        bool active;
    }

    struct Reward {
        address recipient;
        uint256 amount;
        string reason;
        uint256 timestamp;
    }

    IERC20 public immutable token;
    
    mapping(uint256 => Badge) public badges;
    mapping(address => uint256[]) public userBadges;
    mapping(address => Reward[]) public userRewards;
    mapping(address => uint256) public totalRewardsClaimed;
    
    uint256 public badgeCounter;
    uint256 public totalRewardsDistributed;

    event BadgeCreated(
        uint256 indexed badgeId,
        string name,
        string description
    );

    event BadgeAwarded(
        uint256 indexed badgeId,
        address indexed user,
        string name
    );

    event RewardDistributed(
        address indexed recipient,
        uint256 amount,
        string reason
    );

    event RewardClaimed(
        address indexed recipient,
        uint256 amount
    );

    constructor(address _token, address creator) {
        token = IERC20(_token);
        _transferOwnership(creator);
    }

    /**
     * @notice Cria um novo badge
     */
    function createBadge(
        string memory name,
        string memory description,
        string memory metadataURI
    ) external onlyOwner returns (uint256 badgeId) {
        badgeId = badgeCounter++;
        badges[badgeId] = Badge({
            name: name,
            description: description,
            metadataURI: metadataURI,
            createdAt: block.timestamp,
            active: true
        });

        emit BadgeCreated(badgeId, name, description);
    }

    /**
     * @notice Concede um badge a um usuário
     */
    function awardBadge(address user, uint256 badgeId) external onlyOwner {
        require(badges[badgeId].active, "Badge not active");
        require(user != address(0), "Invalid user");

        // Verifica se o usuário já possui o badge
        uint256[] memory userBadgeList = userBadges[user];
        bool alreadyHasBadge = false;
        for (uint256 i = 0; i < userBadgeList.length; i++) {
            if (userBadgeList[i] == badgeId) {
                alreadyHasBadge = true;
                break;
            }
        }

        if (!alreadyHasBadge) {
            userBadges[user].push(badgeId);
            emit BadgeAwarded(badgeId, user, badges[badgeId].name);
        }
    }

    /**
     * @notice Concede múltiplos badges de uma vez
     */
    function batchAwardBadges(
        address[] memory users,
        uint256[] memory badgeIds
    ) external onlyOwner {
        require(users.length == badgeIds.length, "Arrays length mismatch");

        for (uint256 i = 0; i < users.length; i++) {
            if (badges[badgeIds[i]].active && users[i] != address(0)) {
                uint256[] memory userBadgeList = userBadges[users[i]];
                bool alreadyHasBadge = false;
                for (uint256 j = 0; j < userBadgeList.length; j++) {
                    if (userBadgeList[j] == badgeIds[i]) {
                        alreadyHasBadge = true;
                        break;
                    }
                }

                if (!alreadyHasBadge) {
                    userBadges[users[i]].push(badgeIds[i]);
                    emit BadgeAwarded(
                        badgeIds[i],
                        users[i],
                        badges[badgeIds[i]].name
                    );
                }
            }
        }
    }

    /**
     * @notice Distribui recompensa em tokens
     */
    function distributeReward(
        address recipient,
        uint256 amount,
        string memory reason
    ) external onlyOwner nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        userRewards[recipient].push(
            Reward({
                recipient: recipient,
                amount: amount,
                reason: reason,
                timestamp: block.timestamp
            })
        );

        totalRewardsDistributed += amount;
        token.safeTransfer(recipient, amount);

        emit RewardDistributed(recipient, amount, reason);
    }

    /**
     * @notice Distribui recompensas para múltiplos usuários
     */
    function batchDistributeRewards(
        address[] memory recipients,
        uint256[] memory amounts,
        string[] memory reasons
    ) external onlyOwner nonReentrant {
        require(
            recipients.length == amounts.length &&
                amounts.length == reasons.length,
            "Arrays length mismatch"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] != address(0) && amounts[i] > 0) {
                userRewards[recipients[i]].push(
                    Reward({
                        recipient: recipients[i],
                        amount: amounts[i],
                        reason: reasons[i],
                        timestamp: block.timestamp
                    })
                );

                totalRewardsDistributed += amounts[i];
                token.safeTransfer(recipients[i], amounts[i]);

                emit RewardDistributed(recipients[i], amounts[i], reasons[i]);
            }
        }
    }

    /**
     * @notice Desativa um badge
     */
    function deactivateBadge(uint256 badgeId) external onlyOwner {
        badges[badgeId].active = false;
    }

    /**
     * @notice Retorna todos os badges de um usuário
     */
    function getUserBadges(address user)
        external
        view
        returns (uint256[] memory)
    {
        return userBadges[user];
    }

    /**
     * @notice Retorna todas as recompensas de um usuário
     */
    function getUserRewards(address user)
        external
        view
        returns (Reward[] memory)
    {
        return userRewards[user];
    }

    /**
     * @notice Retorna informações de um badge
     */
    function getBadge(uint256 badgeId)
        external
        view
        returns (Badge memory)
    {
        return badges[badgeId];
    }
}

