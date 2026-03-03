<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->

```text
========================================
   NΞØ SMART FACTORY · SMART CORE
========================================
```

Multichain engine for tokenized asset
creation, deployment and governance.

> **Version:** v0.5.3-neural-core  
> **License:** MIT  
> **Node:** ≥22.0.0

────────────────────────────────────────

## 🎯 What is Smart Core?

The foundational contract layer of the
**NΞØ SMART FACTORY** ecosystem.

```text
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ SMART CORE CAPABILITIES
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃
┃ 🏭 Token Factory
┃    └─ ERC20, ERC721, Jettons
┃       via unified factory interface
┃
┃ �️ Enterprise Security
┃    └─ Circuit breaker, guardian roles,
┃       4-of-7 multisig emergency pause
┃
┃ 🌐 Multichain
┃    └─ Base + Polygon (Solidity/OZ)
┃       TON (Tact v0.5.3)
┃
┃ ⚡ Protocol Governance
┃    └─ NSF coordination token,
┃       node admission, reputation
┃
┃ � Nexus Integration
┃    └─ HMAC-SHA256 ingress adapter
┃       for autonomous mint/deploy
┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

────────────────────────────────────────

## � Live Deployments

```text
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ ASSET             NETWORK     DATE
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ NEOFLW Token      Base        20/01/26
┃ NEOFLW Token      TON         31/01/26
┃ Jetton Factory    TON         31/01/26
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Base:  0xF4Fbd30e3Ea69457adD30F7C3D6fde25f7D8Db26
TON:   EQAPngkZmIa1jbtQZJ9NSPZ-3sh3PnD8bp5cvxNeAEeEBTfl
```

────────────────────────────────────────

## 🛠 Quick Start

```bash
# Install
npm install

# Compile EVM contracts (72 contracts)
npx hardhat compile

# Run pre-compilation analysis
make analyze

# Run tests
npx hardhat test        # EVM
npm run test:ton        # TON

# Deploy
npm run deploy:base     # Base Mainnet
npm run deploy:polygon  # Polygon Mainnet
```

> Full setup instructions → **[SETUP.md](./SETUP.md)**

────────────────────────────────────────

## 📂 Repository Structure

```text
smart-core/
├── contracts/
│   ├── tokens/         ERC20, ERC721
│   ├── nsf/            NSF Token + Factory
│   ├── bridge/         Cross-chain bridge
│   ├── protocol/       Governance layer
│   ├── vesting/        Token vesting
│   ├── rewards/        Rewards system
│   └── ton/            Tact contracts
├── scripts/
│   ├── deploy/         Deploy scripts
│   ├── ton/            TON utilities
│   ├── bridge/         Bridge relay
│   ├── security/       Vault & manifesto
│   ├── debug/          Diagnostics
│   └── _legacy/        Deprecated
├── test/               Test suites
├── docs/               Documentation
├── deployments/        Deploy records
└── mcp/                MCP schemas
```

────────────────────────────────────────

## 📚 Documentation

```text
▓▓▓ CORE DOCS
────────────────────────────────────────
└─ SETUP.md                   Setup guide
└─ DEPLOY_V2.md               Deploy instructions
└─ SECURITY.md                Security policy
└─ CONTRIBUTING.md            Contributor guide
└─ scripts/README.md          Scripts map
└─ docs/README.md             Docs index

▓▓▓ PROTOCOL DOCS (docs/)
────────────────────────────────────────
└─ NEXT_STEPS_2026_Q1.md      Roadmap
└─ DIRECTIVE_SMART_CORE.md    Core directive
└─ architecture/              Architecture (7 docs)
└─ nexus/                     Nexus integration (3)
└─ nsf/                       NSF Token (6 docs)
└─ ton/                       TON blockchain (9)
```

────────────────────────────────────────

## 🔧 Make Commands

```text
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ COMMAND               ACTION
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ make compile          Compile all
┃ make test             Run all tests
┃ make lint             Solhint + ESLint
┃ make analyze          Pre-compile check
┃ make deploy-evm-base  Deploy to Base
┃ make deploy-ton-factory Deploy TON
┃ make ton-balance      Check TON balance
┃ make clean            Clear cache
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

────────────────────────────────────────

## ⚖️ Authorship & Legal

- **Architecture & Lead:**
  NΞØ MELLØ
- **Proof of Authorship:**
  Formally sealed via ICP-Brasil
  and Blockchain (2026-01-22)
- **IP Protection:**
  All original architecture and code
  are protected IP of NΞØ MELLØ

────────────────────────────────────────

## 📜 Licensing

- **Smart Contracts:** [MIT License](./LICENSE)
- **Documentation:** [CC BY 4.0](./docs/LEGAL_STATUS.md)

────────────────────────────────────────

▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Code is law. Expand until
silence becomes structure."
────────────────────────────────────────
```
 █████ █         
██╔═══██╗       
██║ █ ██║  
██ █  ██║      
╚██████╔╝   
█ ╚═══╝     

```
