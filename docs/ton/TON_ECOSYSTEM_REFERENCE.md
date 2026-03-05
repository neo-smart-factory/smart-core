# Referência do Ecossistema TON

## 📚 Documentação Consolidada

### 1. Chainstack - TON Tooling

**Fonte:** <https://docs.chainstack.com/docs/ton-tooling>

#### Bibliotecas Disponíveis para TON

**JavaScript/TypeScript:**

- **@ton/ton** (ton.js) - Biblioteca oficial (que estamos usando)
- **tonweb** - Alternativa popular

**Python:**

- **tonsdk** - SDK oficial Python
- **pytonlib** - Biblioteca low-level
- **pytoniq** - Biblioteca moderna

**Go:**

- **tonutils-go** - SDK Go oficial
- **tongo** - Biblioteca da Tonkeeper

**Rust:**

- **tonlib-rs** - Bindings Rust para tonlib

**.NET:**

- **TonSdk.NET** - SDK para C#

#### Blueprint SDK (Recomendado)

Framework oficial para desenvolvimento TON:

```bash
npm create ton@latest
```

**Recursos:**

- Desenvolvimento em TACT (linguagem de contratos)
- Testes automatizados
- Deploy simplificado
- Configuração de custom RPC endpoints

**Configuração com Chainstack:**

```typescript
// blueprint.config.ts
import { Config } from '@ton/blueprint';

export const config: Config = {
    network: {
        endpoint: 'YOUR_CHAINSTACK_ENDPOINT',
        type: 'testnet',
        version: 'v2',
    },
};
```

---

### 2. TON APIs Disponíveis

#### API v2 (HTTP JSON-RPC)

- Formato JSON-RPC tradicional
- Métodos para blockchain queries
- Deploy de contratos
- Leitura de estados

**Endpoint Chainstack v2:**
```
https://ton-testnet.core.chainstack.com/{KEY}/api/v2/jsonRPC
```

#### API v3 (Indexer)

- API REST indexada
- Consultas otimizadas
- Histórico de transações
- NFT e Jetton queries

**Endpoint Chainstack v3:**

<https://ton-testnet.core.chainstack.com/{KEY}/api/v3>


**Métodos úteis v3:**

- `/jetton/masters` - Listar jettons
- `/jetton/wallets` - Wallets de jettons
- `/jetton/transfers` - Histórico de transferências
- `/account` - Info de conta
- `/transactions` - Transações

---

### 3. STON.fi DEX Integration

**Fonte:** https://docs.ston.fi/developer-section/dex/sdk/v2/vault-operations

STON.fi é a principal DEX da TON blockchain.

#### SDK STON.fi

```bash
npm install @ston-fi/sdk @ston-fi/api
```

#### Padrão API-Driven

**Importante:** Sempre obter metadados dinâmicos do router:

```javascript
import { Client, routerFactory } from "@ston-fi/sdk";
import { StonApiClient } from "@ston-fi/api";

const tonClient = new Client({
  endpoint: "https://toncenter.com/api/v2/jsonRPC",
  apiKey: process.env.TON_API_KEY,
});

const apiClient = new StonApiClient();
```

#### Testnet vs Mainnet

**Mainnet:** Use `stonApiClient` para descoberta automática
**Testnet:** Requer configuração manual dos endereços

```typescript
// Testnet example
const client = new TonClient({
  endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
});

const router = client.open(
  DEX.v2_1.Router.CPI.create("kQALh-JBBIKK7gr0o4AVf9JZnEsFndqO0qTCyT-D-yBsWk0v")
);
```

#### Integração Futura

Quando nosso token estiver deployado, podemos:
1. Criar pool de liquidez no STON.fi
2. Habilitar trading
3. Implementar vault operations
4. Configurar programa de afiliados

---

### 4. Telegram Bot API

**Fonte:** https://core.telegram.org/bots/api

#### Versão Atual: Bot API 9.3 (31 Dez 2025)

#### Novos Recursos Relevantes

**1. Topics em Chats Privados**
- Bots podem usar modo de tópicos em DMs
- `has_topics_enabled` - verifica se está habilitado
- `sendMessageDraft` - streaming de mensagens

**2. Gifts e Stars**
- Sistema de presentes integrado
- `getUserGifts` - obter presentes de usuário
- `getChatGifts` - obter presentes de chat
- **Integração TON Blockchain:** `is_from_blockchain` flag
- `exclude_from_blockchain` - filtrar gifts da blockchain

**3. Telegram Stars (Pagamentos)**
- Moeda nativa do Telegram
- `getMyStarBalance` - saldo do bot
- `transferBusinessAccountStars` - transferir stars
- Pagamentos até 25000 Stars

#### Possibilidades para NEØ Protocol

**1. Bot de Gestão de Tokens**
```
/create - Criar novo token
/mint - Fazer mint de tokens
/balance - Ver saldos
/transfer - Transferir tokens
```

**2. Notificações de Deploy**
- Alertas quando tokens são criados
- Confirmações de transações
- Relatórios de mint

**3. Sistema de Gifts**
- Enviar tokens como gifts
- Integração com TON blockchain gifts
- Programa de recompensas

**4. Business Account Integration**
- Gestão de múltiplas contas
- Transferência de Stars
- Analytics e métricas

---

### 5. Arquitetura de Integração

#### Componentes do Sistema NEØ

