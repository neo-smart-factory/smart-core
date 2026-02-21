<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->

```text
========================================
   NΞØ SMART FACTORY · SETUP GUIDE
========================================
```

Technical setup instructions for
local development, compilation, testing
and deployment.

────────────────────────────────────────

## Prerequisites

```text
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ REQUIREMENT         VERSION
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ Node.js             ≥22.0.0
┃ npm                 ≥11.0.0
┃ Git                 latest
┃ macOS / Linux       recommended
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Optional (for TON development):**
- Tact compiler (installed via npm)
- TON wallet with testnet funds

────────────────────────────────────────

## Installation

**1. Clone the repository:**

```bash
git clone https://github.com/neo-smart-token-factory/smart-core.git
cd smart-core
```

**2. Configure GitHub Packages:**

This repository uses GitHub Packages for
`@neo-smart-token-factory` scope.

```bash
# Set your GitHub token
export GITHUB_TOKEN=your_token_here
```

The `.npmrc` file is pre-configured for
authentication using `${GITHUB_TOKEN}`.

**3. Install dependencies:**

```bash
npm install
```

> **Note:** If you encounter permission
> errors on `.npm-cache`, run:
> `sudo chown -R $(whoami) .npm-cache`

────────────────────────────────────────

## Environment Variables

**4. Configure `.env`:**

```bash
cp .env.example .env
```

```text
▓▓▓ REQUIRED VARIABLES
────────────────────────────────────────
PRIVATE_KEY=        # EVM deployer key
BASESCAN_API_KEY=   # Base verification
POLYGONSCAN_KEY=    # Polygon verification

▓▓▓ TON VARIABLES
────────────────────────────────────────
TON_MNEMONIC=       # TON wallet mnemonic
TON_RPC_URL=        # TonCenter API URL
TON_API_KEY=        # TonCenter API key

▓▓▓ NEXUS INTEGRATION
────────────────────────────────────────
NEXUS_WEBHOOK_URL=  # Nexus endpoint
NEXUS_SECRET=       # HMAC-SHA256 secret
```

────────────────────────────────────────

## Compilation

**EVM Contracts (Solidity):**

```bash
# Pre-compilation analysis (recommended)
make analyze

# Compile all 72 contracts
npx hardhat compile
# or
make compile-evm
```

**TON Contracts (Tact):**

```bash
# Compile Tact contracts
npm run compile:ton
# or
make compile-ton
```

────────────────────────────────────────

## Testing

```text
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ COMMAND               TARGET
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ npx hardhat test      EVM contracts
┃ npm run test:ton      TON contracts
┃ make test             Both
┃ make test-evm         EVM only
┃ make test-ton         TON only
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

────────────────────────────────────────

## Deployment

### EVM (Base / Polygon)

```bash
# Deploy to Base Mainnet
npm run deploy:base
# or
make deploy-evm-base

# Deploy to Polygon
npm run deploy:polygon
# or
make deploy-evm-polygon

# Verify on Basescan
npx hardhat verify --network base CONTRACT_ADDRESS
# or
make verify-base
```

### TON Network

```bash
# Deploy Jetton Factory
make deploy-ton-factory

# Deploy NEOFLW token via Factory
make deploy-ton-neoflw
```

> See [docs/TON_ECOSYSTEM_REFERENCE.md](./docs/TON_ECOSYSTEM_REFERENCE.md)
> for TON-specific configuration.

────────────────────────────────────────

## Linting & Analysis

```bash
# Run all linters
make lint

# Solidity only (solhint)
make lint-sol

# JavaScript only (eslint)
make lint-js

# Pre-compilation code analysis
make analyze
# or
npm run analyze
```

**Configuration files:**
- `.solhint.json` — Solidity linter config
- `.solhintignore` — Solhint exclusions
- `eslint.config.mjs` — ESLint v9 flat config

────────────────────────────────────────

## Security

```bash
# Validate MIO Logic Vault
npm run security:check

# Generate token manifesto
npm run security:manifesto

# Run npm audit
npm audit
```

> See [SECURITY.md](./SECURITY.md) for
> vulnerability reporting policy.

────────────────────────────────────────

## Nexus Integration

The Smart Core connects to **Nexus**
(orchestrator) via HMAC-SHA256 webhook.

```bash
# Start Nexus ingress listener
npm run nexus:start

# Test Nexus connection
node scripts/test-nexus-ingress.js
```

> See [docs/NEXUS_INTEGRATION_GUIDE.md](./docs/NEXUS_INTEGRATION_GUIDE.md)
> for the full integration protocol.

────────────────────────────────────────

## TON Utilities

```text
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ COMMAND               ACTION
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ make ton-balance      Check balance
┃ make ton-wallet       Show wallet info
┃ make ton-jetton-addr  Calc Jetton addr
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

────────────────────────────────────────

## Troubleshooting

**`npm install` fails with EPERM:**
```bash
sudo chown -R $(whoami) .npm-cache
sudo chown -R $(whoami) node_modules
```

**`npx hardhat compile` downloads new version:**
Hardhat is a devDependency. If npx tries
to install a new version, it means
`node_modules` is out of date:
```bash
npm install
npx hardhat compile
```

**TON compilation fails:**
Ensure Tact compiler is installed:
```bash
npm ls @tact-lang/compiler
```

**`.DS_Store` / `.tmp` errors:**
These are in `.gitignore`. To clean:
```bash
sudo rm -rf .tmp
find . -name '.DS_Store' -delete
```

────────────────────────────────────────

▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Setup once. Deploy sovereign."
────────────────────────────────────────
