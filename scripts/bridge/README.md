# Manual Bridge System — Package

Dependências para os scripts de bridge.

## Instalação

```bash
npm install
```

## Scripts Disponíveis

### Monitor
Monitora eventos de lock e gera provas assinadas.

```bash
node monitor.js
```

### Sign Proof
Assina provas com múltiplos signers.

```bash
# Assinar prova
node sign-proof.js sign <proof-file> <private-key>

# Verificar assinatura
node sign-proof.js verify <bridge-id> <signature>
```

### Relay
Submete provas para a chain de destino.

```bash
# Processar todas as provas
node relay.js all

# Processar prova específica
node relay.js single <bridge-id>
```

## Configuração

Crie um arquivo `.env` com:

```env
# RPCs
POLYGON_RPC=https://polygon-rpc.com
BASE_RPC=https://mainnet.base.org

# Endereços dos bridges
POLYGON_BRIDGE_ADDRESS=0x...
BASE_BRIDGE_ADDRESS=0x...

# Chaves privadas (signers)
BRIDGE_SIGNER_KEY=0x...
BRIDGE_SIGNER_KEY_2=0x...
BRIDGE_SIGNER_KEY_3=0x...

# Chave do relayer
BRIDGE_RELAYER_KEY=0x...
```

## Automação

### Cron Job (Relay Automático)

```bash
# Editar crontab
crontab -e

# Adicionar linha (relay a cada 5 minutos)
*/5 * * * * cd /path/to/smart-core/scripts/bridge && node relay.js all >> /var/log/bridge-relay.log 2>&1
```

### PM2 (Monitor Contínuo)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar monitor
pm2 start monitor.js --name bridge-monitor

# Salvar configuração
pm2 save

# Auto-start no boot
pm2 startup
```

## 📄 License

Documentation is licensed under CC BY 4.0 (Creative Commons). Smart contract code referenced here is licensed under MIT.
