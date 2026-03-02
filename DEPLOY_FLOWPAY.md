# DEPLOY FLOWPAY (NEOPAY) - BASE MAINNET

Runbook objetivo para deploy, hardening inicial e transição para Safe no contrato `FlowPay`.

## 1) Pré-requisitos

- `smart-core/.env` com:
  - `BASE_RPC`
  - `PRIVATE_KEY` (wallet temporária de deploy)
  - `BASESCAN_KEY`
  - `FLOWPAY_INITIAL_OWNER` (opcional; default = signer de deploy)
- `flowpay/.env` preparado com:
  - `QUICKNODE_BASE_RPC` ou `QUICKNODE_BASE_RPC_URL`
  - `PROOF_CONTRACT_ADDRESS` (após deploy)
  - `BLOCKCHAIN_WRITER_ADDRESS`
  - `BLOCKCHAIN_WRITER_PRIVATE_KEY`
  - `NEXUS_SECRET`
  - `NEXUS_WEBHOOK_URL`

## 2) Deploy

```bash
cd /Users/nettomello/neomello/neo-smart-factory/smart-core
npm run deploy:flowpay:base
```

Saída esperada:

- endereço do contrato
- arquivo `deployments/flowpay-base.json`

## 3) Verificação no BaseScan

```bash
npm run verify:flowpay:base -- <FLOWPAY_CONTRACT_ADDRESS> <FLOWPAY_INITIAL_OWNER>
```

## 4) Bootstrap de segurança (writers/reward/guardian/safe)

Defina no `.env` do `smart-core`:

```bash
FLOWPAY_CONTRACT_ADDRESS=0x...
FLOWPAY_NEW_WRITER=0x...               # wallet operacional do FlowPay
FLOWPAY_NEW_SECOND_WRITER=0x...        # writer secundario (opcional)
FLOWPAY_EXTRA_WRITERS=0x...,0x...      # lista CSV opcional
FLOWPAY_OLD_WRITER=0x...               # wallet antiga (opcional)
FLOWPAY_DISABLE_OWNER_WRITER=true
FLOWPAY_REWARD_AMOUNT=25               # opcional (token units)
FLOWPAY_REWARD_ENABLED=false           # true/false
FLOWPAY_GUARDIAN=0x...                 # opcional
FLOWPAY_SAFE_OWNER=0x...               # opcional (Safe 2/3)
```

Execute:

```bash
npm run bootstrap:flowpay:base
```

O script executa, nessa ordem:

1. autoriza todos os writers alvo (`FLOWPAY_NEW_WRITER`, `FLOWPAY_NEW_SECOND_WRITER`, `FLOWPAY_EXTRA_WRITERS`)
2. remove `owner` da whitelist de writer (se habilitado)
3. remove `FLOWPAY_OLD_WRITER` (se informado)
4. configura reward
5. ajusta guardian
6. inicia `transferOwnership` para o Safe (se informado)

## 5) Aceite da ownership no Safe

Se `FLOWPAY_SAFE_OWNER` foi definido, finalize no Safe com:

- `acceptOwnership()`

Até isso acontecer:

- `owner` antigo ainda controla o contrato
- `pendingOwner` já aponta para o Safe

## 6) Cutover no FlowPay

No `.env` do `flowpay`:

```bash
PROOF_CONTRACT_ADDRESS=0x...           # endereço final do contrato FlowPay
BLOCKCHAIN_WRITER_ADDRESS=0x...        # nova wallet operacional
BLOCKCHAIN_WRITER_PRIVATE_KEY=0x...
```

Teste de fumaça:

```bash
cd /Users/nettomello/neomello/flowpay
node scripts/trigger-onchain-proof.mjs
```

## 7) Regras operacionais

1. `owner` deve ser Safe (2/3) para ações de governança.
2. `writer` é wallet hot operacional, sem poder de governança.
3. Nunca reutilizar wallet antiga de deploy como writer após cutover.
