# Debug Scripts - TON Factory

Scripts de debug e diagnóstico para a implementação TON Factory.

## Scripts Disponíveis

### `debug-all-factories.js`
Debug de todas as factories deployadas no testnet.

**Uso:**
```bash
node scripts/debug/debug-all-factories.js
```

**Funcionalidade:**
- Lista todas as factories conhecidas
- Verifica status de cada factory
- Mostra informações de storage
- Identifica problemas comuns

### `debug-jetton-address.js`
Debug de cálculo de endereço do Jetton Minter.

**Uso:**
```bash
node scripts/debug/debug-jetton-address.js
```

**Funcionalidade:**
- Calcula endereço esperado do Jetton Minter
- Compara com endereço on-chain
- Verifica StateInit
- Identifica divergências

### `dry-run-ton.js`
Simulação de deploy sem gastar TON.

**Uso:**
```bash
node scripts/debug/dry-run-ton.js
```

**Funcionalidade:**
- Simula compilação
- Calcula endereços
- Valida configurações
- Estima custos de gas

## Configuração

Certifique-se de ter as variáveis de ambiente configuradas:

```bash
# Copiar .env.ton.example para .env
cp .env.ton.example .env

# Editar com suas credenciais
# - MNEMONIC_TON (24 palavras)
# - TON_NETWORK (testnet/mainnet)
# - TON_CENTER_API_KEY (opcional)
```

## Troubleshooting

### Factory não cria Jetton Minter

**Sintomas:**
- Transaction confirmada
- Excess devolvido
- Jetton Minter não aparece na blockchain

**Debug:**
1. Execute `debug-all-factories.js` para ver status
2. Execute `debug-jetton-address.js` para verificar endereço esperado
3. Verifique logs da transaction no TonScan
4. Consulte `CHECKPOINT_TON_FACTORY_2026-01-25.md` no repositório `docs`

### Endereço calculado diverge

**Possíveis causas:**
- StateInit incorreto
- Código diferente do esperado
- Data structure incompatível

**Solução:**
Compare byte-por-byte com código oficial TON Minter.

## Referências

- **Documentação TON:** https://docs.ton.org
- **TON Minter Oficial:** https://github.com/ton-blockchain/minter-contract
- **TonScan Testnet:** https://testnet.tonscan.org

## Status Atual

⚠️ **BUG ATIVO:** Factory não está criando Jetton Minter (2026-01-25)

Ver documentação completa em: `neo-smart-token-factory/docs`
- `CHECKPOINT_TON_FACTORY_2026-01-25.md`
- `SESSAO_APRENDIZADO_TON_FACTORY.md`
- `PLANO_REORGANIZACAO.md`

## 📄 License

Documentation is licensed under CC BY 4.0 (Creative Commons). Smart contract code referenced here is licensed under MIT.
