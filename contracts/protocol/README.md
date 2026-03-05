# NΞØ Protocol — Contratos de Infraestrutura

> **Nexus entre o [`NEO_PROTOCOL`](https://github.com/NEO_PROTOCOL) e o `smart-core`**
> Estes contratos implementam a camada de identidade, admissão e reputação da rede NΞØ.
> São fornecidos via nexus pelo NEO_PROTOCOL e vivem aqui para composição com a Smart Factory.

---

## Visão Geral

O NEO_PROTOCOL define as regras de quem pode participar da rede NΞØ e como a confiança é estabelecida on-chain. Os contratos neste diretório implementam esse protocolo em Solidity, seguindo três princípios centrais:

1. **Eventos são a prova** — o histórico on-chain é imutável e permanente, mesmo que o contrato seja substituído.
2. **Computação off-chain, ancoragem on-chain** — decisões complexas (KYC, validação de entregas, cálculo de reputação) ocorrem off-chain; só o resultado final é registrado aqui.
3. **Storage minimalista** — cada contrato armazena apenas o essencial. A lógica de negócio fica nos eventos indexáveis.

---

## Arquitetura e Fluxo

```
┌─────────────────────────────────────────────────────┐
│                   NEO_PROTOCOL                       │
│  (regras, NHIP, MCP, Identity Graph off-chain)       │
└──────────────────────┬──────────────────────────────┘
                       │ nexus
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    contracts/protocol/                            │
│                                                                    │
│  ┌─────────────────────┐     ┌──────────────────────────────┐    │
│  │ NeoAttestationRegistry│──▶│ NeoGenesisNFT (Soulbound)    │    │
│  │ PoE on-chain         │    │ Valida PoE antes de mintar   │    │
│  └──────────┬──────────┘     └──────────────────────────────┘    │
│             │ prova de eventos                                     │
│  ┌──────────▼──────────┐     ┌──────────────────────────────┐    │
│  │ NeoNodeAdmission     │──▶│ NodeRegistry (NHIP-001)       │    │
│  │ State machine PoI/PoD│    │ Registro canônico de nós      │    │
│  └─────────────────────┘    └──────────────────────────────┘    │
│                                        │                          │
│                             ┌──────────▼──────────┐              │
│                             │ ReputationBootstrap   │              │
│                             │ Deltas validados      │              │
│                             └─────────────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Contratos

### `NeoAttestationRegistry.sol`

**Registro imutável de Proof of Existence (PoE)**

Fundação do protocolo. Qualquer evento relevante — lançamento de produto, decisão de governança, milestone de um nó — pode ser ancorado on-chain como um hash `keccak256` calculado off-chain.

| Campo | Descrição |
|-------|-----------|
| `guardian` | Único endereço com poder de gerenciar attesters e transferir controle |
| `isAttester[addr]` | Whitelist de quem pode registrar provas |
| `_attestations[hash]` | `contentHash`, `attester`, `timestamp`, `metadata`, `revoked` |

**Funções principais:**
- `registerAttestation(bytes32 contentHash, string metadata)` — registra prova; não sobrescreve existentes
- `revokeAttestation(bytes32 contentHash)` — marca como revogada (dado nunca deletado)
- `verifyAttestation(bytes32 contentHash)` — nunca reverte; seguro para chamadas externas
- `addAttester` / `removeAttester` — gestão da whitelist (somente guardian)

> **Usado por:** `NeoGenesisNFT` valida o `poeHash` neste contrato antes de mintar.

---

### `NeoNodeAdmission.sol`

**State machine de onboarding de nós (pré-NodeRegistry)**

Implementa o processo de admissão descrito no NEO_PROTOCOL. Um nó não nasce reconhecido — ele passa por um ciclo de convite, aceitação, entrega e validação.

**Estados:**
```
NONE → INVITED → ACCEPTED → SUBMITTED → VALIDATED
                    └──────────────────→ EXPIRED
```

| Transição | Quem chama | O que registra |
|-----------|-----------|----------------|
| `NONE → INVITED` | `architect` via `inviteNode()` | `nodeType`, `scope`, `proofOfIntent`, `deadline` |
| `INVITED → ACCEPTED` | O próprio candidato via `acceptMission()` | `acceptedAt` |
| `ACCEPTED → SUBMITTED` | O próprio candidato via `submitMission()` | `proofOfDelivery` (hash Notion/IPFS/GitHub) |
| `SUBMITTED → VALIDATED` | `architect` via `validateMission()` | evento `NodeValidated` |
| `INVITED/ACCEPTED → EXPIRED` | Qualquer um via `expireMission()` após deadline | evento `NodeExpired` |

**Tipos de nó suportados:** `"Designer"`, `"Research"`, `"Systems"`, `"Governance"` (string livre)

> **Após validação:** o `architect` registra o nó no `NodeRegistry`.

---

### `NodeRegistry.sol` — NHIP-001

**Registro canônico de nós reconhecidos pelo protocolo**

Contrato minimalista. A validação ocorre off-chain (NHIP-000 + MCP); este contrato apenas persiste o estado final de forma auditável.

| Campo | Descrição |
|-------|-----------|
| `guardian` | Controla registro e desativação |
| `nodes[addr]` | `nodeAddress`, `domain`, `registeredAt`, `active` |

**Funções:**
- `registerNode(address, string domain)` — adiciona nó reconhecido
- `deactivateNode(address)` — desativa (não apaga histórico)
- `isRegistered(address)` — verificação simples para contratos externos
- `getNode(address)` — retorna struct completo

---

### `NeoGenesisNFT.sol`

**Soulbound NFT ERC-721 + ERC-5192 representando o gênese de um projeto**

Cada projeto incubado ou originado pela NΞØ SMART FACTORY recebe um único Genesis NFT. É intransferível, mintado uma única vez para `nsfactory.eth`, e **não pode existir sem uma attestation válida e não revogada** no `NeoAttestationRegistry`.

**Garantias:**
- `mint()` valida o `poeHash` no `NeoAttestationRegistry` antes de mintar — se o PoE não existir ou for revogado, reverte
- `locked(tokenId)` sempre retorna `true` (ERC-5192)
- `_update()` bloqueia qualquer transferência após o mint (`SoulboundTransferNotAllowed`)
- Deploy único por projeto — token ID é sempre `0`

**Deploy:**
```solidity
new NeoGenesisNFT(
    "FlowPay-Core",          // projectName
    "FLOWGEN",               // symbol
    poeHash,                 // keccak256 registrado no AttestationRegistry
    address(attestationReg), // NeoAttestationRegistry deployado
    "ipfs://Qm...",          // metadata URI
    nsfactoryEthAddress      // owner (nsfactory.eth)
)
```

---

### `ReputationBootstrap.sol`

**Store minimalista de reputação on-chain**

A reputação não emerge de interações on-chain diretas — ela é calculada off-chain (Identity Graph, avaliações, peer reviews) e apenas ancorada aqui como deltas validados pelo `architect`.

| Campo | Descrição |
|-------|-----------|
| `architect` | Único endereço autorizado a submeter deltas |
| `reputation[addr]` | `int256` — pode ser negativo |

**Função principal:**
```solidity
updateReputation(address _node, int256 _delta, bytes32 _source)
// _source: ex. keccak256("NodeDesignerReview"), keccak256("MissionValidated")
```

> O `_source` conecta cada delta a um evento auditável — rastreabilidade completa sem armazenar o histórico inteiro on-chain.

---

## Ordem de Deploy

```
1. NeoAttestationRegistry(_guardian)
2. NodeRegistry(_guardian)
3. NeoNodeAdmission()                          # architect = msg.sender
4. ReputationBootstrap()                        # architect = msg.sender
5. NeoGenesisNFT(..., address(registry), ...)  # depende do AttestationRegistry
```

> `NeoAttestationRegistry` deve estar deployado antes de qualquer `NeoGenesisNFT`.

---

## Identidades de Controle

| Role | Contrato | Responsabilidade |
|------|---------|-----------------|
| `guardian` | `NeoAttestationRegistry`, `NodeRegistry` | Gerencia attesters/nós; pode transferir controle |
| `architect` | `NeoNodeAdmission`, `ReputationBootstrap` | Convida nós, valida missões, submete deltas de reputação |
| `owner` | `NeoGenesisNFT` | Minta o NFT genesis; atualiza URI |

---

## Conexão com a Smart Factory

Os contratos deste diretório são consumidos pelos módulos da Smart Factory via interfaces mínimas:

```solidity
// Verificação de PoE antes de operações críticas
INeoAttestationRegistry(registry).verifyAttestation(hash);

// Verificação se um endereço é nó reconhecido
INodeRegistry(registry).isRegistered(addr);
```

A Smart Factory **não gerencia** o ciclo de vida dos nós nem calcula reputação — ela apenas consulta o estado que o NEO_PROTOCOL mantém nestes contratos.

---

## Testes

```bash
npx hardhat test test/NeoAttestationRegistry.test.js
npx hardhat test test/NeoGenesisNFT.test.js
```

> `NeoNodeAdmission`, `NodeRegistry` e `ReputationBootstrap` têm cobertura via testes de integração no NEO_PROTOCOL.
