# 🔥 NΞØ SMART FACTORY — Smart Core V2

> **Unified Foundation for Multichain Asset Generation & Protocol Security**  
> Version: v0.5.3-neural-core (Phase Transition)

## 🎯 What is Smart Core?

**Smart Core** is the foundational engine of the NΞØ SMART FACTORY ecosystem—a comprehensive multichain protocol for creating, deploying, and managing tokenized assets with enterprise-grade security.

### Core Purpose

Smart Core provides:
- **🏭 Token Factory System**: Automated creation and deployment of tokens (ERC20, ERC721, Jettons) across multiple blockchains
- **🔒 Unified Security Architecture**: Circuit breaker pattern, guardian roles, and emergency controls standardized across all chains
- **🌐 Multichain Support**: Native deployment to Base, Polygon (EVM), and TON networks with a single codebase
- **⚙️ Smart Contract Templates**: Production-ready, auditable contract templates with built-in security features
- **🛡️ Protocol Governance**: Dynamic configuration management for fees, treasuries, and protocol parameters

Smart Core is designed for developers and organizations who need reliable, secure infrastructure to launch blockchain-based assets without building from scratch.

## 🚀 Core Capabilities

### 🏭 Token Factory System

- **Multi-Protocol Support**: Create ERC20, ERC721, Jettons, Vesting, and Rewards contracts through a unified factory interface
- **Automated Deployment**: Scripts and tooling for deploying across Base, Polygon, and TON networks
- **Template Library**: Pre-audited contract templates with security best practices built-in
- **Configuration Management**: Flexible parameter configuration without requiring custom smart contract development

### 🛡️ Enterprise Security Architecture

- **Circuit Breaker Pattern**: Unified emergency pause system standardized across all chains (EVM and TON)
- **Guardian Role Model**: Dedicated security role to pause/unpause contracts without full ownership transfer
- **Dynamic Governance**: Modify protocol fees, treasury addresses, and parameters without redeployment
- **Access Control**: Role-based permissions for different operational functions

### 🌐 Multichain Implementation

**EVM Networks (Base, Polygon)**:
- Solidity-based contracts built on OpenZeppelin standards
- ERC20Permit for gasless transactions
- Burnable and bridgeable token features
- Factory pattern for streamlined deployments

**TON Network**:
- Tact language implementation for safety and performance
- TEP-74 compliant Jetton standard with enhanced error handling
- Modular architecture for professional auditability
- Optimized for TON's unique actor model

## 🛠 Getting Started

### Prerequisites

- Node.js & NPM
- GITHUB_TOKEN configured for `@neo-smart-token-factory` scope (for private packages)

### Installation

This repository uses GitHub Packages for internal components. An `.npmrc` file is configured for authentication.

```bash
# Set your GitHub token
export GITHUB_TOKEN=your_token_here

# Install dependencies
npm install
```

### Quick Start

**EVM Deployment (Base/Polygon)**:
```bash
# Compile Solidity contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Base
npm run deploy:base

# Deploy to Polygon
npm run deploy:polygon
```

**TON Deployment**:
```bash
# Compile Tact contracts
npm run compile:ton

# Run TON tests
npm run test:ton

# Deploy to TON (see docs/TON_ECOSYSTEM_REFERENCE.md)
```

### Repository Structure

```
smart-core/
├── contracts/          # Smart contracts (Solidity & Tact)
│   ├── ton/           # TON/Tact implementations
│   ├── tokens/        # ERC20, ERC721 templates
│   ├── vesting/       # Vesting contracts
│   └── bridge/        # Cross-chain bridge logic
├── scripts/           # Deployment and utility scripts
├── test/             # Test suites
├── docs/             # Documentation
└── templates/        # Contract templates
```

## 📚 Documentation

- **[Deployment Guide (V2)](./DEPLOY_V2.md)**: Step-by-step deployment instructions
- **[TON Ecosystem Reference](./docs/TON_ECOSYSTEM_REFERENCE.md)**: TON-specific implementation details
- **[NSF Deployment Guide](./docs/NSF_DEPLOYMENT_GUIDE.md)**: NEØ Smart Factory deployment
- **[Security Policy](./SECURITY.md)**: Security practices and vulnerability reporting
- **[Contributing](./CONTRIBUTING.md)**: Guidelines for contributors

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
