# 📂 Scripts — NΞØ Smart Factory

## Estrutura

```
scripts/
├── deploy/          # Deploy scripts (EVM + TON)
│   ├── deploy-v1.js            # Deploy NeoTokenV1 (Hardhat)
│   ├── deploy-v2.js            # Deploy NeoTokenV2 (Hardhat) ← PRINCIPAL
│   ├── deploy-bridge.js        # Deploy ManualBridge
│   ├── deploy-ton-factory-v2.js # Deploy Jetton Factory TON
│   ├── deploy-neoflw-ton.js    # Deploy NEOFLW via Factory TON
│   ├── deploy-nsf-token.js     # Deploy NSF Token via Factory TON
│   ├── deploy-ton-tact.ts      # Deploy TON (TypeScript)
│   ├── post-deploy.js          # Post-deploy checks
│   ├── verify.js               # Verify on Etherscan/Basescan
│   ├── verify-nsf-deployment.js # Verify NSF deployment
│   ├── disable-public-mint.js  # Disable public mint
│   └── wait-for-funds-and-deploy.js # Auto-deploy when funded
│
├── ton/             # TON blockchain utilities
│   ├── check-balance.js        # Check TON wallet balance
│   ├── check-testnet-balance.js # Check testnet balance
│   ├── check-factory-state.js  # Inspect Factory contract state
│   ├── show-wallet.js          # Display wallet info
│   ├── calculate-jetton-address.js # Calculate Jetton address
│   ├── analyze-cell-size.js    # Analyze TVM cell sizes
│   ├── compile.js              # Compile TON contracts
│   ├── smart-rpc-selector.js   # Auto-select best RPC
│   └── test-mint.js            # Test mint operations
│
├── bridge/          # Cross-chain bridge
│   ├── monitor.js              # Bridge transaction monitor
│   ├── relay.js                # Bridge relay service
│   ├── sign-proof.js           # Sign bridge proofs
│   └── README.md
│
├── security/        # Security & compliance
│   ├── validate-vault.js       # Validate MIO vault
│   ├── mio-vault.js            # MIO vault operations
│   └── generate-token-manifesto.js # Generate token manifesto
│
├── debug/           # Debug & diagnostics
│   ├── debug-all-factories.js
│   ├── debug-factory-detailed.js
│   ├── debug-jetton-address.js
│   ├── dry-run-ton.js
│   └── README.md
│
├── nsf/             # NSF Token specific
│   └── deploy_token.js
│
├── _legacy/         # ⚠️ Deprecated (kept for reference)
│   ├── compile-ton-legacy.js
│   ├── compile-ton-v2-legacy.js
│   ├── deploy-ton-factory-v1.js
│   ├── check-balance-v1.js
│   ├── simulate.js
│   ├── diagnostic-network.js
│   ├── test-all-rpc-providers.js
│   ├── test-both-providers.js
│   ├── test-chainstack-connection.js
│   └── test-dict-fix.js
│
├── code-analysis.js # Pre-compilation analysis (make analyze)
├── nexus-ingress.js # Nexus event listener (npm run nexus:start)
└── test-nexus-ingress.js # Test Nexus connection
```

## Comandos Rápidos

```bash
# Deploy
make deploy-evm-base        # Deploy NeoTokenV2 na Base
make deploy-evm-polygon     # Deploy na Polygon
make deploy-ton-factory     # Deploy Jetton Factory TON
make deploy-ton-neoflw      # Deploy NEOFLW via Factory

# Utilities
make ton-balance            # Checar saldo TON
make ton-wallet             # Ver wallet info
make ton-jetton-addr        # Calcular endereço Jetton

# Quality
make analyze                # Pre-compilation analysis
make lint                   # Solhint + ESLint
make compile                # Compile EVM + TON

# Security
npm run security:check      # Validate MIO vault
npm run security:manifesto  # Generate manifesto

# Nexus
npm run nexus:start         # Start Nexus ingress listener
```
