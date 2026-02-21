# Relatório de Deploy - NΞØ Tact Factory (TON)

**Data:** 26 de Janeiro de 2026
**Status:** ✅ SUCESSO
**Rede:** TON Mainnet

## 📍 Detalhes do Contrato

*   **Contrato:** `NeoJettonFactory` (Versão Tact)
*   **Endereço:** `EQA5mLN4-9DqZet7s3JQiyzK3XTEOSzF4SYOdHALofVJ4y9M`
*   **Explorer:** [Tonscan Link](https://tonscan.org/address/EQA5mLN4-9DqZet7s3JQiyzK3XTEOSzF4SYOdHALofVJ4y9M)
*   **Owner (Administrador):** `EQBSi9T1-iPqrVvs8dDFIlOxQ7qZYTYFT4ocF7wK1syBeqSm`
*   **Treasury (Taxas):** `EQBSi9T1-iPqrVvs8dDFIlOxQ7qZYTYFT4ocF7wK1syBeqSm`

## 🛠️ Processo de Deploy

1.  **Compilação:** O contrato foi compilado usando `@tact-lang/compiler` v1.6.x.
2.  **Deploy Script:** Utilizado `scripts/deploy-ton-tact.ts` adaptado para enviar mensagem binária `Deploy` (evitando erro Exit 130).
3.  **Transação de Inicialização:**
    *   **Timestamp:** 26/01/2026, 03:18:37
    *   **Valor Enviado:** 0.5 TON
    *   **Custo Efetivo:** < 0.01 TON (0.497 TON reembolsados como excesso de gás)
    *   **Status da Transação:** Confirmada com Sucesso.

## ✅ Verificação Funcional

O script de verificação `scripts/verify-nsf-deployment.js` foi executado e confirmou:
*   [x] O contrato está ativo (`active`) na rede.
*   [x] O contrato responde aos *getters* padrão.
*   [x] O contrato recebeu a transação de inicialização corretamente.

## 📝 Verificação de Código Fonte (Source Code Verification)

*   **Arquivo de Verificação:** `contracts/ton/build/factory/factory_NeoJettonFactory.pkg`
*   **Status:** Pendente no `verifier.ton.org` (Erro 500 temporário no servidor de verificação).
*   **Hash de Código:** `tdecnJuasJKkgW6VaJxxK9QYACUJ8gg8CoDg9k4e/jc=` (Confirmado)
*   **Hash de Dados:** `ujrqIvbqcVpjk8zXWCPF7jcpdhZfAi13JCeC+vWqHZw=` (Confirmado)

---

## 🚀 Próximos Passos

1.  **Minting:** Utilizar a Factory para criar novos Tokens Jetton (Minter).
2.  **Frontend:** Integrar o endereço `EQA5mLN4...` na aplicação web para permitir criação de tokens pelos usuários.
