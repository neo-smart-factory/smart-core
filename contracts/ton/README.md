# TON Contracts - NEØ Smart Factory

Implementation of TON (FunC) contracts for the NEØ Smart Factory.

## Available Contracts

### NeoJettonFactory.fc (V1)
Original factory for Jetton creation.

**Status:** ⚠️ Legacy version, use V2

### NeoJettonFactoryV2.fc (V2) 
Improved factory for Jetton creation.

**Status:** 🔍 In debug - Factory not creating Minter (active bug)

**Features:**
- Jetton Minter deployment
- Mint price configuration
- Max supply
- Owner management

**OP Codes:**
- `0x61caf729` - deploy_jetton
- `0x1` - transfer
- Others (see code)

### NeoJettonMinter.fc
Jetton Minter contract (ERC20 Minter equivalent).

**Status:** ✅ Tested and functional

**Standards:**
- TEP-74 (Jetton Standard)
- TEP-64 (Token Metadata)
- TEP-89 (Discoverable Jettons)

**Functionalities:**
- Token minting
- Token burning
- On-chain metadata
- Automatic discovery

### NeoJettonWallet.fc
User wallet for Jettons.

**Status:** ✅ Tested and functional

**Features:**
- Token transfer
- Balance tracking
- Notifications
- Compatible with TON wallets

## Compilation

### Prerequisites
```bash
npm install @ton-community/func-js
npm install @ton/ton @ton/core @ton/crypto
```

### Compile V1
```bash
node scripts/compile-ton.js
```

### Compile V2
```bash
node scripts/compile-ton-v2.js
```

## Deployment

### Factory V1
```bash
export TON_NETWORK=testnet
node scripts/deploy-ton-factory.js
```

### Factory V2
```bash
export TON_NETWORK=testnet
node scripts/deploy-ton-factory-v2.js
```

### Jetton Deployment (NSF Token)
```bash
node scripts/deploy-nsf-token.js
```

## Debug

Debug scripts available in `scripts/debug/`:

```bash
# View status of all factories
node scripts/debug/debug-all-factories.js

# Address calculation debug
node scripts/debug/debug-jetton-address.js

# Dry-run (without spending TON)
node scripts/debug/dry-run-ton.js
```

## Architecture

```
User
  ↓
Factory (NeoJettonFactoryV2.fc)
  ↓ (deploy_jetton)
Minter (NeoJettonMinter.fc)
  ↓ (mint)
Wallet (NeoJettonWallet.fc)
```

## EVM ↔ TON Parity

| EVM | TON | Status |
|-----|-----|--------|
| NeoTokenV2.sol | NeoJettonMinter.fc | ✅ |
| ERC20 transfer | Jetton transfer | ✅ |
| mint() | mint() | ✅ |
| burn() | burn() | ✅ |
| Metadata | TEP-64 | ✅ |

See: `docs/audit/EVM_TON_MAPPING.md` for full details.

## Known Bug (2026-01-25)

⚠️ **Factory V2 does not create Jetton Minter**

**Symptoms:**
- Confirmed transaction
- Excess returned (~0.498 TON)
- StateInit is not sent
- Minter does not appear on the blockchain

**Investigation:**
See full documentation in `neo-smart-token-factory/docs`:
- `CHECKPOINT_TON_FACTORY_2026-01-25.md` - Technical checkpoint
- `TON_FACTORY_LEARNING_SESSION.md` - Deep analysis
- `REORGANIZATION_PLAN.md` - Next steps

**Solutions under Testing:**
- Option A: Use official TON Minter as base
- Option B: Minimalist Factory to isolate bug
- Option C: Deep debug with get methods

## TON Standards

### TEP-74: Jetton Standard
- ✅ Message structure
- ✅ OP codes
- ✅ Notifications

### TEP-64: Token Metadata
- ✅ On-chain metadata
- ✅ Off-chain metadata URI
- ✅ JSON format

### TEP-89: Discoverable Jettons
- ✅ Get methods
- ✅ Metadata discovery
- ✅ Wallet discovery

## Security

### Audits
- [ ] Formal audit pending
- [x] Internal code review
- [x] Testnet testing

### Best Practices
- ✅ Use of standardized imports
- ✅ Input validation
- ✅ Bounds checking
- ✅ Integer overflow protection

## Tests

```bash
# Test compilation
node scripts/compile-ton-v2.js

# Testnet deployment test
export TON_NETWORK=testnet
node scripts/deploy-ton-factory-v2.js

# Verify factory
node scripts/debug/debug-all-factories.js
```

## Resources

### Official Documentation
- **TON Docs:** https://docs.ton.org
- **TEP-74:** https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md
- **TON Minter:** https://github.com/ton-blockchain/minter-contract

### Tools
- **TonScan:** https://testnet.tonscan.org
- **TON Center:** https://testnet.toncenter.com
- **TON Minter App:** https://minter.ton.org

### NEØ Repositories
- **docs:** https://github.com/neo-smart-token-factory/docs
- **smart-core:** https://github.com/neo-smart-token-factory/smart-core

## License

See `LICENSE` in the root repository.

---

**General Status:** 🟡 Active development  
**Last Updated:** 2026-01-25  
**Contact:** GitHub Issues
