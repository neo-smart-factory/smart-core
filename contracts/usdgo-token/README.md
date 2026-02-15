# USDGO Token Smart Contract

USDGO is a BEP-20 token designed for fast deployment and easy integration into the BNB Smart Chain ecosystem. Built with security, scalability, and flexibility in mind, this project offers a clean, production-ready smart contract structure.

## ✨ Features

* Fully compliant BEP-20 Token
* Owner-defined minting rights
* Secure deployment with signer-based initialization
* Easy to verify and publish on BscScan
* Ready for TrustWallet logo integration

## 🚀 Deployment

This project is powered by [Hardhat](https://hardhat.org) for smart contract development and deployment.

### Environment Setup

1. Create a `.env` file in the root directory:

```
SIGNER_ADDRESS=0xYourWalletAddress
PRIVATE_KEY=your_private_key
BSCSCAN_API_KEY=your_bscscan_api_key
```

2. Install dependencies:

```bash
npm install
```

### Compile & Deploy

```bash
npx hardhat compile
make deploy NETWORK=bsc
```

### Verify on BscScan

```bash
npx hardhat verify --network bsc 0xYourDeployedContractAddress "0xYourSignerAddress"
```

## 📅 Contract Info

* Contract Address: `0xF408D8b596a0B3b68AdD59fbd3827718fd1f03F1`
* BscScan: [View Contract](https://bscscan.com/address/0xF408D8b596a0B3b68AdD59fbd3827718fd1f03F1#code)

## 🏆 TrustWallet Integration

Submit your token info and logo to:
[https://github.com/trustwallet/assets](https://github.com/trustwallet/assets)

Follow their [submission guidelines](https://github.com/trustwallet/assets/blob/master/README.md) and make sure to:

* Include your token logo in `blockchains/smartchain/assets/<your-token-address>/logo.png`
* Update `info.json` with accurate details

---

This repository was structured to be simple, reproducible, and scalable. Use it, fork it, improve it.

**USDGO is not just a token, it's a brand.**
