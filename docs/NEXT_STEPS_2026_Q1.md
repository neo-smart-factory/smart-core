# 🧭 NΞØ SMART FACTORY — Next Steps Roadmap

> **Atualizado:** 21 de Fevereiro de 2026  
> **Versão:** v0.5.3-neural-core  
> **Branch:** `main` (commit `322a8f8` → pushed)  
> **Autor:** NODE NEØ

---

## 📊 Status de Sincronização (21/02/2026)

| Check | Status |
|-------|--------|
| **Branch local vs origin/main** | ✅ Sincronizado (commit `322a8f8`) |
| **Mudanças locais não comitadas** | ✅ Nenhuma |
| **Commits locais não enviados** | ✅ Zero — tudo pushed |
| **Commits remotos pendentes** | ✅ Zero — tudo pulled |
| **PRs Dependabot abertos** | ⚠️ 2 restantes (hardhat 3.x, test-utils 0.12) |
| **72 contratos EVM** | ✅ Compilados com sucesso |

### PRs Dependabot Pendentes

| Branch | Atualização | Status |
|--------|-------------|--------|
| `dependabot/npm_and_yarn/dotenv-17.2.4` | dotenv 16.6.1 → 17.2.4 | ✅ Merged |
| `dependabot/npm_and_yarn/hardhat-3.1.7` | hardhat 2.22 → 3.1.7 ⚠️ **Major** | ⛔ Não mergear (rewrite ESM) |
| `dependabot/npm_and_yarn/ton/test-utils-0.12.0` | @ton/test-utils 0.4.2 → 0.12.0 ⚠️ **Major** | 🟡 Avaliar na Fase 1 |
| `dependabot/npm_and_yarn/ton/ton-16.2.2` | @ton/ton 16.1.0 → 16.2.2 | ✅ Merged |
| `dependabot/npm_and_yarn/types/node-25.2.1` | @types/node 25.0.10 → 25.2.1 | ✅ Merged |

> ⚠️ **Hardhat 3.x** é uma major version. Requer validação antes do merge.
> ⚠️ **@ton/test-utils 0.12.0** é um salto grande (0.4.2 → 0.12.0). Testar compatibilidade.

### Branches Legadas (Cleanup Sugerido)

- ~~`origin/copilot/analyze-nsf-implementation`~~ — ✅ Deletada
- `origin/copilot/implement-complete-contracts` — 🟡 Manter (tem NSFGovernance Layer 3)
- ~~`origin/copilot/sub-pr-1`~~ — ✅ Deletada
- ~~`origin/copilot/update-readme-smart-core`~~ — ✅ Deletada
- ~~`origin/feat/ton-factory-v2`~~ — ✅ Deletada (já em main)

---

## ✅ O Que Já Foi Conquistado

### Contratos Deployados em Produção

| Ativo | Rede | Endereço | Data |
|-------|------|----------|------|
| **NEOFLW Token** | Base Mainnet | `0xF4Fbd30e3Ea69457adD30F7C3D6fde25f7D8Db26` | 20/01/2026 |
| **NEOFLW Token** | TON Mainnet | `EQAPngkZmIa1jbtQZJ9NSPZ-3sh3PnD8bp5cvxNeAEeEBTfl` | 31/01/2026 |
| **Jetton Factory** | TON Mainnet | `EQA5mLN4-9DqZet7s3JQiyzK3XTEOSzF4SYOdHALofVJ4y9M` | 31/01/2026 |

### Infraestrutura Operacional

- ✅ Nexus Ingress Adapter (HMAC-SHA256) — comunicação Smart Factory ↔ Nexus
- ✅ MIO Logic Vault — assinaturas de segurança em deploys
- ✅ Railway config + Node 22 forçado
- ✅ GitHub Workflows template aplicado
- ✅ Jest 30 + ts-jest compatibilidade resolvida
- ✅ Exit Code 9 (Cell Underflow) corrigido no TON Factory v2

### Documentação Completa

