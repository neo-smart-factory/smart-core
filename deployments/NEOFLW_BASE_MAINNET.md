# 🚀 NEOFLW Token - Official Deployment

## Deployment Information

**Network:** Base Mainnet  
**Contract Address:** `0xF4Fbd30e3Ea69457adD30F7C3D6fde25f7D8Db26`  
**Deployed:** January 20, 2026  
**Version:** v0.5.3 — MULTICHAIN FOUNDATION

## Token Details

- **Name:** NEOFlowOFF
- **Symbol:** NEOFLW
- **Type:** ERC20 with ERC20Permit (Gasless transactions)
- **Max Supply:** 1,000,000,000 NEOFLW (1 billion)
- **Public Mint Price:** 0.003 ETH
- **Public Mint Amount:** 1,000 NEOFLW per mint
- **Owner:** 0x470a8c640fFC2C16aEB6bE803a948420e2aE8456

## Features

✅ **Account Abstraction Ready** - ERC20Permit for gasless transactions  
✅ **Multichain Ready** - Bridge minter role for cross-chain operations  
✅ **Anti-bot Protection** - One public mint per wallet  
✅ **Supply Cap** - Immutable 1 billion token maximum  
✅ **Ownable2Step** - Secure ownership transfer mechanism  
✅ **Burnable** - Token holders can burn their tokens

## Links

- **Basescan (Verified):** https://basescan.org/address/0xF4Fbd30e3Ea69457adD30F7C3D6fde25f7D8Db26#code
- **Contract Source:** [NeoTokenV2.sol](../contracts/NeoTokenV2.sol)
- **Deploy Script:** [deployV2.js](../scripts/deployV2.js)

## Next Steps

### 1. Test Public Mint
```javascript
// Connect to contract
const token = await ethers.getContractAt("NeoTokenV2", "0xF4Fbd30e3Ea69457adD30F7C3D6fde25f7D8Db26");

// Mint tokens (requires 0.003 ETH)
await token.publicMint({ value: ethers.parseEther("0.003") });
```

### 2. Configure Bridge (When Ready)
```javascript
// Set bridge minter address
await token.setBridgeMinter("0xYourBridgeAddress");
```

### 3. Manage Public Mint
```javascript
// Disable public mint
await token.setPublicMintStatus(false);

// Re-enable public mint
await token.setPublicMintStatus(true);
```

### 4. Withdraw Accumulated Fees
```javascript
// Withdraw ETH from public mints
await token.withdraw();
```

## Integration Examples

### Frontend Integration
```javascript
import { ethers } from 'ethers';

const NEOFLW_ADDRESS = '0xF4Fbd30e3Ea69457adD30F7C3D6fde25f7D8Db26';
const NEOFLW_ABI = [...]; // Import from artifacts

// Connect to contract
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const token = new ethers.Contract(NEOFLW_ADDRESS, NEOFLW_ABI, signer);

// Get contract info
const info = await token.getContractInfo();
console.log('Current Supply:', ethers.formatEther(info.currentSupply));
console.log('Max Supply:', ethers.formatEther(info.maxSupply));
console.log('Mint Enabled:', info.mintEnabled);

// Mint tokens
const tx = await token.publicMint({ value: info.mintPrice });
await tx.wait();
```

### Telegram Mini-App Integration
```javascript
// Use ERC20Permit for gasless transactions
const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
const signature = await signer.signTypedData(domain, types, value);

// User signs, relayer pays gas
await relayer.permitAndTransfer(signature, deadline);
```

## Security Considerations

- ✅ Contract verified on Basescan
- ✅ OpenZeppelin v5.0 audited contracts
- ✅ Immutable supply cap
- ✅ Anti-bot protection
- ✅ Secure withdraw pattern (using .call)
- ⚠️ Owner has significant control (consider multi-sig or timelock for production)

## Project Information

**Project Lead:** NODE NEØ  
**Email:** neo@neoprotocol.space  
**Web3 Identity:** neoprotocol.eth  
**Website:** https://neoprotocol.space

---

*Expand until silence becomes structure.*
