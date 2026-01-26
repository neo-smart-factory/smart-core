# 🔥 NΞØ SMART FACTORY — Neural Core V2

> **Unified Foundation for Multichain Asset Generation & Protocol Security**  
> Version: v0.5.3-neural-core (Phase Transition)

## 🎯 Overview

This is the core engine of the NΞØ SMART FACTORY. It contains the smart contracts, deploy scripts, and security logic required to tokenize next-generation assets across **Base, Polygon, and TON**.

## 🚀 Key Features

### 🛡️ Unified Security (Circuit Breaker)

- **Unified Pausable Logic**: Standardized emergency pause (Circuit Breaker) across EVM (Solidity) and TON (Tact).
- **Guardian Role**: Dedicated security role to pause/unpause contracts without full ownership transfer.
- **Dynamic Governance**: Configuration for protocol fees and treasury addresses without redeployment.

### 💎 TON Architecture (Tact)

- **Tact Migration**: Full migration from FunC to Tact for improved safety, readability, and performance.
- **TEP-74 Compliant**: Complete Jetton implementation with enhanced error handling (`bounced` messages).
- **Modular Design**: Separated constants, messages, and contract logic for professional auditability.

### 🌐 EVM Core (Solidity)

- **NeoTokenV2.sol**: Gasless (ERC20Permit), burnable, and bridgeable token implementation.
- **NeoSmartFactory**: Multi-protocol factory for ERC20, ERC721, Vesting, and Rewards.

## 🛠 Usage & Package Management

This repository uses a private scope for internal components via GitHub Packages.

### Prerequisites

- Node.js & NPM
- GITHUB_TOKEN configured in your environment for `@neo-smart-token-factory` scope.

### Installation & Auth

The project includes an `.npmrc` configured for our GitHub Registry.
```bash
# Export your token (if installing from registry)
export GITHUB_TOKEN=your_token_here
npm install
```

### EVM Commands (Hardhat)

```bash
npx hardhat compile
npx hardhat test
npm run deploy:base
```

### TON Commands (Tact)

```bash
# Compile Tact contracts
npm run compile:ton

# Run TON Sandbox tests
npm run test:ton
```

## ⚖️ Authorship & Legal Status

- **Architecture & Lead**: Eurycles Ramos Neto / NODE NEØ
- **Proof of Authorship**: Technical concepts formally sealed and timestamped via ICP-Brasil and Blockchain (2026-01-22).
- **IP Protection**: All original architecture and code are protected IP of Eurycles Ramos Neto.

## 📜 Licensing

- **Smart Contracts**: [MIT License](./LICENSE)
- **Documentation**: [CC BY 4.0 (Creative Commons)](./docs/LEGAL_STATUS.md)

---
**v0.5.3-neural-core — NEØ PROTOCOL**  
*Expand until silence becomes structure.*