- ✅ PROTOCOL_EVOLUTION_2026.md — Visão arquitetural
- ✅ NSF_IMPLEMENTATION_SUMMARY.md — NSF Token production-ready
- ✅ NEXUS_INTEGRATION_GUIDE.md — Protocolo Factory ↔ Nexus
- ✅ MAINNET_LAUNCH_PLAN.md — Checklist de mainnet TON
- ✅ TESTNET_TEST_PLAN.md — Plano de testes (pendente execução)
- ✅ NSF_REGULATORY_COMPLIANCE_BR.md — Compliance CVM/SEC/MiCA
- ✅ DEPLOY_V2.md — Guia de deploy NeoTokenV2

---

## 🎯 Next Steps — Roadmap Ordenado

### Fase 0: Housekeeping (1 sessão)

> Limpar a casa antes de avançar.

- [x] **0.1** Avaliar e mergear PRs Dependabot seguros:
  - ✅ `dotenv-17.2.4` — compatível, merged
  - ✅ `@ton/ton-16.2.2` — patch seguro, merged
  - ✅ `@types/node-25.2.1` — patch seguro, merged
- [x] **0.2** Avaliar PRs Dependabot com breaking changes:
  - ⛔ `hardhat-3.1.7` — major rewrite (ESM), NÃO mergear
  - 🟡 `@ton/test-utils-0.12.0` — avaliar na Fase 1 (testes TON)
- [x] **0.3** Cleanup de branches obsoletas:
  - ✅ Deletadas 3 branches remotas (`copilot/update-readme`, `copilot/analyze-nsf`, `copilot/sub-pr-1`)
  - ✅ Deletadas 3 branches locais
  - 🟡 `copilot/implement-complete-contracts` mantida (NSFGovernance)
- [x] **0.4** Configurar lint real no Makefile:
  - ✅ `solhint` instalado + `.solhint.json` configurado
  - ✅ `eslint` v9 flat config instalado + `eslint.config.mjs`
  - ✅ `make lint` / `make lint-sol` / `make lint-js` operacionais
  - ✅ `make analyze` — pre-compilation code analysis (`scripts/code-analysis.js`)
- [x] **0.5** Extras realizados:
  - ✅ Fix `.npmrc` cache path (caminho antigo `/CODIGOS/` → relativo)
  - ✅ Fix 4 erros de compilação (stray quote, NatSpec tag, param shadow)
  - ✅ `.gitignore` atualizado (.npm-cache, .DS_Store, .tmp)
  - ✅ Reorganização completa da pasta `scripts/` (47 scripts → 7 categorias)
  - ✅ 72 contratos EVM compilados com sucesso

---

### Fase 1: Validação TON (1-2 sessões)

> Fechar o ciclo de testes pendente no `TESTNET_TEST_PLAN.md`.

- [ ] **1.1** Obter fundos de testnet TON (faucet)
- [ ] **1.2** Executar Fase 2: Deploy da Factory v2.3.0 na testnet
  ```bash
  node scripts/deploy/deploy-ton-factory-v2.js --network testnet
  ```
- [ ] **1.3** Executar Fase 3: Deploy de token de teste via Factory
  ```bash
  node scripts/deploy/deploy-nsf-token.js
  ```
- [ ] **1.4** Executar Fase 4: Operações de Mint (mint, transfer, burn)
  ```bash
  node scripts/ton/test-mint.js
  ```
- [ ] **1.5** Executar Fase 5: Stress tests (múltiplos tokens, gas costs)
- [ ] **1.6** Preencher `TESTNET_TEST_PLAN.md` com resultados e lições

---

### Fase 2: Bridge Cross-Chain (2-3 sessões)

> Conectar NEOFLW entre Base e TON.

- [ ] **2.1** Revisar e auditar `contracts/bridge/ManualBridge.sol`
- [ ] **2.2** Revisar e auditar `contracts/bridge/BridgeValidator.sol`
- [ ] **2.3** Implementar testes unitários para o bridge
- [ ] **2.4** Deploy do Bridge contract na Base testnet (Sepolia)
- [ ] **2.5** Configurar `setBridgeMinter()` no NEOFLW (Base)
- [ ] **2.6** Testar relay flow completo:
  - Base → sign-proof → relay → TON mint
  - TON → burn → relay → Base unlock
- [ ] **2.7** Documentar o fluxo em `docs/BRIDGE_OPERATIONS.md`

---

### Fase 3: Governance On-Chain (3-4 sessões)

