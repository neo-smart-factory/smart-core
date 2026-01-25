/**
 * Test script to validate the dictionary fix for Exit Code 9
 * This replicates the Factory's storage logic and Minter's parsing logic
 */

const { beginCell, Address } = require('@ton/core');

async function testDictFix() {
    console.log('🧪 Testing Dictionary Serialization/Deserialization Fix\n');
    
    // Test parameters
    const max_supply = 1000000000000000000000000000n; // 1B tokens
    const mint_price = 100000000n; // 0.1 TON
    const mint_amount = 1000000000000000000000n; // 1000 tokens
    const public_mint_enabled = false;
    const owner_address = Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'); // Example address
    
    console.log('📦 Input Parameters:');
    console.log(`   Max Supply: ${max_supply}`);
    console.log(`   Mint Price: ${mint_price}`);
    console.log(`   Mint Amount: ${mint_amount}`);
    console.log(`   Public Mint: ${public_mint_enabled}`);
    console.log(`   Owner: ${owner_address.toString()}\n`);
    
    // 1. REPLICATE the Factory's storage logic (AFTER THE FIX)
    console.log('🏭 Factory: Creating extra_data cell...');
    const extra_data = beginCell()
        .storeCoins(max_supply)
        .storeCoins(mint_price)
        .storeCoins(mint_amount)
        .storeBit(public_mint_enabled ? 1 : 0)
        .storeAddress(owner_address)
        .storeMaybeRef(beginCell().endCell())  // ✅ FIXED: Empty dict as cell reference
        .endCell();
    
    console.log(`   ✅ Stored bits: ${extra_data.bits.length}`);
    console.log(`   ✅ Stored refs: ${extra_data.refs.length}\n`);
    
    // 2. ATTEMPT to parse it as the Minter would
    console.log('🔍 Minter: Parsing extra_data cell...');
    const slice = extra_data.beginParse();
    
    try {
        const parsed_max_supply = slice.loadCoins();
        const parsed_mint_price = slice.loadCoins();
        const parsed_mint_amount = slice.loadCoins();
        const parsed_public_mint = slice.loadBit();
        const parsed_owner = slice.loadAddress();
        const parsed_dict = slice.loadMaybeRef();  // loadDict in FunC = loadMaybeRef in JS
        
        console.log('   ✅ Parsing succeeded!\n');
        
        console.log('📊 Parsed Values:');
        console.log(`   Max Supply: ${parsed_max_supply} ${parsed_max_supply === max_supply ? '✅' : '❌'}`);
        console.log(`   Mint Price: ${parsed_mint_price} ${parsed_mint_price === mint_price ? '✅' : '❌'}`);
        console.log(`   Mint Amount: ${parsed_mint_amount} ${parsed_mint_amount === mint_amount ? '✅' : '❌'}`);
        console.log(`   Public Mint: ${parsed_public_mint} ${parsed_public_mint === (public_mint_enabled ? 1 : 0) ? '✅' : '❌ (expected: ' + (public_mint_enabled ? 1 : 0) + ')'}`);
        console.log(`   Owner: ${parsed_owner?.toString() || 'null'} ${parsed_owner?.equals(owner_address) ? '✅' : '❌'}`);
        console.log(`   Dict: ${parsed_dict ? 'Empty Cell' : 'null'} ${parsed_dict ? '✅' : '❌'}`);
        
        // Verify all values match
        const allMatch = 
            parsed_max_supply === max_supply &&
            parsed_mint_price === mint_price &&
            parsed_mint_amount === mint_amount &&
            parsed_public_mint === (public_mint_enabled ? true : false) &&  // loadBit returns boolean
            parsed_owner?.equals(owner_address) &&
            parsed_dict !== null;
        
        if (allMatch) {
            console.log('\n✅ SUCCESS: All values match! The fix resolves the Cell Underflow issue.');
            return true;
        } else {
            console.log('\n❌ FAILURE: Some values do not match.');
            return false;
        }
    } catch (error) {
        console.error('   ❌ Parsing failed:', error.message);
        console.error('\n❌ FAILURE: The Cell Underflow issue persists.\n');
        return false;
    }
}

// Run the test
testDictFix()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test error:', error);
        process.exit(1);
    });
