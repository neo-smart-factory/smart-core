# NΞØ SMART FACTORY - Nexus Integration

This directory contains the Ingress Adapter for the NEØ Nexus system.
It allows the Smart Factory to act as a reactive node in the protocol, responding to payment events.

## Features
- **SF1**: API Endpoint `POST /api/mint`
- **SF2**: Bearer Token Authentication
- **SF3**: Async execution to comply with < 30s timeout
- **SF4**: Webhook feedback to Nexus (`FACTORY:MINT_CONFIRMED` / `FACTORY:MINT_FAILED`)
- **HMAC Signatures**: Secure communication with Nexus

## Setup

1. Configure your `.env` file (see `.env.example`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the adapter:
   ```bash
   npm run nexus:start
   ```

## Production Architecture
This adapter uses Hardhat under the hood to manage transaction signing and nonces. 
Ensure the `FACTORY_API_KEY` matches the one configured in your Neo-Nexus instance.
