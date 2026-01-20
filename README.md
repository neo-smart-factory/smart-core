# 🔥 NΞØ SMART FACTORY — Core V2

> **Foundation for Multichain Asset Generation**  
> Version: v0.5.3 (Multichain Foundation)

## 🎯 Overview
This is the core engine of the NΞØ SMART FACTORY. It contains the smart contracts, deploy scripts, and security logic required to forge next-generation assets across Base, Polygon, and Arbitrum.

## 🚀 Key Features
- **NeoTokenV2.sol**: A gasless (ERC20Permit), burnable, and bridgeable token implementation.
- **Multichain Ready**: Built-in support for secure minting through authorized bridges.
- **Ownable2Step**: Enhanced security for contract ownership transfers.
- **Account Abstraction Ready**: Optimized for modern smart wallets and paymasters.

## 🛠 Usage

### Prerequisites
- Node.js & NPM
- Hardhat

### Installation
```bash
npm install @neo-smart/core
```

### Compile
```bash
npx hardhat compile
```

### Deploy (Base Example)
```bash
npm run deploy:base
```

## 🤝 Community & Support
- **Docs**: [docs.neosmart.factory](https://github.com/neo-smart-token-factory/docs)
- **Twitter**: [@neosmart_factory](https://twitter.com/neosmart_factory)
- **Email**: team@neosmart.factory

## 📜 Attribution & Licensing
This project is licensed under the **MIT License**.

While you are free to fork and use this code, we require **Attribution** to NΞØ Protocol for all derivative works.

**Derived projects must:**
1. Keep the original header in the smart contracts.
2. Reference "Powered by NΞØ SMART FACTORY" in the project description or documentation.

---
*Developed with ❤️ by NΞØ Protocol for the future of decentralized economies.*
