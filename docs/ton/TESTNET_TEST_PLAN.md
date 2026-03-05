# Plano de Testes - Testnet TON

## 📋 Objetivo

Validar a correção do Exit Code 9 (v2.3.0) em ambiente de testnet antes de deploy em mainnet.

---

## 🎯 Testes Planejados

### Fase 1: Preparação ✅

- [x] Sincronizar correções v2.3.0 do repositório
- [x] Compilar contratos TON com correção
- [x] Configurar RPC (TonCenter operacional)
- [x] Validar correção com script de teste (`test-dict-fix.js`)
- [x] Preparar wallet de testnet

### Fase 2: Deploy da Factory 🔄

**Objetivo:** Fazer deploy da NeoJettonFactoryV2 v2.3.0 na testnet

**Script:** `deploy-ton-factory-v2.js`

**Passos:**

1. Conectar ao TonCenter testnet
2. Carregar wallet do deployer
3. Calcular endereço do contrato
4. Enviar transação de deploy (0.25 TON)
5. Aguardar confirmação
6. Verificar contrato no explorer

**Validações:**

- ✅ Contrato deployed com sucesso
- ✅ Code hash correto (v2.3.0)
- ✅ Get methods respondendo
- ✅ Sem erros de TVM

### Fase 3: Deploy de Token de Teste 🔄

**Objetivo:** Criar token através da Factory

**Script:** `deploy-nsf-token.js`

**Configuração do Token:**

```javascript
{
  name: "NEØ Test Token",
  symbol: "NTEST",
  decimals: 9,
  max_supply: 1000000000000000000, // 1B tokens
  mint_price: 100000000, // 0.1 TON
  mint_amount: 1000000000000000000 // 1000 tokens por mint
}
```

**Passos:**

1. Conectar à Factory deployada
2. Preparar metadata do token
3. Enviar transação de deploy (0.25 TON)
4. Aguardar criação do Minter
5. Verificar Minter no explorer

**Validações:**

- ✅ Minter criado com sucesso
- ✅ **Sem Exit Code 9** (principal validação)
- ✅ Metadata correto
- ✅ Max supply configurado
- ✅ Mint price configurado

### Fase 4: Operações de Mint 🔄

**Objetivo:** Testar operações do Minter

**Script:** `testMint.js`

**Testes:**

1. **Mint inicial (owner)**
   - Minter → Wallet do owner
   - Verificar saldo

2. **Transfer**
   - Owner → Endereço de teste
   - Verificar balances

3. **Burn**
   - Queimar tokens
   - Verificar total supply

**Validações:**

- ✅ Mint funciona corretamente
- ✅ Transfer funciona
- ✅ Burn funciona
- ✅ Balances corretos
- ✅ Total supply atualiza

### Fase 5: Testes de Stress 🔄

**Objetivo:** Validar robustez

**Testes:**

1. Múltiplos tokens via Factory
2. Múltiplos mints
3. Transferências em cadeia
4. Verificar gas costs

---

## 📊 Critérios de Sucesso

### Críticos (Must Have)

- ✅ Deploy sem Exit Code 9
- ✅ Minter funcional
- ✅ Operações básicas (mint, transfer, burn)

### Importantes (Should Have)

- ✅ Gas costs razoáveis
- ✅ Performance adequada
- ✅ Explorer mostrando dados corretos

### Desejáveis (Nice to Have)

- ✅ Múltiplos tokens sem problemas
- ✅ Testes de stress bem-sucedidos

---

## 🔧 Comandos de Teste

### Monitoramento Automático

```bash
# Aguarda fundos e inicia deploy automaticamente
node scripts/wait-for-funds-and-deploy.js
```

### Execução Manual

**1. Verificar saldo:**

```bash
node scripts/check-testnet-balance.js
```

**2. Deploy Factory:**

```bash
node scripts/deploy-ton-factory-v2.js
```

**3. Deploy Token:**

```bash
node scripts/deploy-nsf-token.js
```

**4. Testar Mint:**

```bash
node scripts/testMint.js
```

**5. Verificar estado:**

```bash
node scripts/check-factory-state.js
node scripts/debug-factory-detailed.js
```

---

## 📝 Registro de Testes

### Execução #1 - [DATA]

**Environment:**

- Network: Testnet
- Provider: TonCenter
- Contract Version: v2.3.0

**Resultados:**

- [ ] Factory Deploy
- [ ] Token Deploy
- [ ] Mint Operations
- [ ] Transfer Operations
- [ ] Burn Operations

**Observações:**
```
[Adicionar observações aqui]
```

**Exit Code 9:**

- Status: [ ] Resolvido / [ ] Ainda presente

---

## 🎓 Lições Aprendidas

### O que funcionou bem:

- [A preencher após testes]

### O que precisa melhorar:

- [A preencher após testes]

### Próximos passos:

- [A preencher após testes]

---

## 🚀 Preparação para Mainnet

Após testes bem-sucedidos na testnet:

1. **Revisar resultados**
   - Verificar todos os critérios de sucesso
   - Analisar gas costs
   - Confirmar ausência de bugs

2. **Atualizar configuração**

   ```bash
   # No .env
   TON_NETWORK=mainnet
   ```

3. **Deploy mainnet**

   ```bash
   node scripts/deploy-ton-factory-v2.js
   ```

4. **Monitoramento**
   - Acompanhar primeiras transações
   - Validar comportamento em produção

---

**Data de Criação:** 25 de Janeiro de 2026  
**Versão do Contrato:** v2.3.0  
**Correção:** Exit Code 9 (Cell Underflow)  
**Status:** Aguardando fundos testnet 🔄
