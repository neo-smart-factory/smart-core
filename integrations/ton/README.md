# NΞØ Protocol - TON Integration

Este diretório contém os adaptadores e contratos para integração com a blockchain **TON (The Open Network)**.

## Arquitetura: NeoJettonV1

O `NeoJettonV1` é a adaptação do padrão `NeoTokenV2` para a arquitetura assíncrona baseada em atores da TON.

### Estrutura

- `useJettonFactory.js`: Hook (Vue/Composables) para realizar o deploy de novos Jettons através do contrato Factory. Implementa a construção rigorosa de metadados TEP-64 on-chain.

### Dependências

Para utilizar os scripts de integração, é necessário instalar as dependências do SDK da TON:

```bash
npm install @ton/ton @ton/core @ton/crypto
```

### Notas de Implementação

1. **TEP-64 (Token Data Standard)**: A implementação `useJettonFactory` constrói metadados on-chain utilizando dicionários (`HashmapE`) prefixados com `0x00`, garantindo compatibilidade com wallets como Tonkeeper e explorers.
2. **Factory Contract**: O endereço `JETTON_DEPLOYER_ADDRESS` no arquivo `useJettonFactory.js` deve ser atualizado com o endereço real do contrato Factory após o deploy na mainnet/testnet.
