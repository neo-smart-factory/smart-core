# TON Contracts - NEØ Smart Factory

Implementação de contratos TON (FunC) para a NEØ Smart Factory.

## Contratos Disponíveis

### NeoJettonFactory.fc (V1)
Factory original para criação de Jettons.

**Status:** ⚠️ Versão legada, usar V2

### NeoJettonFactoryV2.fc (V2) 
Factory melhorada para criação de Jettons.

**Status:** 🔍 Em debug - Factory não cria Minter (bug ativo)

**Recursos:**
- Deploy de Jetton Minters
- Configuração de mint price
- Max supply
- Owner management

**OP Codes:**
- `0x61caf729` - deploy_jetton
- `0x1` - transfer
- Outros (ver código)

### NeoJettonMinter.fc
Contrato Minter de Jettons (equivalente ao ERC20 Minter).

**Status:** ✅ Testado e funcional

**Padrões:**
- TEP-74 (Jetton Standard)
- TEP-64 (Token Metadata)
- TEP-89 (Discoverable Jettons)

**Funcionalidades:**
- Mint de tokens
- Burn de tokens
- Metadata on-chain
- Descoberta automática

### NeoJettonWallet.fc
Wallet de usuário para Jettons.

**Status:** ✅ Testado e funcional

**Recursos:**
- Transfer de tokens
- Balance tracking
- Notificações
- Compatível com carteiras TON

## Compilação

### Pré-requisitos
```bash
npm install @ton-community/func-js
npm install @ton/ton @ton/core @ton/crypto
```

### Compilar V1
```bash
node scripts/compile-ton.js
```

### Compilar V2
```bash
node scripts/compile-ton-v2.js
```

## Deploy

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

### Deploy de Jetton (NSF Token)
```bash
node scripts/deploy-nsf-token.js
```

## Debug

Scripts de debug disponíveis em `scripts/debug/`:

```bash
# Ver status de todas as factories
node scripts/debug/debug-all-factories.js

# Debug de cálculo de endereço
node scripts/debug/debug-jetton-address.js

# Dry-run (sem gastar TON)
node scripts/debug/dry-run-ton.js
```

## Arquitetura

```
User
  ↓
Factory (NeoJettonFactoryV2.fc)
  ↓ (deploy_jetton)
Minter (NeoJettonMinter.fc)
  ↓ (mint)
Wallet (NeoJettonWallet.fc)
```

## Paridade EVM ↔ TON

| EVM | TON | Status |
|-----|-----|--------|
| NeoTokenV2.sol | NeoJettonMinter.fc | ✅ |
| ERC20 transfer | Jetton transfer | ✅ |
| mint() | mint() | ✅ |
| burn() | burn() | ✅ |
| Metadata | TEP-64 | ✅ |

Ver: `docs/auditoria/EVM_TON_MAPPING.md` para detalhes completos.

## Bug Conhecido (2026-01-25)

⚠️ **Factory V2 não cria Jetton Minter**

**Sintomas:**
- Transaction confirmada
- Excess devolvido (~0.498 TON)
- StateInit não é enviado
- Minter não aparece na blockchain

**Investigação:**
Ver documentação completa em `neo-smart-token-factory/docs`:
- `CHECKPOINT_TON_FACTORY_2026-01-25.md` - Checkpoint técnico
- `SESSAO_APRENDIZADO_TON_FACTORY.md` - Análise profunda
- `PLANO_REORGANIZACAO.md` - Próximos passos

**Soluções em Teste:**
- Opção A: Usar TON Minter oficial como base
- Opção B: Factory minimalista para isolar bug
- Opção C: Debug profundo com get methods

## Padrões TON

### TEP-74: Jetton Standard
- ✅ Estrutura de mensagens
- ✅ OP codes
- ✅ Notificações

### TEP-64: Token Metadata
- ✅ On-chain metadata
- ✅ Off-chain metadata URI
- ✅ Formato JSON

### TEP-89: Discoverable Jettons
- ✅ Get methods
- ✅ Metadata discovery
- ✅ Wallet discovery

## Segurança

### Auditorias
- [ ] Auditoria formal pendente
- [x] Code review interno
- [x] Testes em testnet

### Boas Práticas
- ✅ Uso de imports padronizados
- ✅ Validação de inputs
- ✅ Bounds checking
- ✅ Integer overflow protection

## Testes

```bash
# Testar compilação
node scripts/compile-ton-v2.js

# Testar deploy em testnet
export TON_NETWORK=testnet
node scripts/deploy-ton-factory-v2.js

# Verificar factory
node scripts/debug/debug-all-factories.js
```

## Recursos

### Documentação Oficial
- **TON Docs:** https://docs.ton.org
- **TEP-74:** https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md
- **TON Minter:** https://github.com/ton-blockchain/minter-contract

### Ferramentas
- **TonScan:** https://testnet.tonscan.org
- **TON Center:** https://testnet.toncenter.com
- **TON Minter App:** https://minter.ton.org

### Repositórios NEØ
- **docs:** https://github.com/neo-smart-token-factory/docs
- **smart-core:** https://github.com/neo-smart-token-factory/smart-core

## Licença

Ver `LICENSE` no repositório raiz.

---

**Status Geral:** 🟡 Em desenvolvimento ativo  
**Última Atualização:** 2026-01-25  
**Contato:** GitHub Issues
