# NeoTokenV2 — Deploy Guide

> **Quick guide para deploy do NeoTokenV2**

---

## 🚀 Deploy Rápido

### 1. Configurar .env

```bash
# forge-core/.env
PRIVATE_KEY=sua_chave_privada_aqui

# Polygon Mainnet
POLYGON_RPC=https://polygon-rpc.com
POLYGONSCAN_KEY=sua_chave_polygonscan

# Base Mainnet
BASE_RPC=https://mainnet.base.org
BASESCAN_KEY=sua_chave_basescan

# Token Configuration (opcional, usa defaults se não configurado)
TOKEN_NAME=Neo Protocol
TOKEN_SYMBOL=NEO
MINT_PRICE=3000000000000000        # 0.003 ETH em wei
MINT_AMOUNT=1000000000000000000000   # 1000 tokens em wei
INITIAL_OWNER=0x470a8c640fFC2C16aEB6bE803a948420e2aE8456
```

### 2. Deploy

```bash
# Polygon Mainnet
cd forge-core
npx hardhat run scripts/deployV2.js --network polygon

# Base Mainnet
npx hardhat run scripts/deployV2.js --network base

# Amoy Testnet (para testes)
npx hardhat run scripts/deployV2.js --network amoy
```

### 3. Verificar no Explorer

O script mostrará o comando de verificação. Exemplo:

```bash
npx hardhat verify --network polygon 0xCONTRACT_ADDRESS \
  "Neo Protocol" \
  "NEO" \
  "3000000000000000" \
  "1000000000000000000000" \
  "0x470a8c640fFC2C16aEB6bE803a948420e2aE8456"
```

---

## 📋 Configuração Padrão

Se você **NÃO** configurar variáveis de ambiente, o script usa:

| Parâmetro | Valor Padrão |
|-----------|--------------|
| **Name** | Neo Protocol |
| **Symbol** | NEO |
| **Mint Price** | 0.003 ETH |
| **Mint Amount** | 1000 tokens |
| **Owner** | 0x470a8c640fFC2C16aEB6bE803a948420e2aE8456 (NODE NEØ) |
| **Max Supply** | 1,000,000,000 tokens (hardcoded) |

---

## 🔧 Pós-Deploy

### 1. Configurar Bridge (Quando Pronto)

```javascript
const token = await ethers.getContractAt("NeoTokenV2", "0xTokenAddress");
await token.setBridgeMinter("0xBridgeAddress");
```

### 2. Testar Mint Público

```javascript
await token.publicMint({ value: ethers.parseEther("0.003") });
```

### 3. Desabilitar Mint (Se Necessário)

```javascript
await token.setPublicMintStatus(false);
```

### 4. Sacar Fundos Acumulados

```javascript
await token.withdraw();
```

---

## 🌐 Networks Configuradas

### Polygon Mainnet
- RPC: https://polygon-rpc.com
- Explorer: https://polygonscan.com
- Chain ID: 137

### Base Mainnet
- RPC: https://mainnet.base.org
- Explorer: https://basescan.org
- Chain ID: 8453

### Amoy Testnet
- RPC: https://rpc-amoy.polygon.technology
- Explorer: https://amoy.polygonscan.com
- Chain ID: 80002

---

## 📊 Informações do Deploy

Após o deploy, as informações são salvas em:

```
forge-core/deployments/neotokenv2-{network}.json
```

Exemplo:
```json
{
  "network": "polygon",
  "chainId": "137",
  "tokenAddress": "0x...",
  "tokenName": "Neo Protocol",
  "tokenSymbol": "NEO",
  "owner": "0x470a8c640fFC2C16aEB6bE803a948420e2aE8456",
  "mintPrice": "3000000000000000",
  "mintAmount": "1000000000000000000000",
  "maxSupply": "1000000000000000000000000000",
  "deployedAt": "2026-01-20T16:24:00.000Z",
  "blockNumber": 52847392,
  "txHash": "0x..."
}
```

---

## 🔒 Segurança

### Owner Capabilities

O owner (0x470a8c640fFC2C16aEB6bE803a948420e2aE8456) pode:

- ✅ Configurar bridge minter (`setBridgeMinter`)
- ✅ Habilitar/desabilitar mint público (`setPublicMintStatus`)
- ✅ Resetar mint de um endereço (`resetPublicMint`)
- ✅ Sacar fundos acumulados (`withdraw`)
- ✅ Transferir ownership (`transferOwnership` + `acceptOwnership`)

### Ownable2Step

O contrato usa **Ownable2Step** para transferência segura de ownership:

```javascript
// 1. Owner atual propõe novo owner
await token.transferOwnership("0xNewOwner");

// 2. Novo owner aceita (2-step process)
await token.connect(newOwner).acceptOwnership();
```

---

## 🧪 Testnet Deploy (Recomendado Primeiro)

```bash
# Deploy no Amoy testnet primeiro para testar
npx hardhat run scripts/deployV2.js --network amoy

# Obter POL de teste
# https://faucet.polygon.technology/

# Testar mint
cast send $TOKEN_ADDRESS "publicMint()" --value 0.003ether --private-key $PRIVATE_KEY --rpc-url $AMOY_RPC

# Verificar balance
cast call $TOKEN_ADDRESS "balanceOf(address)(uint256)" $YOUR_ADDRESS --rpc-url $AMOY_RPC
```

---

## 📚 Referências

- **Contrato**: `forge-core/contracts/NeoTokenV2.sol`
- **Documentação**: `docs/NEOTOKENV2.md`
- **Bridge System**: `docs/MANUAL_BRIDGE.md`

---

**Project Lead**: NODE NEØ  
**Web3**: neoprotocol.eth  
**Expand until silence becomes structure.**
