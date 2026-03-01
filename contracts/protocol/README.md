(The file `/workspaces/smart-core/contracts/protocol/README.md` exists, but is empty)
Protocol Contracts
==================

Resumo
-----

Este diretório contém os contratos principais do protocolo Neo, responsáveis por registro de attestations, governança de nós, emissão do NFT genesis e bootstrap de reputação.

Contratos
---------

- `NeoAttestationRegistry.sol` — Registro de attestations utilizado por módulos que precisam validar identidades/claims.
- `NeoGenesisNFT.sol` — NFT de gênese usado para representação inicial de propriedade/identidade.
- `NeoNodeAdmission.sol` — Lógica de admissão de nós (onboarding) e validações associadas.
- `NodeRegistry.sol` — Registro consolidado de nós da rede.
- `ReputationBootstrap.sol` — Mecanismos para bootstrapping de reputação inicial.

Notas de implantação
-------------------

- Verificar ordem de deploy: `NeoAttestationRegistry` normalmente precisa existir antes dos módulos que dependem de attestations.
- Conferir parâmetros de inicialização em `deployments/` correspondentes ao ambiente alvo.

Testes
------

Os testes relacionados estão em `test/` (ex.: `NeoAttestationRegistry.test.js`, `NeoGenesisNFT.test.js`). Execute a suíte com o `npm test` configurado no repositório.

Sugestões (conforme solicitado na issue)
-------------------------------------

1. Adicionar um diagrama simples mostrando como os contratos interagem (Attestation → NodeAdmission → NodeRegistry).
2. Documentar eventos críticos e funções administrativas (quem pode chamar, pré-condições, efeitos colaterais).
3. Incluir seção de compatibilidade com `NeoTokenV2` e integrações (ex.: referências a `attestation-registry-base.json`).
4. Fornecer um passo-a-passo de upgrade/rollback para contratos que possam ser atualizados.
5. Incluir comandos de verificação/monitoramento pós-deploy (etherscan, explorers ou scripts de checagem).

Rascunho de resposta para a issue (PT-BR)
----------------------------------------

Olá — confirmei a solicitação e adicionei sugestões iniciais ao `contracts/protocol/README.md` para documentar os contratos e os próximos passos.

- O que fiz: inclui resumo dos contratos, notas de deploy, recomendações de testes e uma lista de melhorias sugeridas.
- Próximos passos que proponho: 1) revisar as sugestões e indicar prioridades; 2) eu posso abrir um PR com o diagrama e documentação adicional; 3) atribuir revisores técnicos para validar os detalhes de implantação.

Quer que eu abra um PR com essas mudanças + diagrama, ou prefere que eu só gere o rascunho de PR/issue comentário para vocês revisarem primeiro?

— Obrigado
