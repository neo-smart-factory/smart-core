// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * 
 *  ███╗   ██╗     ███████╗    ███████╗ █████╗  ██████╗████████╗ ██████╗ ██████╗ ██╗   ██╗
 *  ████╗  ██║     ██╔════╝    ██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝
 *  ██╔██╗ ██║     ███████╗    █████╗  ███████║██║        ██║   ██║   ██║██████╔╝ ╚████╔╝ 
 *  ██║╚██╗██║     ╚════██║    ██╔══╝  ██╔══██║██║        ██║   ██║   ██║██╔══██╗  ╚██╔╝  
 *  ██║ ╚████║     ███████║    ██║     ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║   ██║   
 *  ╚═╝  ╚═══╝     ╚══════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   
 *
 *  NΞØ SMART FACTORY v0.5.3 — FOUNDATION
 *  Multichain & AA-Ready Architecture
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title NeoTokenV2
 * @notice Arquitetura Multichain & AA-Ready
 * @dev Incorpora ERC20Permit para transações gasless e estrutura para pontes multichain.
 */
contract NeoTokenV2 is ERC20, ERC20Burnable, ERC20Permit, Ownable2Step {
    
    // Supply Management
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 bilhão de tokens
    
    // Bridge Role (Multichain-Ready)
    address public bridgeMinter;
    
    // Public Mint Configuration
    uint256 public immutable MINT_PRICE;
    uint256 public immutable MINT_AMOUNT;
    bool public publicMintEnabled;
    
    // Anti-bot: apenas 1 mint público por endereço
    mapping(address => bool) public hasPublicMinted;

    // Events
    event BridgeMinterUpdated(address indexed newMinter);
    event PublicMintStatusChanged(bool enabled);
    event PublicMinted(address indexed minter, uint256 amount, uint256 pricePaid);
    event BridgeMinted(address indexed to, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        uint256 mintPrice,
        uint256 mintAmount,
        address initialOwner
    ) 
        ERC20(name, symbol) 
        ERC20Permit(name)
        Ownable(initialOwner)
    {
        MINT_PRICE = mintPrice;
        MINT_AMOUNT = mintAmount;
        publicMintEnabled = true;
    }

    /**
     * @notice Mint público (1 por wallet)
     * @dev Útil para distribuição inicial orgânica ou rituais
     * @dev Preparado para Account Abstraction via Permit
     */
    function publicMint() external payable {
        require(publicMintEnabled, "Public mint disabled");
        require(msg.value == MINT_PRICE, "Incorrect ETH/POL value");
        require(!hasPublicMinted[msg.sender], "Already minted");
        require(totalSupply() + MINT_AMOUNT <= MAX_SUPPLY, "Max supply reached");
        
        hasPublicMinted[msg.sender] = true;
        _mint(msg.sender, MINT_AMOUNT);
        
        emit PublicMinted(msg.sender, MINT_AMOUNT, msg.value);
    }

    /**
     * @notice Mint via Bridge (Multichain-Ready)
     * @param _to Endereço de destino
     * @param _amount Quantidade a ser mintada
     * @dev Apenas o endereço da ponte autorizada pode chamar
     */
    function bridgeMint(address _to, uint256 _amount) external {
        require(msg.sender == bridgeMinter, "Caller is not the bridge minter");
        require(_to != address(0), "Cannot mint to zero address");
        require(totalSupply() + _amount <= MAX_SUPPLY, "Max supply reached");
        
        _mint(_to, _amount);
        emit BridgeMinted(_to, _amount);
    }

    /**
     * @notice Configura o endereço da ponte (Apenas Owner)
     * @param _newMinter Novo endereço autorizado para bridge mint
     */
    function setBridgeMinter(address _newMinter) external onlyOwner {
        require(_newMinter != address(0), "Invalid bridge minter");
        bridgeMinter = _newMinter;
        emit BridgeMinterUpdated(_newMinter);
    }

    /**
     * @notice Alterna status do mint público
     * @param _enabled true = habilita, false = desabilita
     */
    function setPublicMintStatus(bool _enabled) external onlyOwner {
        publicMintEnabled = _enabled;
        emit PublicMintStatusChanged(_enabled);
    }

    /**
     * @notice Reset do mint público para um endereço (emergência)
     * @param _user Endereço a ser resetado
     * @dev Útil para casos de teste ou edge cases identificados
     */
    function resetPublicMint(address _user) external onlyOwner {
        hasPublicMinted[_user] = false;
    }

    /**
     * @notice Função de utilitário para compatibilidade total com exploradores (PolygonScan/Basescan)
     */
    function getOwner() public view returns (address) {
        return owner();
    }

    /**
     * @notice Retira fundos acumulados do mint público
     * @dev Usa call{} em vez de transfer para segurança
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @notice Retorna informações resumidas do contrato
     */
    function getContractInfo() external view returns (
        uint256 currentSupply,
        uint256 maxSupply,
        uint256 mintPrice,
        uint256 mintAmount,
        bool mintEnabled,
        address bridge
    ) {
        return (
            totalSupply(),
            MAX_SUPPLY,
            MINT_PRICE,
            MINT_AMOUNT,
            publicMintEnabled,
            bridgeMinter
        );
    }

    // Overrides necessários para ERC20Permit e heranças
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20)
    {
        super._update(from, to, value);
    }
}