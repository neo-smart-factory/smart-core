
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const { executeMint } = require('./mint-executor');

const app = express();
app.use(express.json());

const PORT = process.env.FACTORY_PORT || 3005;
const FACTORY_API_KEY = process.env.FACTORY_API_KEY;
const NEXUS_SECRET = process.env.NEXUS_SECRET;
const NEXUS_WEBHOOK_URL = process.env.NEXUS_WEBHOOK_URL || 'https://nexus.neoprotocol.space/api/webhooks/factory';

// Middleware for Bearer Token Auth (SF2)
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${FACTORY_API_KEY}`) {
        console.warn('[FACTORY] 🔒 Unauthorized access attempt');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

/**
 * Notify Nexus about the result (SF4)
 */
async function notifyNexus(payload) {
    if (!NEXUS_SECRET) {
        console.warn('[FACTORY] ⚠️  NEXUS_SECRET not configured. Skipping webhook.');
        return;
    }

    const body = JSON.stringify({
        event: payload.status === 'confirmed' ? 'FACTORY:MINT_CONFIRMED' : 'FACTORY:MINT_FAILED',
        payload: payload
    });

    const signature = crypto
        .createHmac('sha256', NEXUS_SECRET)
        .update(body)
        .digest('hex');

    try {
        console.log(`[FACTORY] 📡 Notifying Nexus: ${NEXUS_WEBHOOK_URL}`);
        const response = await fetch(NEXUS_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Nexus-Signature': signature
            },
            body: body
        });

        if (!response.ok) {
            console.error(`[FACTORY] ❌ Failed to notify Nexus: ${response.status}`);
        } else {
            console.log('[FACTORY] ✅ Nexus notified successfully');
        }
    } catch (err) {
        console.error('[FACTORY] ❌ Error notifying Nexus:', err.message);
    }
}

/**
 * SF1: Endpoint de mint
 * Body: { targetAddress, tokenId, amount, reason, refTransactionId }
 */
app.post('/api/mint', authMiddleware, async (req, res) => {
    const { targetAddress, tokenId, amount, reason, refTransactionId } = req.body;

    console.log(`[FACTORY] 🚀 Mint Requested: ${amount} ${tokenId} -> ${targetAddress} (Ref: ${refTransactionId})`);

    // 1. Initial response to Nexus (SF3: Timeout < 30s)
    // We respond immediately if the request is valid, then process async
    if (!targetAddress || !amount || !tokenId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    res.status(202).json({
        status: 'accepted',
        message: 'Minting process started',
        refTransactionId
    });

    // 2. Async Execution
    try {
        const result = await executeMint({ targetAddress, amount, tokenId, refTransactionId });

        // 3. Notify Nexus of Success (SF4, SF6)
        await notifyNexus({
            contractAddress: process.env.NEOFLW_TOKEN_ADDRESS,
            status: 'confirmed',
            metadata: {
                txHash: result.txHash,
                orderId: refTransactionId,
                recipient: targetAddress
            }
        });

    } catch (error) {
        console.error('[FACTORY] ❌ Async mint execution failed:', error.message);

        // Notify Nexus of Failure
        await notifyNexus({
            status: 'failed',
            metadata: {
                error: error.message,
                orderId: refTransactionId
            }
        });
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '0.5.3-ignition',
        node: 'smart-core-adapter'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FACTORY] 🛰️  Nexus Ingress Adapter running on port ${PORT}`);
});
