/* eslint-disable */
require('dotenv').config();
const { beginCell, Address, toNano } = require('@ton/ton');

console.log("📊 ANÁLISE DE TAMANHO DAS CÉLULAS\n");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// Configurações do token
const TOKEN_CONFIG = {
    maxSupply: toNano('1000000000'),
    mintPrice: toNano('0.1'),
    mintAmount: toNano('1000')
};

const ownerAddress = Address.parse("EQBSi9T1-iPqrVvs8dDFIlOxQ7qZYTYFT4ocF7wK1syBeqSm");
const contentUri = `https://neoprotocol.space/api/jetton/nsf/metadata.json`;

// 1. Content Cell
console.log("1️⃣  CONTENT CELL");
const contentCell = beginCell()
    .storeUint(0x01, 8)
    .storeStringTail(contentUri)
    .endCell();

console.log(`   Bits: ${contentCell.bits.length}`);
console.log(`   Refs: ${contentCell.refs.length}`);
console.log(`   ✅ Limite: 1023 bits, 4 refs\n`);

// 2. Extra Data Cell
console.log("2️⃣  EXTRA DATA CELL");
const extraDataBuilder = beginCell()
    .storeCoins(TOKEN_CONFIG.maxSupply)
    .storeCoins(TOKEN_CONFIG.mintPrice)
    .storeCoins(TOKEN_CONFIG.mintAmount)
    .storeInt(0, 1)          // public_mint_enabled
    .storeAddress(ownerAddress) // bridge_minter
    .storeUint(0, 1);        // empty dict

try {
    const extraDataCell = extraDataBuilder.endCell();
    console.log(`   Bits: ${extraDataCell.bits.length}`);
    console.log(`   Refs: ${extraDataCell.refs.length}`);
    
    if (extraDataCell.bits.length > 1023) {
        console.log(`   ❌ OVERFLOW! Excede 1023 bits por ${extraDataCell.bits.length - 1023} bits\n`);
    } else {
        console.log(`   ✅ OK (${1023 - extraDataCell.bits.length} bits disponíveis)\n`);
    }
} catch (e) {
    console.log(`   ❌ ERRO ao construir: ${e.message}\n`);
}

// 3. Data Cell (Minter initial data)
console.log("3️⃣  DATA CELL (Minter)");
const dataBuilder = beginCell()
    .storeCoins(0)              // total_supply
    .storeAddress(ownerAddress) // admin_address
    .storeRef(contentCell)      // content
    // Note: jetton_wallet_code seria mais uma ref
    // Note: extra_data seria mais uma ref

console.log(`   Bits (sem refs): ${dataBuilder.bits.length}`);
console.log(`   Refs (content + wallet_code + extra): 3 refs planejadas`);
console.log(`   ✅ OK (limite: 4 refs)\n`);

// 4. Análise do Owner Address
console.log("4️⃣  OWNER ADDRESS");
const addrBuilder = beginCell().storeAddress(ownerAddress);
console.log(`   Bits de um endereço: ${addrBuilder.bits.length}`);
console.log(`   Usado 2x (admin + bridge_minter): ${addrBuilder.bits.length * 2} bits total\n`);

// 5. Análise de Coins
console.log("5️⃣  COINS (VarUInteger)");
console.log(`   Max Supply (1B tokens): ${beginCell().storeCoins(TOKEN_CONFIG.maxSupply).bits.length} bits`);
console.log(`   Mint Price (0.1 TON): ${beginCell().storeCoins(TOKEN_CONFIG.mintPrice).bits.length} bits`);
console.log(`   Mint Amount (1000 TON): ${beginCell().storeCoins(TOKEN_CONFIG.mintAmount).bits.length} bits\n`);

// Resumo
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📋 RESUMO");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

const extraBits = beginCell()
    .storeCoins(TOKEN_CONFIG.maxSupply)
    .storeCoins(TOKEN_CONFIG.mintPrice)
    .storeCoins(TOKEN_CONFIG.mintAmount)
    .storeInt(0, 1)
    .storeAddress(ownerAddress)
    .storeUint(0, 1);

try {
    const cell = extraBits.endCell();
    console.log(`Total bits em extra_data: ${cell.bits.length} / 1023`);
    console.log(`Espaço livre: ${1023 - cell.bits.length} bits`);
    
    if (cell.bits.length > 1023) {
        console.log(`\n❌ PROBLEMA ENCONTRADO!`);
        console.log(`   Excesso: ${cell.bits.length - 1023} bits`);
        console.log(`\n💡 SOLUÇÃO:`);
        console.log(`   1. Mover alguns campos para referências`);
        console.log(`   2. Reduzir precisão de valores grandes`);
        console.log(`   3. Usar formato mais compacto`);
    } else {
        console.log(`\n✅ Tamanho da célula OK!`);
        console.log(`\n⚠️  Se ainda há Exit Code 9, o problema pode estar em:`);
        console.log(`   1. Manipulação de células durante execução`);
        console.log(`   2. Acúmulo de dados em células temporárias`);
        console.log(`   3. Incompatibilidade entre store/load operations`);
    }
} catch (e) {
    console.log(`\n❌ ERRO: ${e.message}`);
}
