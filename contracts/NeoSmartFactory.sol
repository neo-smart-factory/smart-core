// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./tokens/NeoERC20.sol";
import "./tokens/NeoERC721.sol";
import "./vesting/NeoVesting.sol";
import "./rewards/NeoRewards.sol";

/**
 * @title NeoSmartFactory
 * @notice Fábrica descentralizada para criação de protocolos completos
 * @dev Sistema modular que permite criar tokens, vestings, recompensas e badges
 */
contract NeoSmartFactory is Ownable, ReentrancyGuard {
    // Estruturas de dados
    struct Protocol {
        address creator;
        string name;
        string symbol;
        address tokenAddress;
        address vestingAddress;
        address rewardsAddress;
        uint256 createdAt;
        bool active;
    }

    struct TokenConfig {
        string name;
        string symbol;
        uint256 totalSupply;
        uint8 decimals;
        bool mintable;
        bool burnable;
        bool pausable;
    }

    struct VestingConfig {
        address beneficiary;
        uint256 totalAmount;
        uint256 startTime;
        uint256 duration;
        uint256 cliff;
        bool revocable;
    }

    // Mapeamentos
    mapping(uint256 => Protocol) public protocols;
    mapping(address => uint256[]) public creatorProtocols;
    mapping(address => bool) public authorizedCreators;
    
    uint256 public protocolCounter;
    uint256 public creationFee;

    // Eventos
    event ProtocolCreated(
        uint256 indexed protocolId,
        address indexed creator,
        string name,
        address tokenAddress,
        address vestingAddress,
        address rewardsAddress
    );

    event TokenCreated(
        uint256 indexed protocolId,
        address indexed tokenAddress,
        string name,
        string symbol
    );

    event VestingCreated(
        uint256 indexed protocolId,
        address indexed vestingAddress,
        address beneficiary
    );

    event RewardsCreated(
        uint256 indexed protocolId,
        address indexed rewardsAddress
    );

    constructor(uint256 _creationFee) {
        creationFee = _creationFee;
        authorizedCreators[msg.sender] = true;
    }

    /**
     * @notice Cria um protocolo completo com token, vesting e sistema de recompensas
     * @param tokenConfig Configuração do token ERC20
     * @param vestingConfigs Array de configurações de vesting
     * @param rewardsEnabled Se deve criar sistema de recompensas
     */
    function createProtocol(
        TokenConfig memory tokenConfig,
        VestingConfig[] memory vestingConfigs,
        bool rewardsEnabled
    ) external payable nonReentrant returns (uint256 protocolId) {
        require(msg.value >= creationFee, "Insufficient fee");
        require(bytes(tokenConfig.name).length > 0, "Invalid token name");
        require(bytes(tokenConfig.symbol).length > 0, "Invalid token symbol");

        protocolId = protocolCounter++;
        
        // Criar token ERC20
        NeoERC20 token = new NeoERC20(
            tokenConfig.name,
            tokenConfig.symbol,
            tokenConfig.totalSupply,
            tokenConfig.decimals,
            tokenConfig.mintable,
            tokenConfig.burnable,
            tokenConfig.pausable,
            msg.sender
        );

        address vestingAddress = address(0);
        address rewardsAddress = address(0);

        // Criar vesting se houver configurações
        if (vestingConfigs.length > 0) {
            NeoVesting vesting = new NeoVesting(
                address(token),
                msg.sender
            );
            vestingAddress = address(vesting);

            // Configurar vestings
            for (uint256 i = 0; i < vestingConfigs.length; i++) {
                require(
                    vestingConfigs[i].totalAmount <= tokenConfig.totalSupply,
                    "Vesting amount exceeds supply"
                );
                
                token.transfer(vestingAddress, vestingConfigs[i].totalAmount);
                
                vesting.createVestingSchedule(
                    vestingConfigs[i].beneficiary,
                    vestingConfigs[i].totalAmount,
                    vestingConfigs[i].startTime,
                    vestingConfigs[i].duration,
                    vestingConfigs[i].cliff,
                    vestingConfigs[i].revocable
                );
            }
        }

        // Criar sistema de recompensas se habilitado
        if (rewardsEnabled) {
            NeoRewards rewards = new NeoRewards(
                address(token),
                msg.sender
            );
            rewardsAddress = address(rewards);
        }

        // Registrar protocolo
        protocols[protocolId] = Protocol({
            creator: msg.sender,
            name: tokenConfig.name,
            symbol: tokenConfig.symbol,
            tokenAddress: address(token),
            vestingAddress: vestingAddress,
            rewardsAddress: rewardsAddress,
            createdAt: block.timestamp,
            active: true
        });

        creatorProtocols[msg.sender].push(protocolId);

        emit ProtocolCreated(
            protocolId,
            msg.sender,
            tokenConfig.name,
            address(token),
            vestingAddress,
            rewardsAddress
        );

        emit TokenCreated(protocolId, address(token), tokenConfig.name, tokenConfig.symbol);
        
        if (vestingAddress != address(0)) {
            emit VestingCreated(protocolId, vestingAddress, vestingConfigs[0].beneficiary);
        }
        
        if (rewardsAddress != address(0)) {
            emit RewardsCreated(protocolId, rewardsAddress);
        }

        return protocolId;
    }

    /**
     * @notice Cria apenas um token ERC20
     */
    function createToken(TokenConfig memory tokenConfig)
        external
        payable
        nonReentrant
        returns (address tokenAddress)
    {
        require(msg.value >= creationFee, "Insufficient fee");
        
        NeoERC20 token = new NeoERC20(
            tokenConfig.name,
            tokenConfig.symbol,
            tokenConfig.totalSupply,
            tokenConfig.decimals,
            tokenConfig.mintable,
            tokenConfig.burnable,
            tokenConfig.pausable,
            msg.sender
        );

        return address(token);
    }

    /**
     * @notice Cria apenas um NFT (ERC721)
     */
    function createNFT(
        string memory name,
        string memory symbol,
        string memory baseURI,
        bool mintable
    ) external payable nonReentrant returns (address nftAddress) {
        require(msg.value >= creationFee, "Insufficient fee");
        
        NeoERC721 nft = new NeoERC721(
            name,
            symbol,
            baseURI,
            mintable,
            msg.sender
        );

        return address(nft);
    }

    /**
     * @notice Retorna todos os protocolos criados por um endereço
     */
    function getCreatorProtocols(address creator)
        external
        view
        returns (uint256[] memory)
    {
        return creatorProtocols[creator];
    }

    /**
     * @notice Retorna informações de um protocolo
     */
    function getProtocol(uint256 protocolId)
        external
        view
        returns (Protocol memory)
    {
        return protocols[protocolId];
    }

    /**
     * @notice Atualiza taxa de criação (apenas owner)
     */
    function setCreationFee(uint256 _creationFee) external onlyOwner {
        creationFee = _creationFee;
    }

    /**
     * @notice Autoriza um criador (apenas owner)
     */
    function authorizeCreator(address creator) external onlyOwner {
        authorizedCreators[creator] = true;
    }

    /**
     * @notice Revoga autorização de um criador (apenas owner)
     */
    function revokeCreator(address creator) external onlyOwner {
        authorizedCreators[creator] = false;
    }

    /**
     * @notice Retira fundos acumulados (apenas owner)
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
