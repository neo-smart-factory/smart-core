const { TonClient, Address } = require('@ton/ton');

async function verify() {
    const addressStr = 'EQA5mLN4-9DqZet7s3JQiyzK3XTEOSzF4SYOdHALofVJ4y9M';
    const addr = Address.parse(addressStr);

    const networks = [
        { name: 'Mainnet', url: 'https://toncenter.com/api/v2/jsonRPC' },
        { name: 'Testnet', url: 'https://testnet.toncenter.com/api/v2/jsonRPC' }
    ];

    for (const net of networks) {
        try {
            const client = new TonClient({ endpoint: net.url });
            const isDeployed = await client.isContractDeployed(addr);
            console.log(`${net.name}: ${isDeployed ? 'DEPLOYED' : 'NOT DEPLOYED'}`);
            if (isDeployed) {
                const state = await client.getContractState(addr);
                console.log(`  Balance: ${Number(state.balance) / 1e9} TON`);
            }
        } catch (e) {
            console.log(`${net.name}: Error - ${e.message}`);
        }
    }
}

verify();
