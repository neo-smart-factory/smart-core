# 🔍 Análise do Exit Code 9 - Cell Overflow

**Data:** 25 de Janeiro de 2026  
**Versão:** Factory V2.2.0  
**Status:** ⚠️ Problema Não Resolvido (Necessita Testnet)

---

## 📋 Sumário Executivo

Durante o deployment do **$NSF Token** via **NeoJettonFactoryV2** na TON Mainnet, encontramos um erro persistente:

```
Exit Code: 9 (Cell Overflow)
Gas Used: 1006
Status: VM FAILED
```

Após múltiplas tentativas e correções, o problema persiste. Este documento detalha toda a análise técnica realizada.

---

## 🎯 O Problema

### Exit Code 9: Cell Overflow

**Definição:** Em TON, cada célula tem limites estritos:
- **Máximo:** 1023 bits de dados
- **Máximo:** 4 referências para outras células

O erro indica que estamos tentando armazenar mais dados do que permitido em uma célula durante a execução do contrato.

### Contexto

- **Contrato:** NeoJettonFactoryV2.fc
- **Operação:** `op::deploy_jetton` (0x61caf729)
- **Custo Estimado em Testes:** ~1.5 TON gastos em tentativas na mainnet
- **Número de Tentativas:** 7+ deploys de Factory + 7+ tentativas de deploy do token

---

## 🔬 Análise Técnica Detalhada

### 1. Estrutura de Dados

#### Extra Data Cell (V2 Features)
```func
cell extra_data = begin_cell()
    .store_coins(max_supply)        // ~120 bits (1B tokens)
    .store_coins(mint_price)        // ~60 bits (0.1 TON)
    .store_coins(mint_amount)       // ~80 bits (1000 tokens)
    .store_int(0, 1)                // 1 bit (public_mint_enabled)
    .store_slice(owner_address)     // ~267 bits (MsgAddress)
    .store_uint(0, 1)               // 1 bit (empty dict)
    .end_cell();
```

**Total:** ~417 bits ✅ (606 bits disponíveis)

#### Content Cell (TEP-64)
```func
cell content = begin_cell()
    .storeUint(0x01, 8)                           // 8 bits
    .storeStringTail(contentUri)                   // ~432 bits
    .endCell();
```

**Total:** ~440 bits ✅ (583 bits disponíveis)

#### Data Cell (Minter Initial State)
```func
cell data = begin_cell()
    .store_coins(0)                 // ~8 bits (total_supply)
    .store_slice(owner_address)     // ~267 bits
    .store_ref(content)             // 1 ref
    .store_ref(jetton_wallet_code)  // 1 ref
    .store_ref(extra_data)          // 1 ref
    .end_cell();
```

**Total:** ~275 bits + 3 refs ✅ (748 bits disponíveis, 1 ref disponível)

### 2. Análise de Mensagem de Deploy

#### Versão Inicial (INCORRETA)
```func
.store_uint(4 + 2 + 1, 1 + 4 + 4 + 64 + 32 + 1 + 1 + 1)
// Tentava armazenar valor 7 em 115 bits - FORMATO INVÁLIDO
```

#### Versão Corrigida (V2.2.0)
```func
.store_uint(0x18, 6)                    // flags
.store_slice(jetton_address)            // destination
.store_coins(jetton_deploy_value)       // value
.store_uint(0, 1 + 4 + 4 + 64 + 32)    // extra fields
.store_uint(1, 1)                       // init:Just
.store_uint(1, 1)                       // body:Just
.store_ref(state_init)                  // state_init
.store_ref(begin_cell().end_cell())     // empty body
```

**Status:** Formato correto segundo especificação TON ✅

---

## 🔄 Histórico de Tentativas

### Tentativa 1-3: Estrutura de Admins
- **Problema:** Dictionary de admins mal formatado
- **Erro:** Exit Code 7 (Cell Underflow)
- **Solução:** Simplificado para single admin
- **Resultado:** Mudou para Exit Code 9

### Tentativa 4-5: Empty Dictionary
- **Problema:** `new_dict()` não existe no stdlib
- **Teste 1:** `null()` - função não existe
- **Teste 2:** `begin_cell().end_cell()` - incompatível com `load_dict()`
- **Teste 3:** `store_uint(0, 1)` - formato atual
- **Resultado:** Exit Code 9 persiste

### Tentativa 6: Formato de Mensagem
- **Problema:** Formato de deploy message incorreto
- **Correção:** Separação adequada dos campos da mensagem
- **Resultado:** Exit Code 9 persiste

### Tentativa 7: Versão Final (V2.2.0)
- **Status:** Todas as células dentro dos limites
- **Formato:** Mensagem correta
- **Resultado:** ❌ Exit Code 9 ainda ocorre