> Ativar a camada de admissão e reputação do protocolo.

- [ ] **3.1** Revisar `contracts/protocol/NeoNodeAdmission.sol`
- [ ] **3.2** Revisar `contracts/protocol/NodeRegistry.sol`
- [ ] **3.3** Revisar `contracts/protocol/ReputationBootstrap.sol`
- [ ] **3.4** Implementar testes unitários completos
- [ ] **3.5** Deploy na Base Sepolia testnet
- [ ] **3.6** Integrar com Nexus (evento `NODE_ADMITTED`)
- [ ] **3.7** Documentar arquitetura de governança

---

### Fase 4: Smart Factory UI (4-5 sessões)

> Interface visual para criação de tokens.

- [ ] **4.1** Scaffold do projeto `smart-ui` com Vite + React
- [ ] **4.2** Integrar Dynamic Labs SDK para wallet connection
- [ ] **4.3** Interface de criação de token (ERC20/ERC721/Jetton)
- [ ] **4.4** Dashboard de contratos deployados
- [ ] **4.5** Monitor de transações e eventos Nexus
- [ ] **4.6** Deploy em Vercel com domínio custom

---

### Fase 5: NSF Token — Caminho para Mainnet (Ongoing)

> Processo de longo prazo para o token de coordenação.

- [ ] **5.1** Solicitar quotes de auditoria:
  - Trail of Bits ou ConsenSys Diligence
  - OpenZeppelin Security
  - Firma independente terceira
- [ ] **5.2** Comissionar Formal Verification (Certora/Runtime Verification)
- [ ] **5.3** Identificar 7 guardians para o EmergencyGuardian
- [ ] **5.4** Configurar bug bounty no Immunefi ($500k pool)
- [ ] **5.5** Obter legal opinions (Brasil CVM, US SEC, EU MiCA)
- [ ] **5.6** Deploy na testnet para beta de qualificação (30 dias)
- [ ] **5.7** Deploy em Mainnet após aprovação total

---

### Fase 6: FlowPay Core Integration (3-4 sessões)

> Engine de pagamentos PIX ↔ Crypto conectado ao Nexus.

- [ ] **6.1** Implementar engine Fastify (porta 5050)
- [ ] **6.2** Webhook receiver para providers PIX (Woovi, Efí, MP, Stark)
- [ ] **6.3** Unlock Receipts com HMAC-SHA256
- [ ] **6.4** Integração com Nexus: evento `FLOWPAY:PAYMENT_CONFIRMED`
- [ ] **6.5** Deploy no Railway com healthcheck
- [ ] **6.6** Testes end-to-end do flow: PIX → FlowPay → Nexus → Smart Factory → Mint

---

## 📋 REMINDERS Pendentes (de REMINDERS.md)

- [ ] Registrar marca **NΞØ SMART FACTORY**
- [ ] Migrar docs técnicos do Notion HUB → `smart-core/docs/`
- [ ] Sweep de links `kauntdewn1` em projetos clonados
- [ ] Verificar git remotes do WOD X PRO

---

## 🗓️ Timeline Sugerida

```
Semana 1 (22-28 Fev)     → Fase 0: Housekeeping + Dependabot
Semana 2-3 (Mar 1-14)    → Fase 1: Validação TON completa
Semana 4-5 (Mar 15-28)   → Fase 2: Bridge Cross-Chain
Semana 6-8 (Abr 1-18)    → Fase 3: Governance On-Chain
Semana 9-12 (Abr-Mai)    → Fase 4: Smart Factory UI
Ongoing (Fev-Jun)         → Fase 5: NSF Audit Process
Semana 10-13 (Mai)        → Fase 6: FlowPay Core
```

---

## 🏛️ Princípios Guia

1. **Segurança primeiro** — Nenhum deploy sem testes e validação
2. **Documentação acompanha código** — Todo avanço gera doc
3. **Conventional Commits** — Sempre `feat:`, `fix:`, `docs:`, etc
4. **Soberania** — Zero dependência de terceiros para infra crítica
5. **Auditabilidade** — Todo artefato deve ter prova criptográfica

---

**NODE NEØ**
*Core Architect · NΞØ Protocol*
*neo@neoprotocol.space*

*"Expand until silence becomes structure."*
