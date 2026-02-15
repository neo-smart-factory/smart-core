// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract USDGO is ERC20, Ownable {
    using ECDSA for bytes32;

    mapping(address => bool) private _isFeeExempt;
    mapping(address => uint256) private _customTaxRate;
    mapping(bytes32 => bool) private _usedHashes;

    uint256 public constant MAX_TAX_RATE = 1000;
    uint256 private constant TAX_DENOMINATOR = 10000;

    address public taxRecipient;
    address public signer;

    event FeeExemptionSet(address indexed account, bool isExempt);
    event TaxRateUpdated(address indexed account, uint256 newRate);
    event TaxRecipientUpdated(address newRecipient);
    event SignerUpdated(address newSigner);
    event MintWithSignature(address indexed to, uint256 amount, bytes32 nonce);

    constructor(address _signer) ERC20("USD GO", "USD") Ownable(msg.sender) {
        _isFeeExempt[msg.sender] = true;
        _isFeeExempt[address(this)] = true;
        taxRecipient = msg.sender;
        signer = _signer;

        emit FeeExemptionSet(msg.sender, true);
        emit FeeExemptionSet(address(this), true);
        emit SignerUpdated(_signer);
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        address from = _msgSender();

        if (_isFeeExempt[from] || _isFeeExempt[to]) {
            _transfer(from, to, amount);
        } else {
            uint256 taxRate = _customTaxRate[from] > 0 ? _customTaxRate[from] : 500;
            uint256 taxAmount = (amount * taxRate) / TAX_DENOMINATOR;
            uint256 transferAmount = amount - taxAmount;

            _transfer(from, to, transferAmount);
            if (taxAmount > 0) {
                _transfer(from, taxRecipient, taxAmount);
            }
        }

        return true;
    }

    function mintWithSignature(address to, uint256 amount, bytes32 nonce, bytes memory signature) public {
        require(!_usedHashes[nonce], "Nonce already used");

        bytes32 rawMessage = keccak256(abi.encodePacked(to, amount, nonce));
        bytes32 message = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", rawMessage));
        address recovered = ECDSA.recover(message, signature);
        require(recovered == signer, "Invalid signature");

        _usedHashes[nonce] = true;
        _mint(to, amount);

        emit MintWithSignature(to, amount, nonce);
    }

    function setFeeExempt(address account, bool isExempt) public onlyOwner {
        require(account != address(0), "Address cannot be zero");
        _isFeeExempt[account] = isExempt;
        emit FeeExemptionSet(account, isExempt);
    }

    function setTaxRate(address account, uint256 rate) public onlyOwner {
        require(rate <= MAX_TAX_RATE, "Tax rate exceeds maximum");
        _customTaxRate[account] = rate;
        emit TaxRateUpdated(account, rate);
    }

    function setTaxRecipient(address newRecipient) public onlyOwner {
        require(newRecipient != address(0), "Recipient cannot be zero");
        taxRecipient = newRecipient;
        emit TaxRecipientUpdated(newRecipient);
    }

    function setSigner(address newSigner) public onlyOwner {
        require(newSigner != address(0), "Signer cannot be zero");
        signer = newSigner;
        emit SignerUpdated(newSigner);
    }

    function isFeeExempt(address account) public view returns (bool) {
        return _isFeeExempt[account];
    }
}
