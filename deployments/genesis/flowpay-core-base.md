# FlowPay-Core Genesis — Deployment Record

**NEØ SMART FACTORY** | NeoGenesisNFT v1.0.0
**Network:** Base Mainnet (Chain ID: 8453)
**Date:** 2026-02-21
**Architect:** NEØ MELLØ / nsfactory.eth

---

## Event

> FlowPay-Core visual identity approved and published to [github.com/FlowPay-Core](https://github.com/FlowPay-Core) on 2026-02-21.
> This was the **first Genesis NFT minted by NEØ SMART FACTORY** and the **first attestation registered in NeoAttestationRegistry**.

---

## Contracts

### NeoAttestationRegistry
| Field | Value |
|-------|-------|
| Address | `0xd537619325676045d30667EABC617F4f9c8B8c03` |
| Guardian | `nsfactory.eth` (`0x470a8c640fFC2C16aEB6bE803a948420e2aE8456`) |
| Version | `1.0.0` |
| Verified | ✅ Exact Match |
| Basescan | https://basescan.org/address/0xd537619325676045d30667EABC617F4f9c8B8c03#code |
| Deploy Tx | `0x224bdc69c6f8d3dbda71d80305d717b4a7e9312bc400d0ceff9334e3bb95af5f` |

### NeoGenesisNFT
| Field | Value |
|-------|-------|
| Address | `0x72Fda6796Bfff604113586083227366343944a87` |
| Token Tracker | `FlowPay-Core (FLOWGEN)` |
| Token ID | `0` |
| Owner | `nsfactory.eth` (`0x470a8c640fFC2C16aEB6bE803a948420e2aE8456`) |
| Standard | ERC-721 + ERC-5192 (Soulbound) |
| Soulbound | `true` — non-transferable, permanently locked |
| Version | `1.0.0` |
| Verified | ✅ Exact Match |
| Basescan | https://basescan.org/address/0x72Fda6796Bfff604113586083227366343944a87#code |
| OpenSea | https://opensea.io/assets/base/0x72Fda6796Bfff604113586083227366343944a87/0 |
| Deploy Tx | (saved in `genesis-nft-flowpay-core-base.json`) |
| Mint Tx | `0x0c69701ea27a85af1eff8fe030924794e6f978f345d1f6ad44eeb80cf7ea282c` |

---

## Proof of Existence (PoE)

| Field | Value |
|-------|-------|
| PoE Hash | `0xc326ec80ec0b0f3f0b6884aea8233e2e0b7b523a29952790c210cb70df1756b8` |
| Algorithm | `keccak256(JSON.stringify(eventData))` |
| Registered | `2026-02-22T02:49:11 UTC` (block timestamp) |
| Revoked | `false` |
| Registry Tx | `0xa24e3729cab96d3e41d0b683ff81e75dc337e451d4dd517ee2e8526a7b808cb8` |

**Event data (off-chain source of poeHash):**
```json
{
  "project":    "FlowPay-Core",
  "event":      "visual_identity_approved",
  "date":       "2026-02-21",
  "repo":       "https://github.com/FlowPay-Core",
  "approvedBy": "NEO_MELLO"
}
```

---

## IPFS

| Asset | CID |
|-------|-----|
| Image (`flowpay-core-genesis.jpg`) | `QmNUyPhMzngYHL7KVMPf6A7vP5gDrtVh2jJLQPJJ9jS73K` |
| Metadata JSON | `Qma7hduaNcLSXetfXjows9v16Z658akTP627zCo61EGPDq` |
| Token URI | `ipfs://Qma7hduaNcLSXetfXjows9v16Z658akTP627zCo61EGPDq` |

**Image specs:** 2423×2423px · JPEG · 594 KB · sRGB · 1:1 square

---

## Metadata JSON

```json
{
  "name": "FlowPay-Core Genesis",
  "description": "Genesis NFT of FlowPay-Core — visual identity approved on 2026-02-21. Originated and registered by NEØ SMART FACTORY. Soulbound to nsfactory.eth. This token is non-transferable and serves as permanent on-chain proof of origin.",
  "image": "ipfs://QmNUyPhMzngYHL7KVMPf6A7vP5gDrtVh2jJLQPJJ9jS73K",
  "external_url": "https://github.com/FlowPay-Core",
  "attributes": [
    { "trait_type": "Project",      "value": "FlowPay-Core" },
    { "trait_type": "Event",        "value": "Visual Identity Approved" },
    { "trait_type": "Date",         "value": "2026-02-21" },
    { "trait_type": "Repository",   "value": "github.com/FlowPay-Core" },
    { "trait_type": "Origin",       "value": "NEØ SMART FACTORY" },
    { "trait_type": "PoE Hash",     "value": "0xc326ec80ec0b0f3f0b6884aea8233e2e0b7b523a29952790c210cb70df1756b8" },
    { "trait_type": "PoE Registry", "value": "0xd537619325676045d30667EABC617F4f9c8B8c03" },
    { "trait_type": "Network",      "value": "Base" },
    { "trait_type": "Soulbound",    "value": "true" },
    { "trait_type": "Standard",     "value": "ERC-5192" }
  ]
}
```

---

## Source Files

| File | Path |
|------|------|
| Contract | `contracts/protocol/NeoGenesisNFT.sol` |
| Registry | `contracts/protocol/NeoAttestationRegistry.sol` |
| Mock (test) | `contracts/test/MockAttestationRegistry.sol` |
| Tests NFT | `test/NeoGenesisNFT.test.js` |
| Tests Registry | `test/NeoAttestationRegistry.test.js` |
| Deploy Registry | `scripts/deploy/deploy-attestation-registry.js` |
| Deploy NFT | `scripts/deploy/deploy-genesis-nft.js` |
| Mint | `scripts/deploy/mint-genesis-nft.js` |
| Deploy JSON | `deployments/attestation-registry-base.json` |
| Deploy JSON | `deployments/genesis-nft-flowpay-core-base.json` |
| NFT Image | `neoflowoff/flowpay-core/branding/nft/flowpay-core-genesis.jpg` |
| Metadata | `neoflowoff/flowpay-core/branding/nft/flowpay-core-genesis-metadata.json` |

---

## Notes

- `NeoAttestationRegistry` is **reusable** — next Genesis NFT for any project points to the same registry.
- `NeoGenesisNFT` is **one deploy per project** — constructor params carry the identity.
- PoE validation happens **on-chain inside `mint()`** — NFT cannot exist without a valid, non-revoked attestation.
- This is the **first on-chain record** of the NEØ Protocol. All future milestones follow this pattern.

---

*NEØ SMART FACTORY — Expand until silence becomes structure.*
