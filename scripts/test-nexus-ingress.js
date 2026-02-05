const http = require('http');
const crypto = require('crypto');
require('dotenv').config();

const NEXUS_SECRET = process.env.NEXUS_SECRET || "neo_nexus_vault_secret_2026";
const PORT = process.env.NEXUS_INGRESS_PORT || 5050;

async function testIngress() {
    console.log("🧪 Testing Nexus Ingress Auth...");

    const payload = {
        id: "evt_test_123",
        event: "MINT_REQUESTED",
        data: {
            symbol: "TEST",
            maxSupply: "1000000",
            ownerAddress: "UQBSi9T1-iPqrVvs8dDFIlOxQ7qZYTYFT4ocF7wK1syBevlj"
        }
    };

    const body = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', NEXUS_SECRET);
    const signature = hmac.update(body).digest('hex');

    const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/api/events',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Nexus-Signature': signature,
            'Content-Length': Buffer.byteLength(body)
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Response: ${data}`);
                resolve(res.statusCode === 202);
            });
        });

        req.on('error', (err) => {
            console.error("Connection failed. Is the server running?");
            reject(err);
        });

        req.write(body);
        req.end();
    });
}

// Rodar o teste
if (require.main === module) {
    testIngress();
}
