// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 *  █▄░█ █▀▀ █▀█   █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀
 *  █░▀█ ██▄ █▄█   ▄█ █░▀░█ █▀█ █▀▄ ░█░
 *
 *  TOKENIZE | NEO SMART FACTORY v0.5.3
 */
'
contract NeoTokenBase is ERC20, Ownable, Pausable {
    uint256 public immutable PRICE;
    uint256 public immutable INITIAL_SUPPLY;
    mapping(address => bool) public hasMinted;
    bool public mintEnabled = true;
    
    address public guardian;

    event Minted(address indexed to, uint256 amount);
    event GuardianUpdated(address indexed newGuardian);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 price_,
        uint256 initialSupply_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        PRICE = price_;
        INITIAL_SUPPLY = initialSupply_;
        guardian = msg.sender;
    }

    /**
     * @notice Mint único por wallet com preço fixo
     */
    function mint() external payable whenNotPaused {
        require(mintEnabled, "Mint disabled");
        require(msg.value == PRICE, "Incorrect price");
        require(!hasMinted[msg.sender], "Already minted");

        hasMinted[msg.sender] = true;
        _mint(msg.sender, INITIAL_SUPPLY);
        
        emit Minted(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @notice Desabilita mint (apenas owner)
     */
    function disableMint() external onlyOwner {
        mintEnabled = false;
    }

    /**
     * @notice Habilita mint (apenas owner)
     */
    function enableMint() external onlyOwner {
        mintEnabled = true;
    }

    // --- Security & Governance ---

    /**
     * @notice Pausa o contrato (Owner ou Guardian)
     */
    function pause() external {
        require(msg.sender == owner() || msg.sender == guardian, "Not authorized");
        _pause();
    }

    /**
     * @notice Despausa o contrato (Apenas Owner)
     */
    function unpause() external onlyOwner {
        _unpause();
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

    // Overrides necessários
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20)
    {
        if (paused()) {
            require(from == address(0) || to == address(0), "Pausable: token transfer while paused");
        }
        super._update(from, to, value);
    }
}
