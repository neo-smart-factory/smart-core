/**
 * NEO Protocol - Nexus Ingress Adapter
 * Responsâvel por receber ordens do Nexus e executar ações no Smart Factory.
 *
 * Ingress: POST /api/events (MINT_REQUESTED)
 * Egress: Webhook Callback para Nexus (deployed)
 */

const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Carregar dependências TON (já instaladas no projeto)
const {
  TonClient,
  WalletContractV5R1,
  internal,
  beginCell,
  Address,
  toNano,
} = require("@ton/ton");
const { mnemonicToPrivateKey } = require("@ton/crypto");

// Configurações
const PORT = process.env.PORT || process.env.NEXUS_INGRESS_PORT || 5050;
const NEXUS_SECRET = process.env.NEXUS_SECRET || "neo_nexus_vault_secret_2026";
const NEXUS_CALLBACK_URL =
  process.env.NEXUS_WEBHOOK_URL || "https://nsfactory.xyz/api/webhooks/factory";

// Op-code para deploy_jetton
const OP_DEPLOY_JETTON = 0x61caf729;
const DEPLOY_AMOUNT = toNano("0.9");

/**
 * Valida a assinatura HMAC-SHA256 vinda do Nexus
 */
function validateSignature(payload, signature) {
  if (!signature) return false;
  const provided = Array.isArray(signature) ? signature[0] : String(signature);
  const hmac = crypto.createHmac("sha256", NEXUS_SECRET);
  const expectedSignature = hmac.update(JSON.stringify(payload)).digest("hex");
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

/**
 * Envia o callback de volta para o Nexus
 */
async function sendCallback(data) {
  console.log(`📡 Sending callback to Nexus: ${NEXUS_CALLBACK_URL}`);

  const payload = JSON.stringify(data);
  const hmac = crypto.createHmac("sha256", NEXUS_SECRET);
  const signature = hmac.update(payload).digest("hex");

  const url = new URL(NEXUS_CALLBACK_URL);
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === "https:" ? 443 : 80),
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Nexus-Signature": signature,
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = (url.protocol === "https:" ? require("https") : http).request(
      options,
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Executa o mint no TON
 */
async function executeTONMint(config) {
  console.log(`🔨 Executing TON Mint for ${config.symbol}...`);

  // 1. Setup Client
  const isTestnet = process.env.TON_NETWORK === "testnet";
  const endpoint = isTestnet
    ? process.env.TON_RPC_URL_ONFINALITY_TESTNET ||
      "https://testnet.toncenter.com/api/v2/jsonRPC"
    : process.env.TON_RPC_URL_ONFINALITY_MAINNET ||
      "https://toncenter.com/api/v2/jsonRPC";

  const client = new TonClient({ endpoint, timeout: 30000 });

  // 2. Setup Wallet
  const mnemonics = process.env.TON_DEPLOYER_MNEMONIC.trim().split(/\s+/);
  const keyPair = await mnemonicToPrivateKey(mnemonics);
  const wallet = WalletContractV5R1.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });
  const walletContract = client.open(wallet);

  // 3. Factory Config
  const factoryAddress = Address.parse(
    process.env.VITE_NEO_JETTON_FACTORY_ADDRESS
  );

  // 4. Build Metadata (Simplified URI)
  const contentUri = `https://neoprotocol.space/api/jetton/${config.symbol.toLowerCase()}/metadata.json`;
  const contentCell = beginCell()
    .storeUint(0x01, 8)
    .storeStringTail(contentUri)
    .endCell();

  // 5. Build Deploy Message
  const queryId = Math.floor(Date.now() / 1000);
  const ownerAddress = Address.parse(
    config.ownerAddress || wallet.address.toString()
  );

  const deployMessage = beginCell()
    .storeUint(OP_DEPLOY_JETTON, 32)
    .storeUint(queryId, 64)
    .storeAddress(ownerAddress)
    .storeRef(contentCell)
    .storeCoins(toNano(config.maxSupply || "1000000"))
    .storeCoins(toNano(config.mintPrice || "0.1"))
    .storeCoins(toNano(config.mintAmount || "1000"))
    .endCell();

  // 6. Send
  const seqno = await walletContract.getSeqno();
  await walletContract.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        to: factoryAddress,
        value: DEPLOY_AMOUNT,
        bounce: true,
        body: deployMessage,
      }),
    ],
  });

  return {
    status: "pending",
    txHash: "waiting_for_chain", // No TON, o hash depende da confirmação se não calcularmos antecipadamente
    factoryAddress: factoryAddress.toString(),
  };
}

// Iniciar Servidor
const server = http.createServer((req, res) => {
  if (
    req.method === "GET" &&
    (req.url === "/" || req.url === "/health" || req.url === "/healthz")
  ) {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({
        status: "ok",
        service: "nexus-ingress",
        uptime: Math.floor(process.uptime()),
      })
    );
  }

  if (req.method === "POST" && req.url === "/api/events") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      if (!body || !body.trim()) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ error: "Bad Request: Empty JSON body" })
        );
      }

      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ error: "Bad Request: Invalid JSON body" })
        );
      }

      try {
        const signature = req.headers["x-nexus-signature"];

        if (!validateSignature(payload, signature)) {
          res.writeHead(401, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({ error: "Unauthorized: Invalid Genesis Signature" })
          );
        }

        console.log(`📥 Nexus Event Received: ${payload.event}`);

        if (payload.event === "MINT_REQUESTED") {
          res.writeHead(202, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "processing",
              message: "Mint order accepted",
            })
          );

          // Execução Async
          try {
            const result = await executeTONMint(payload.data);

            // Aguardar pequeno delay e enviar callback
            setTimeout(async () => {
              await sendCallback({
                eventId: payload.id,
                contractAddress: "Deploying...", // Em TON leva alguns segundos
                status: "deployed",
                metadata: {
                  network: "TON",
                  symbol: payload.data.symbol,
                  message: "Transaction sent to Smart Factory",
                },
              });
            }, 5000);
          } catch (err) {
            console.error("❌ Mint Error:", err);
          }
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unsupported event type" }));
        }
      } catch (err) {
        console.error("Ingress handler error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`🚀 NEØ Nexus Ingress operational on port ${PORT}`);
  console.log(`🛡️ Auth enabled with HMAC-SHA256`);
});

function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Shutting down nexus-ingress gracefully...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 8000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
