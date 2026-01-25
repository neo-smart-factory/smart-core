# Configuração de RPC para TON Blockchain

## 📡 Providers Disponíveis

### 1. TonCenter (Recomendado - Ativo)

**Status:** ✅ Operacional

**Vantagens:**
- Funciona imediatamente
- Não requer configuração adicional
- Suporte oficial da TON Foundation
- Testnet gratuita

**Endpoints:**
```
Testnet: https://testnet.toncenter.com/api/v2/jsonRPC
Mainnet: https://toncenter.com/api/v2/jsonRPC
```

**Rate Limits:**
- Testnet: Sem limites (gratuito)
- Mainnet: 1 req/s (público) ou mais com API key

**Como obter API Key (Mainnet):**
1. Acesse: https://toncenter.com
2. Obtenha uma chave gratuita
3. Configure no `.env`: `TON_API_URL=sua_chave`

---

### 2. Chainstack (Alternativa)

**Status:** ⚠️ Requer node dedicado

**Vantagens:**
- Rate limits mais altos
- Melhor performance
- SLA garantido
- Métricas avançadas

**Endpoints:**
```
Testnet v2: https://ton-testnet.core.chainstack.com/{YOUR_KEY}/api/v2
Testnet v3: https://ton-testnet.core.chainstack.com/{YOUR_KEY}/api/v3
Mainnet v2: https://ton-mainnet.core.chainstack.com/{YOUR_KEY}/api/v2
Mainnet v3: https://ton-mainnet.core.chainstack.com/{YOUR_KEY}/api/v3
```

**Como configurar:**
1. Acesse: https://console.chainstack.com
2. Deploy um node TON (testnet ou mainnet)
3. Copie o endpoint do seu node
4. Configure no `.env`:
   ```bash
   TON_RPC_URL_TESTNET=https://ton-testnet.core.chainstack.com/{YOUR_KEY}/api/v2
   TON_RPC_URL_MAINNET=https://ton-mainnet.core.chainstack.com/{YOUR_KEY}/api/v2
   ```

**Nota:** Chainstack suporta tanto API v2 quanto v3 (indexer)

---

## 🔧 Configuração Atual

### Arquivo `.env`

```bash
# Network selecionada
TON_NETWORK=testnet

# TonCenter (Primário - Funciona imediatamente)
TON_API_URL=03ff56841a4c6ef624c99bd318cbeecb9806d3b5bb6857115ba17771ba5ce3ac

# Chainstack (Opcional - Fallback se configurado)
CHAINSTACK_API_KEY=532306380d3efcbfb82657bfeea32cee
TON_RPC_URL_TESTNET=https://ton-testnet.core.chainstack.com/532306380d3efcbfb82657bfeea32cee/api/v2
TON_RPC_URL_MAINNET=https://ton-mainnet.core.chainstack.com/532306380d3efcbfb82657bfeea32cee/api/v2
```

### Ordem de Prioridade nos Scripts

1. **TonCenter** (primário)
2. **Chainstack** (fallback, se configurado)
3. **TonCenter público** (fallback final)

---

## 🧪 Testar Conexão

### Verificar saldo na testnet:
```bash
node scripts/check-testnet-balance.js
```

### Testar conectividade:
```bash
node scripts/test-chainstack-connection.js
```

---

## 📊 Comparação

| Característica | TonCenter | Chainstack |
|---------------|-----------|------------|
| **Setup** | Imediato | Requer node |
| **Testnet** | Gratuito | Requer plano |
| **Rate Limit** | 1 req/s (mainnet público) | Customizável |
| **Performance** | Boa | Excelente |
| **SLA** | - | Garantido |
| **Custo** | Gratuito/Baixo | Variável |

---

## 🚀 Recomendação

### Para Desenvolvimento e Testes:
✅ Use **TonCenter Testnet** (já configurado e funcional)

### Para Produção (Mainnet):
- **Baixo volume:** TonCenter com API key (gratuito)
- **Alto volume:** Chainstack com node dedicado (melhor performance)

---

## 📝 Próximos Passos

1. ✅ TonCenter configurado e testado
2. ⏳ Obter TON de teste: https://t.me/testgiver_ton_bot
3. ⏳ Fazer deploy na testnet
4. ⏳ Validar funcionamento
5. ⏳ Configurar para mainnet quando necessário

---

**Data:** 25 de Janeiro de 2026  
**Status:** Configuração de RPC otimizada e funcional ✅
