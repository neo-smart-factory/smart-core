ENV=.env
NETWORK=bsctest
OPENZ_VERSION=5.3.0

install:
	@echo "📦 Instalando tudo do zero..."
	rm -rf node_modules package-lock.json
	npm install
	npm install --save-dev hardhat
	npm install @openzeppelin/contracts@$(OPENZ_VERSION)
	npm install dotenv ethers

compile:
	@echo "🔨 Compilando contratos..."
	npx hardhat compile

deploy:
	@echo "🚀 Deploy para $(NETWORK)..."
	npx hardhat run scripts/deploy.js --network $(NETWORK)

mint:
	@echo "🧾 Mint via assinatura (usa vars: to=, amount=, nonce=, sig=)..."
	node scripts/mintWithSig.js $(to) $(amount) $(nonce) $(sig)

sign:
	@echo "✍️ Gerando assinatura (usa vars: to=, amount=)..."
	node scripts/signMint.js $(to) $(amount)

reset:
	@echo "🧹 Resetando tudo e reinstalando do zero..."
	rm -rf node_modules package-lock.json
	make install

envcheck:
	@echo "🔍 Verificando variáveis do .env..."
	node scripts/test-env.js
