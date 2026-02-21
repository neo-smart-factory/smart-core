# NΞØ SMART FACTORY — Neural Core V2
# Makefile estratégico: EVM (Base/Polygon) + TON (Tact)
# v0.5.3-neural-core

.PHONY: help install deps \
	compile compile-evm compile-ton \
	test test-evm test-ton \
	deploy-evm-base deploy-evm-polygon deploy-ton-factory deploy-ton-neoflw \
	verify-base verify-polygon \
	ton-balance ton-wallet ton-jetton-addr \
	clean lint lint-sol lint-js analyze

NODE := node
NPM := npm
NPX := npx

# --- Default: ajuda ---
help:
	@echo ""
	@echo "  NΞØ SMART FACTORY — Makefile"
	@echo "  ==========================="
	@echo ""
	@echo "  Setup"
	@echo "  -----"
	@echo "  make install        Instala dependências (npm install)"
	@echo "  make deps           Alias para install"
	@echo ""
	@echo "  Compilação"
	@echo "  ----------"
	@echo "  make compile       Compila EVM + TON"
	@echo "  make compile-evm   Compila contratos Solidity (Hardhat)"
	@echo "  make compile-ton  Compila contratos Tact (Jetton Factory)"
	@echo ""
	@echo "  Testes"
	@echo "  ------"
	@echo "  make test          Roda testes EVM + TON"
	@echo "  make test-evm      Testes Hardhat (Solidity)"
	@echo "  make test-ton      Testes Jest (TON/Sandbox)"
	@echo ""
	@echo "  Deploy EVM"
	@echo "  ----------"
	@echo "  make deploy-evm-base     Deploy NeoTokenV2/Factory na Base"
	@echo "  make deploy-evm-polygon  Deploy na Polygon"
	@echo ""
	@echo "  Deploy TON"
	@echo "  ----------"
	@echo "  make deploy-ton-factory  Deploy Jetton Factory (Tact) na rede TON"
	@echo "  make deploy-ton-neoflw   Deploy NeoFlw Jetton via Factory (TON)"
	@echo ""
	@echo "  Verificação (EVM)"
	@echo "  -----------------"
	@echo "  make verify-base     Verifica contrato na Base (BASESCAN_KEY)"
	@echo "  make verify-polygon  Verifica na Polygon (POLYGONSCAN_KEY)"
	@echo ""
	@echo "  Utilitários TON"
	@echo "  ---------------"
	@echo "  make ton-balance    Checa saldo TON (script check-ton-balance)"
	@echo "  make ton-wallet    Mostra wallet (show-wallet)"
	@echo "  make ton-jetton-addr  Calcula endereço Jetton (calculate-jetton-address)"
	@echo ""
	@echo "  Manutenção"
	@echo "  ----------"
	@echo "  make clean   Limpa artefatos de build (EVM cache, TON build)"
	@echo "  make lint   (reservado para lint futuro)"
	@echo ""

# --- Setup ---
install deps:
	$(NPM) install

# --- Compilação ---
compile: compile-evm compile-ton

compile-evm:
	$(NPX) hardhat compile

compile-ton:
	$(NPX) tact --config tact.config.json

# --- Testes ---
test: test-evm test-ton

test-evm:
	$(NPX) hardhat test

test-ton:
	$(NPM) run test:ton

# --- Deploy EVM ---
deploy-evm-base:
	$(NPX) hardhat run scripts/deployV2.js --network base

deploy-evm-polygon:
	$(NPX) hardhat run scripts/deployV2.js --network polygon

# --- Deploy TON ---
deploy-ton-factory:
	$(NODE) scripts/deploy-ton-factory-v2.js

deploy-ton-neoflw:
	$(NODE) scripts/deploy-neoflw-ton.js

# --- Verificação (Etherscan/Basescan) ---
verify-base:
	$(NPX) hardhat verify --network base

verify-polygon:
	$(NPX) hardhat verify --network polygon

# --- Utilitários TON ---
ton-balance:
	$(NODE) scripts/check-ton-balance.js

ton-wallet:
	$(NODE) scripts/show-wallet.js

ton-jetton-addr:
	$(NODE) scripts/calculate-jetton-address.js

# --- Limpeza ---
clean:
	rm -rf cache artifacts
	rm -rf contracts/ton/build
	@echo "Cache EVM e build TON removidos."

lint: lint-sol lint-js

lint-sol:
	$(NPX) solhint 'contracts/**/*.sol'

lint-js:
	$(NPX) eslint 'scripts/**/*.js' 'integrations/**/*.js'

analyze:
	$(NODE) scripts/code-analysis.js
