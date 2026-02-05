# ⚡ NΞØ PROTOCOL: NEXUS AGENT & FACTORY INTEGRATION

**Versão:** 1.0.5  
**Data:** 04 de Fevereiro de 2026  
**Status:** ✅ OPERACIONAL NA MAINNET  
**Selo de Segurança:** HMAC-SHA256 VAULTED

---

## 🏗️ Visão Geral
Este documento define as diretrizes técnicas para a integração soberana entre o **NΞØ Smart Factory** e o **Nexus Core**. Esta conexão permite que o protocolo execute ordens de Minting e Deployment de forma autônoma, reagindo a eventos de pagamento e governança em tempo real.

---

## 🔒 Protocolo de Autenticação (Nexus Shield)
Toda comunicação entre o Nexus e a Factory é protegida por uma camada de assinatura criptográfica.

*   **Algoritmo:** HMAC-SHA256
*   **Header Obrigatório:** `X-Nexus-Signature`
*   **Segredo de Estado:** `NEXUS_SECRET` (definido no `.env`)

### Verificação de Assinatura (Pseudocódigo):
```javascript
const signature = crypto.createHmac('sha256', SECRET)
                        .update(JSON.stringify(payload))
                        .digest('hex');
```

---

## 🔌 Configuração do Ambiente (.env)
Para que o Ingress Adapter funcione, as seguintes variáveis devem estar presentes no Node:

```env
NEXUS_SECRET="vossa_chave_secreta"
NEXUS_WEBHOOK_URL="https://nsfactory.xyz/api/webhooks/factory"
NEXUS_INGRESS_PORT=5050
```

---

## 📥 Fluxo de Ingress (MINT_REQUESTED)
O Smart Factory escuta na porta `5050` por ordens vindas do Nexus.

### Payload Esperado:
```json
{
  "id": "evt_unique_id",
  "event": "MINT_REQUESTED",
  "data": {
    "symbol": "TICKER",
    "maxSupply": "1000000",
    "ownerAddress": "TON_OR_EVM_ADDRESS",
    "network": "ton" 
  }
}
```

---

## 📤 Fluxo de Callback (Webhook)
Após o processamento da transação na blockchain (TON ou BASE), a Factory notifica o Nexus de volta com o status do artefato.

**Endpoint de Retorno:** `POST https://nsfactory.xyz/api/webhooks/factory`

### Resposta de Sucesso:
```json
{
  "eventId": "original_evt_id",
  "contractAddress": "0x... ou EQ...",
  "status": "deployed",
  "metadata": {
    "network": "TON",
    "txHash": "0x..."
  }
}
```

---

## 🚀 Comandos de Execução

| Ação | Comando |
| :--- | :--- |
| **Iniciar Ingress** | `npm run nexus:start` |
| **Testar Autenticação** | `node scripts/test-nexus-ingress.js` |
| **Auditoria de Vault** | `npm run security:check` |

---

## 📜 Diretriz para Agentes (System Prompt Addition)
> "Você é um agente da NΞØ Smart Factory. Ao receber uma ordem do Nexus, sua prioridade é validar a assinatura HMAC. Se a assinatura for válida e o evento for MINT_REQUESTED, dispare o processo de deploy deterministicamente e aguarde o pulso da rede para executar o callback de confirmação."

---
**NΞØ MELLØ**  
*Core Architect · NΞØ Protocol*  
*"Lógica é o cofre. Autonomia é a liberdade."*