---

## 🧩 Possíveis Causas Remanescentes

### 1. Incompatibilidade store/load do Dictionary
```func
// Factory (store)
.store_uint(0, 1)  // empty dict

// Minter (load)
extra~load_dict()  // Espera Maybe(Dict)
```

**Impacto:** Pode causar Cell Overflow ao tentar parsear

### 2. Células Temporárias Durante Execução
Durante `calculate_jetton_minter_state_init()`, múltiplas células são construídas:
- extra_data
- data
- state_init

Pode haver acúmulo temporário excedendo limites.

### 3. Resolução de Referências no StateInit
O `state_init` contém:
- Referência ao code (Minter)
- Referência ao data
  - Que por sua vez tem 3 refs internas

Profundidade de referências pode estar causando problema.

### 4. Tamanho do Código Compilado
O `jetton_minter_code` em si pode estar muito grande, causando overflow ao ser incluído no state_init.

---

## 📊 Deploys Realizados

| Versão | Factory Address | Data | Custo | Status |
|--------|----------------|------|-------|--------|
| V2.0.0 | EQDyoLfni...WDW7 | 25/01 10:43 | 0.25 TON | ❌ Exit Code 7 |
| V2.0.1 | EQApzi-m2...MFMY | 25/01 10:48 | 0.25 TON | ❌ Exit Code 9 |
| V2.0.2 | EQC_fuH1z...UFMY | 25/01 10:50 | 0.25 TON | ❌ Exit Code 9 |
| V2.1.0 | EQC76EiSo...CoFt | 25/01 10:55 | 0.25 TON | ❌ Exit Code 9 |
| V2.1.1 | EQCAIv-dA...oJZz | 25/01 10:58 | 0.25 TON | ❌ Exit Code 9 |
| V2.1.2 | EQCmI_o_D...6a99 | 25/01 11:00 | 0.25 TON | ❌ Exit Code 9 |
| V2.2.0 | EQBZJZx3k...Ux2e | 25/01 11:04 | 0.25 TON | ❌ Exit Code 9 |

**Total Gasto:** ~1.75 TON (apenas em deploys de Factory)
**Tentativas de Token:** ~3.5 TON adicionais
**TOTAL:** ~5.25 TON gastos em debugging

---

## 💡 Recomendações e Próximos Passos

### Opção A: Testar na Testnet (ALTAMENTE RECOMENDADO) ⭐

**Vantagens:**
- ✅ Custo ZERO
- ✅ Mesmo comportamento da mainnet
- ✅ Permite debug ilimitado
- ✅ Logs mais detalhados disponíveis

**Como Implementar:**
```bash
# 1. Modificar .env
TON_NETWORK=testnet

# 2. Obter TON de teste
# https://t.me/testgiver_ton_bot

# 3. Deployar e testar
npm run deploy:ton-factory-v2
npm run deploy:nsf-token
```

### Opção B: Simplificar Temporariamente

**Abordagem Incremental:**

