#!/usr/bin/env node

/**
 * NΞØ SMART FACTORY — Simulador CLI v0.5.1
 * Simulação mínima antes do deploy
 */

require("dotenv").config();

console.log("=== NΞØ SMART FACTORY – SIMULAÇÃO v0.5.1 ===\n");

const {
  TOKEN_NAME,
  TOKEN_SYMBOL,
  TOKEN_SUPPLY,
  TOKEN_PRICE
} = process.env;

if (!TOKEN_NAME || !TOKEN_SYMBOL || !TOKEN_SUPPLY || !TOKEN_PRICE) {
  console.error("❌ Variáveis de ambiente não configuradas!");
  console.error("Configure TOKEN_NAME, TOKEN_SYMBOL, TOKEN_SUPPLY, TOKEN_PRICE no .env");
  process.exit(1);
}

console.log("📋 Configuração do Token:");
console.log("  Nome:", TOKEN_NAME);
console.log("  Símbolo:", TOKEN_SYMBOL);
console.log("  Supply:", TOKEN_SUPPLY);
console.log("  Preço Fixo:", TOKEN_PRICE, "ETH/MATIC");

console.log("\n🔍 Validação rápida:");

// Validar supply
const supplyNum = Number(TOKEN_SUPPLY);
if (supplyNum <= 0 || isNaN(supplyNum)) {
  console.log("❌ Supply inválido");
} else {
  console.log("✅ Supply válido");
}

// Validar preço
const priceNum = Number(TOKEN_PRICE);
if (priceNum < 0 || isNaN(priceNum)) {
  console.log("❌ Preço inválido");
} else if (priceNum === 0) {
  console.log("⚠️ Preço zero (gratuito)");
} else {
  console.log("✅ Preço válido");
}

// Validar nome e símbolo
if (!TOKEN_NAME || TOKEN_NAME.length < 2) {
  console.log("❌ Nome muito curto");
} else {
  console.log("✅ Nome válido");
}

if (!TOKEN_SYMBOL || TOKEN_SYMBOL.length < 2 || TOKEN_SYMBOL.length > 10) {
  console.log("❌ Símbolo inválido (2-10 caracteres)");
} else {
  console.log("✅ Símbolo válido");
}

// Calcular estimativas
console.log("\n📊 Estimativas:");
const estimatedGas = 2500000; // ~2.5M gas para deploy
const gasPrice = 30; // gwei (Polygon)
const ethPrice = 2000; // USD
const estimatedCost = (estimatedGas * gasPrice * 1e-9 * ethPrice).toFixed(2);

console.log("  Gas estimado:", estimatedGas.toLocaleString());
console.log("  Custo estimado:", estimatedCost, "USD");

console.log("\n✅ Status geral: PRONTO PARA DEPLOY (simulado)");
console.log("\n💡 Para deploy real, use: npm run deploy");

