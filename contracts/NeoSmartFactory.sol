// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./modules/FactoryTypes.sol";
import "./modules/IFactoryDeployers.sol";

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  TOKENIZE | NΞØ SMART FACTORY v0.5.3
 *  Author: Eurycles Ramos Neto / NODE NEØ
 */

/**
 * @title NeoSmartFactory
 * @notice Fábrica descentralizada para criação de protocolos completos
 * @dev Sistema modular que permite criar tokens, vestings, recompensas e badges
 */
contract NeoSmartFactory is Ownable, ReentrancyGuard, Pausable {
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

    // Mapeamentos
    mapping(uint256 => Protocol) public protocols;
    mapping(address => uint256[]) public creatorProtocols;
    mapping(address => bool) public authorizedCreators;

    // Contadores e Taxas
    uint256 public protocolCounter;
    uint256 public creationFee;

    // Security & Governance
    address public guardian;
    address public protocolDeployer;
    address public assetDeployer;

    // Limites de Segurança
    uint256 public constant MAX_VESTING_SCHEDULES = 20;

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

    event VestingScheduleAdded(
        uint256 indexed protocolId,
        address indexed vestingAddress,
        address indexed beneficiary,
        uint256 amount
    );

    event RewardsCreated(
        uint256 indexed protocolId,
        address indexed rewardsAddress
    );

    event ProtocolStatusChanged(uint256 indexed protocolId, bool active);
    event GuardianUpdated(address indexed newGuardian);
    event ProtocolDeployerUpdated(address indexed newDeployer);
    event AssetDeployerUpdated(address indexed newDeployer);
    event FactoryPaused(address account);
    event FactoryUnpaused(address account);

    constructor(uint256 _creationFee) Ownable(msg.sender) {
        creationFee = _creationFee;
        authorizedCreators[msg.sender] = true;
        guardian = msg.sender;
    }

    /**
     * @notice Cria um protocolo completo com token, vesting e sistema de recompensas
     * @param tokenConfig Configuração do token ERC20
     * @param vestingConfigs Array de configurações de vesting
     * @param rewardsEnabled Se deve criar sistema de recompensas
     */
    function createProtocol(
        FactoryTypes.TokenConfig calldata tokenConfig,
        FactoryTypes.VestingConfig[] calldata vestingConfigs,
        bool rewardsEnabled
    ) external payable whenNotPaused nonReentrant returns (uint256 protocolId) {
        require(msg.value >= creationFee, "Insufficient fee");
        require(bytes(tokenConfig.name).length > 0, "Invalid token name");
        require(bytes(tokenConfig.symbol).length > 0, "Invalid token symbol");
        require(vestingConfigs.length <= MAX_VESTING_SCHEDULES, "Too many vesting schedules");
        require(protocolDeployer != address(0), "Protocol deployer not set");

        protocolId = protocolCounter++;
        (
            address tokenAddress,
            address vestingAddress,
            address rewardsAddress
        ) = IFactoryProtocolDeployer(protocolDeployer).deployProtocol(
            msg.sender,
            tokenConfig,
            vestingConfigs,
            rewardsEnabled
        );

        // Registrar protocolo
        protocols[protocolId] = Protocol({
            creator: msg.sender,
            name: tokenConfig.name,
            symbol: tokenConfig.symbol,
            tokenAddress: tokenAddress,
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
            tokenAddress,
            vestingAddress,
            rewardsAddress
        );

        emit TokenCreated(protocolId, tokenAddress, tokenConfig.name, tokenConfig.symbol);

        if (vestingAddress != address(0)) {
            for (uint256 i = 0; i < vestingConfigs.length; i++) {
                emit VestingScheduleAdded(
                    protocolId,
                    vestingAddress,
                    vestingConfigs[i].beneficiary,
                    vestingConfigs[i].totalAmount
                );
            }
        }

        if (rewardsAddress != address(0)) {
            emit RewardsCreated(protocolId, rewardsAddress);
        }

        return protocolId;
    }

    /**
     * @notice Alterna o status ativo do protocolo (apenas Owner ou Criador)
     */
    function toggleProtocolActive(uint256 protocolId) external {
        Protocol storage p = protocols[protocolId];
        require(msg.sender == owner() || msg.sender == p.creator, "Not authorized");
        p.active = !p.active;
        emit ProtocolStatusChanged(protocolId, p.active);
    }

    /**
     * @notice Cria apenas um token ERC20
     */
    function createToken(FactoryTypes.TokenConfig calldata tokenConfig)
        external
        payable
        whenNotPaused
        nonReentrant
        returns (address tokenAddress)
    {
        require(msg.value >= creationFee, "Insufficient fee");
        require(assetDeployer != address(0), "Asset deployer not set");

        return IFactoryAssetDeployer(assetDeployer).deployToken(msg.sender, tokenConfig);
    }

    /**
     * @notice Cria apenas um NFT (ERC721)
     */
    function createNFT(
        string calldata name,
        string calldata symbol,
        string calldata baseURI,
        bool mintable
    ) external payable whenNotPaused nonReentrant returns (address nftAddress) {
        require(msg.value >= creationFee, "Insufficient fee");
        require(assetDeployer != address(0), "Asset deployer not set");

        return IFactoryAssetDeployer(assetDeployer).deployNFT(
            msg.sender,
            name,
            symbol,
            baseURI,
            mintable
        );
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

    function setProtocolDeployer(address _protocolDeployer) external onlyOwner {
        require(_protocolDeployer != address(0), "Invalid protocol deployer");
        protocolDeployer = _protocolDeployer;
        emit ProtocolDeployerUpdated(_protocolDeployer);
    }

    function setAssetDeployer(address _assetDeployer) external onlyOwner {
        require(_assetDeployer != address(0), "Invalid asset deployer");
        assetDeployer = _assetDeployer;
        emit AssetDeployerUpdated(_assetDeployer);
    }

    function setDeployers(address _protocolDeployer, address _assetDeployer) external onlyOwner {
        require(_protocolDeployer != address(0), "Invalid protocol deployer");
        require(_assetDeployer != address(0), "Invalid asset deployer");
        protocolDeployer = _protocolDeployer;
        assetDeployer = _assetDeployer;
        emit ProtocolDeployerUpdated(_protocolDeployer);
        emit AssetDeployerUpdated(_assetDeployer);
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

    // --- Security & Governance ---

    /**
     * @notice Pausa a fábrica (Owner ou Guardian)
     */
    function pause() external {
        require(msg.sender == owner() || msg.sender == guardian, "Not authorized");
        _pause();
        emit FactoryPaused(msg.sender);
    }

    /**
     * @notice Despausa a fábrica (Apenas Owner)
     */
    function unpause() external onlyOwner {
        _unpause();
        emit FactoryUnpaused(msg.sender);
    }

    /**
     * @notice Atualiza o Guardian
     */
    function setGuardian(address _newGuardian) external onlyOwner {
        require(_newGuardian != address(0), "Invalid guardian");
        guardian = _newGuardian;
        emit GuardianUpdated(_newGuardian);
    }

    /**
     * @notice Retira fundos acumulados (apenas owner)
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
