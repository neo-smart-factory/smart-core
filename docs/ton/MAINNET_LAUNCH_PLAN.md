# 🚀 NΞØ Neural Core — Plano de Lançamento Mainnet

Este documento estabelece o protocolo de segurança e a sequência de execução para a migração da arquitetura v0.5.3 (Tact) para a rede principal (Mainnet) da TON.

---

## 🛡️ 1. Governança e Custódia (Obrigatório)

O erro identificado na wallet `UQBq...` (no `.env` atual) exige uma redefinição imediata da custódia antes do deploy.

### 🔑 Configuração de Wallets

1.  **Deployer Wallet (Hot Wallet):** Wallet temporária com apenas o saldo necessário para o deploy (~5-10 TON). 
    - *Ação:* O usuário deve atualizar o `.env` com uma mnemonic própria.
2.  **Guardian/Admin (Cold/Multi-sig):** Endereço que terá poder de `pause/unpause`.
    - *Ação:* Deve ser um endereço controlado pelo usuário (Tonkeeper/Hardware Wallet).
3.  **Protocol Treasury:** Endereço que receberá os 5% de taxa de `withdraw`.
    - *Ação:* Deve ser o endereço oficial de tesouraria do projeto.

---

## 🛠️ 2. Ciclo de Retificação de Código

Antes de gerar os artefatos finais para Mainnet, o código deve ser "limpo" de endereços de teste.

### 📍 Pontos de Atualização

- **`contracts/ton/tact/constants.tact`**:
    - Alterar `PROTOCOL_TREASURY` para o endereço real.
- **`contracts/ton/tact/JettonFactory.tact`**:
    - Garantir que o `owner` inicial seja passado via construtor ou inicializado corretamente.
- **`integrations/ton/useJettonFactory.js`**:
    - Atualizar a constante `JETTON_DEPLOYER_ADDRESS` após o deploy oficial.

---

## 🚦 3. Sequência de Execução (The Gauntlet)

### Passo 1: Limpeza e Setup
```bash
# Limpar build anterior
rm -rf build/
# Atualizar .env com credenciais REAIS do usuário
```

### Passo 2: Compilação "Mainnet-Ready"
```bash
npm run compile:ton
# Verificar logs de tamanho de célula e limites da TVM
```

### Passo 3: Deploy em Testnet (Ensaio Geral)
```bash
# Usar a wallet REAL do usuário para testar permissões
node scripts/deploy-ton-factory-v2.js --network testnet
```

### Passo 4: Deploy em Mainnet (Genesis)
```bash
# Apenas após validação total na Testnet
node scripts/deploy-ton-factory-v2.js --network mainnet
```

---

## 📝 4. Checklist de Pós-Deploy

- [ ] Verificar se o contrato Factory está "Bounceable".
- [ ] Testar a função `Pause()` do Guardian na rede real.
- [ ] Validar a visualização de metadados no TonScan.
- [ ] Atualizar o Frontend (Smart UI) com os novos endereços.

---

## ⚖️ Conformidade Legal

Este plano segue a normativa de autoria de **Eurycles Ramos Neto / NODE NEØ**. Qualquer deploy realizado sem o controle das chaves privadas por parte do autor invalida a segurança operacional do protocolo.

---
**v0.5.3-neural-core — NEØ PROTOCOL**  
*Expand until silence becomes structure.*
