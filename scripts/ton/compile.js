const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function main() {
    console.log('🚀 Compiling Tact Contracts...');
    
    try {
        // Run tact compiler with config
        execSync('npx tact --config tact.config.json', { stdio: 'inherit' });
        console.log('\n✅ Compilation successful!');
        
        // Check functionality
        const buildDir = path.join(__dirname, '../contracts/ton/build/factory');
        if (fs.existsSync(buildDir)) {
             console.log('📂 Build artifacts verified in contracts/ton/build/');
        } else {
             console.log('⚠️ Warning: Build directory not found where expected.');
        }

    } catch (error) {
        console.error('❌ Compilation failed:', error.message);
        process.exit(1);
    }
}

main();
