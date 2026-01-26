// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./tokens/NeoERC20.sol";
import "./tokens/NeoERC721.sol";
import "./vesting/NeoVesting.sol";
import "./rewards/NeoRewards.sol";

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
    
    // Contadores e Taxas
    uint256 public protocolCounter;
    uint256 public creationFee;
    
    // Security & Governance
    address public guardian;
    
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
        TokenConfig memory tokenConfig,
        VestingConfig[] memory vestingConfigs,
        bool rewardsEnabled
    ) external payable whenNotPaused nonReentrant returns (uint256 protocolId) {
        require(msg.value >= creationFee, "Insufficient fee");
        require(bytes(tokenConfig.name).length > 0, "Invalid token name");
        require(bytes(tokenConfig.symbol).length > 0, "Invalid token symbol");
        require(vestingConfigs.length <= MAX_VESTING_SCHEDULES, "Too many vesting schedules");

        protocolId = protocolCounter++;
        
        // Criar token ERC20 - Minta para o Factory primeiro para distribuir
        NeoERC20 token = new NeoERC20(
            tokenConfig.name,
            tokenConfig.symbol,
            tokenConfig.totalSupply,
            tokenConfig.decimals,
            tokenConfig.mintable,
            tokenConfig.burnable,
            tokenConfig.pausable,
            address(this) // Factory recebe o supply inicial
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
            uint256 totalVestingRequested = 0;
            for (uint256 i = 0; i < vestingConfigs.length; i++) {
                VestingConfig memory v = vestingConfigs[i];
                
                // Validações robustas
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

                emit VestingScheduleAdded(protocolId, vestingAddress, v.beneficiary, v.totalAmount);
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

        // Transferir tokens restantes para o criador
        uint256 remainingTokens = token.balanceOf(address(this));
        if (remainingTokens > 0) {
            token.transfer(msg.sender, remainingTokens);
        }

        // Transferir ownership do token para o criador (se o token for Ownable)
        token.transferOwnership(msg.sender);

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
    function createToken(TokenConfig memory tokenConfig)
        external
        payable
        whenNotPaused
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
    ) external payable whenNotPaused nonReentrant returns (address nftAddress) {
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