```
┌─────────────────────────────────────────┐
│         Frontend (React/Vite)           │
│  - UI para criação de tokens            │
│  - Dashboard de analytics               │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│      Smart Contracts (TON/FunC)         │
│  - NeoJettonFactoryV2 (v2.3.0)         │
│  - NeoJettonMinter                      │
│  - NeoJettonWallet                      │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│         Infraestrutura RPC              │
│  - Chainstack (dedicado)                │
│  - TonCenter (fallback)                 │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│      Integrações Futuras (Opcional)     │
│  - STON.fi DEX (liquidez)               │
│  - Telegram Bot (notificações)          │
│  - Analytics API                        │
└─────────────────────────────────────────┘
```

---

### 6. Próximas Integrações Possíveis

#### Fase 1: Core (Atual)
- ✅ Deploy de Factory
- ✅ Deploy de Tokens
- ✅ Operações de Mint
- ⏳ Testes na testnet

#### Fase 2: DEX Integration
- [ ] Listar token no STON.fi
- [ ] Criar pool de liquidez
- [ ] Habilitar trading
- [ ] Analytics de volume

#### Fase 3: Bot Telegram
- [ ] Bot de notificações
- [ ] Comandos de gestão
- [ ] Sistema de gifts
- [ ] Business account integration

#### Fase 4: Advanced Features
- [ ] Staking de tokens
- [ ] Governance on-chain
- [ ] Bridge cross-chain
- [ ] NFT integration

---

### 7. Recursos Importantes

#### Documentação Oficial TON
- **Main Docs:** https://docs.ton.org
- **FunC Reference:** https://docs.ton.org/develop/func/
- **TVM Instructions:** https://docs.ton.org/learn/tvm-instructions/
- **Jetton Standard (TEP-74):** https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md

#### Ferramentas de Desenvolvimento
- **TON Explorer (Testnet):** https://testnet.tonscan.org
- **TON Explorer (Mainnet):** https://tonscan.org
- **Faucet Testnet:** https://t.me/testgiver_ton_bot
- **BotFather:** https://t.me/botfather

#### Chainstack
- **Console:** https://console.chainstack.com
- **Status:** https://status.chainstack.com
- **Docs:** https://docs.chainstack.com/docs/ton-tooling

#### STON.fi DEX
- **Website:** https://ston.fi
- **Docs:** https://docs.ston.fi
- **SDK:** @ston-fi/sdk

---

### 8. Best Practices Identificadas

#### 1. Sempre Testar na Testnet Primeiro
- Economiza TON real
- Identifica bugs cedo
- Valida funcionalidade

#### 2. Usar RPC Dedicado (Chainstack)
- Melhor performance
- Rate limits maiores
- SLA garantido

#### 3. Implementar Fallbacks
- TonCenter como backup
- Múltiplos endpoints
- Retry logic

#### 4. Validação Pre-Deploy
- Scripts de teste unitário
- Validação de células
- Verificação de gas costs

#### 5. Monitoramento
- Logs de transações
- Métricas de uso
- Alertas de erro

---

### 9. Glossário TON

| Termo | Significado |
|-------|-------------|
| **Jetton** | Token padrão TON (similar a ERC20) |
| **Minter** | Contrato que cria/gerencia tokens |
| **Wallet** | Contrato de wallet de usuário para jettons |
| **Factory** | Contrato que cria Minters |
| **BOC** | Bag of Cells - formato de serialização TON |
| **TVM** | TON Virtual Machine |
| **FunC** | Linguagem de contratos TON |
| **TACT** | Nova linguagem de contratos (tipo TypeScript) |
| **Workchain** | Cadeia de trabalho (0 = mainnet padrão) |
| **Sharding** | Particionamento da blockchain |
| **ADNL** | Protocolo de rede baixo nível TON |

---

### 10. Checklist de Deploy Completo

#### Pre-Deploy
- [x] Contratos compilados
- [x] Testes unitários passando
- [x] Análise de células OK
- [x] RPC configurado
- [ ] Saldo suficiente na wallet

#### Deploy Testnet
- [ ] Factory deployada
- [ ] Token de teste criado
- [ ] Mint testado
- [ ] Transfer testado
- [ ] Burn testado

#### Deploy Mainnet
- [ ] Auditoria de segurança
- [ ] Documentação completa
- [ ] Frontend configurado
- [ ] Factory deployada mainnet
- [ ] Primeiros tokens criados

#### Post-Deploy
- [ ] Listagem no explorer
- [ ] Listagem no STON.fi (opcional)
- [ ] Bot Telegram (opcional)
- [ ] Analytics setup
- [ ] Documentação de usuário

---

**Data:** 25 de Janeiro de 2026  
**Versão:** 1.0  
**Status:** Documentação consolidada ✅

---

## 🎯 Próximo Passo Imediato

**Obter TON de teste e iniciar deploy na testnet:**

1. ✅ Documentação consolidada
2. ✅ RPC configurado (TonCenter operacional)
3. ✅ Contratos compilados (v2.3.0)
4. ⏳ Aguardando TON testnet

**Endereço para receber TON:**
```
UQBqdVqFqwdMY985u7Qjl97Hoai0N2XZzNhNkVOE8LBhm0i0
```

**Bot Telegram para obter TON:**
https://t.me/testgiver_ton_bot