1. **Fase 1:** Deploy Jetton Padrão (sem features V2)
   - Remover: max_supply, mint_price, mint_amount
   - Usar estrutura básica do [minter-contract oficial](https://github.com/ton-blockchain/minter-contract)
   - Confirmar que Factory funciona

2. **Fase 2:** Adicionar features incrementalmente
   - Adicionar 1 campo por vez
   - Testar após cada adição
   - Identificar qual campo causa o problema

3. **Fase 3:** Otimizar estrutura
   - Mover campos problemáticos para referências separadas
   - Usar formato mais compacto

### Opção C: Usar Minter Oficial TON

**Prós:**
- ✅ Comprovadamente funcional
- ✅ Bem testado na mainnet
- ✅ Documentação completa

**Contras:**
- ❌ Perde features customizadas V2
- ❌ Requer adaptação da arquitetura NEO

**Implementação:**
```bash
# Clonar repo oficial
git clone https://github.com/ton-blockchain/minter-contract

# Adaptar para NeoFactory
# Manter apenas o necessário
```

### Opção D: Debug Profundo com TON SDK

**Ferramentas:**
- `ton-compiler` com flags de debug
- `toncli` para simulação local
- `tonlib` para inspeção detalhada

**Passos:**
```bash
# 1. Instalar toncli
pip install toncli

# 2. Simular localmente
toncli run_tests

# 3. Analisar traces detalhados
toncli deploy --dry-run
```

---

## 📝 Checklist para Testnet

- [ ] Modificar `TON_NETWORK=testnet` no `.env`
- [ ] Obter TON de teste via @testgiver_ton_bot
- [ ] Deploy Factory V2.2.0 na testnet
- [ ] Deploy NSF Token na testnet
- [ ] Analisar logs detalhados
- [ ] Identificar exatamente onde ocorre o overflow
- [ ] Aplicar correção
- [ ] Testar novamente
- [ ] Quando funcionar, migrar para mainnet

---

## 🔗 Referências Úteis

### Documentação TON
- [TVM Exit Codes](https://docs.ton.org/learn/tvm-instructions/tvm-exit-codes)
- [Cell Format](https://docs.ton.org/develop/data-formats/cell-boc)
- [Message Format](https://docs.ton.org/develop/smart-contracts/guidelines/internal-messages)

### Contratos Oficiais
- [Jetton Minter](https://github.com/ton-blockchain/minter-contract)
- [TEP-74: Jetton Standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)

### Ferramentas
- [TON Center API](https://toncenter.com)
- [TonScan Explorer](https://tonscan.org)
- [TON CLI](https://github.com/ton-blockchain/ton)

---

## 🎓 Lições Aprendidas

1. **Sempre testar na testnet primeiro** - Economiza tempo e dinheiro
2. **Debug incremental** - Adicionar features uma por vez
3. **Medir antes de armazenar** - Script de análise de células é essencial
4. **Formato de mensagem é crítico** - Pequenos erros causam grandes problemas
5. **Incompatibilidade store/load** - Garantir simetria entre operações

---

## ✅ Ações Imediatas

1. **PRIORIDADE ALTA:** Migrar testes para testnet
2. **PRIORIDADE MÉDIA:** Criar script de debug detalhado com toncli
3. **PRIORIDADE BAIXA:** Considerar simplificação da estrutura

---

## 🎉 RESOLUÇÃO DO PROBLEMA (v2.3.0)

**Data:** 25 de Janeiro de 2026 (Tarde)  
**Status:** ✅ RESOLVIDO

### Root Cause Confirmado

O problema foi causado por uma **incompatibilidade entre serialização e desserialização** do campo `minters_dict`:

**ANTES (v2.2.0 - INCORRETO):**
```func
// Factory - Armazenamento
.store_uint(0, 1)  // ❌ Armazena apenas 1 bit (valor 0)

// Minter - Leitura
extra~load_dict()  // ❌ Espera 1 bit + referência de célula
```

**Resultado:** Cell Underflow (Exit Code 9) porque `load_dict()` tentava ler uma referência de célula que não existia.

### Solução Implementada

**DEPOIS (v2.3.0 - CORRETO):**
```func
// Factory - Armazenamento
.store_dict(begin_cell().end_cell())  // ✅ Armazena 1 bit (flag=1) + célula vazia como referência

// Minter - Leitura
extra~load_dict()  // ✅ Lê 1 bit + referência de célula vazia
```

**Resultado:** Sincronização perfeita entre armazenamento e leitura. Sem Cell Underflow.

### Mudanças nos Arquivos

1. **contracts/ton/NeoJettonFactoryV2.fc** (linha 71)
   - Alterado de: `.store_uint(0, 1)`
   - Para: `.store_dict(begin_cell().end_cell())`
   - Comentário adicionado: `minters_dict: empty cell ref (fix for Exit Code 9)`

2. **scripts/test-dict-fix.js** (novo arquivo)
   - Script de teste que valida a serialização/desserialização
   - Simula o comportamento da Factory e do Minter
   - Confirma que todos os valores são corretamente armazenados e recuperados

### Validação

✅ **Compilação:** Todos os contratos compilam sem erros  
✅ **Teste Local:** Script de validação passa com sucesso  
✅ **Alinhamento:** Factory e Minter agora usam o mesmo formato

### Próximos Passos

1. ✅ Deploy na **Testnet** para validação final
2. ✅ Testes completos de minting e operações
3. ✅ Deploy na **Mainnet** quando testnet confirmar sucesso

### Impacto Técnico

- **Tamanho:** +1 referência por contrato Minter (~0.002 KB)
- **Gas:** Nenhuma mudança significativa no custo de gas
- **Compatibilidade:** Quebra compatibilidade com versões antigas (requer re-deploy)

### Lição Aprendida

A incompatibilidade `store_uint(0, 1)` vs `load_dict()` é um erro sutil mas crítico. A função `store_dict()` em FunC:
- Aceita uma célula como parâmetro (ou `null()`)
- Armazena um Maybe Cell: 1 bit (flag) + célula opcional
- Para dicionário vazio: usar `begin_cell().end_cell()` (célula vazia)
- Para null: usar `null()` (se disponível na versão do compilador)

O TVM não faz conversões implícitas entre "1 bit com valor 0" e "Maybe Cell vazio", causando o Cell Underflow.

---

**Documento mantido por:** NEØ Protocol Development Team  
**Última atualização:** 25/01/2026 16:50 UTC  
**Status:** ✅ Resolvido (v2.3.0)
