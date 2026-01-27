# NSF Token - Deployment Guide

## 🚀 Deployment Strategy

This guide outlines the complete deployment process for the NSF Token ecosystem, including pre-deployment preparation, deployment order, and post-deployment verification.

## ⚠️ Pre-Deployment Checklist (CRITICAL)

### Phase 0: Preparation (4-6 weeks before mainnet)

#### Security Audits (MANDATORY)
- [ ] **Audit 1**: ConsenSys Diligence or Trail of Bits
- [ ] **Audit 2**: OpenZeppelin Security
- [ ] **Audit 3**: Independent firm (Quantstamp, Hacken, or similar)
- [ ] All critical and high severity issues MUST be fixed
- [ ] Publish audit reports publicly

#### Formal Verification (RECOMMENDED)
- [ ] Certora formal verification for NSFToken
- [ ] Runtime Verification for FactoryQualification
- [ ] Mathematical proof of critical invariants

#### Bug Bounty Program
- [ ] Setup on Immunefi or HackenProof
- [ ] Minimum $500,000 USD pool
- [ ] Clear scope and rules
- [ ] 30-day period before mainnet

#### Legal Review
- [ ] Legal opinion from Brazilian law firm (CVM compliance)
- [ ] Legal opinion from US law firm (SEC compliance)
- [ ] Legal opinion from EU law firm (MiCA compliance)
- [ ] Terms of Service drafted and reviewed
- [ ] Privacy Policy drafted and reviewed

#### Infrastructure
- [ ] Multi-sig wallet setup (Gnosis Safe or similar)
- [ ] 7 guardian addresses identified and secured
- [ ] Timelock administrator configured
- [ ] RPC endpoints tested and validated
- [ ] Etherscan/Polygonscan API keys ready

## 📦 Deployment Parameters

### Network Configuration

#### Polygon Mainnet (Primary)
- Chain ID: 137
- RPC: https://polygon-rpc.com
- Explorer: https://polygonscan.com
- Gas Token: MATIC

#### Base Mainnet (Secondary)
- Chain ID: 8453
- RPC: https://mainnet.base.org
- Explorer: https://basescan.org
- Gas Token: ETH

### Initial Parameters

```javascript
// NSFToken
const INITIAL_DISTRIBUTOR = "0x..." // Multi-sig address

// FactoryQualification
const MIN_BALANCE_FOR_ACCESS = ethers.parseEther("1000") // 1,000 NSF
const ADMIN_ADDRESS = "0x..." // Timelock contract (deployed first)

// EmergencyGuardian
const GUARDIANS = [
  "0x...", // Guardian 1
  "0x...", // Guardian 2
  "0x...", // Guardian 3
  "0x...", // Guardian 4
  "0x...", // Guardian 5
  "0x...", // Guardian 6
  "0x..."  // Guardian 7
]
const TIMELOCK_ADDRESS = "0x..." // From TimelockController deployment

// TimelockController
const MIN_DELAY = 48 * 60 * 60 // 48 hours in seconds
const PROPOSERS = [ADMIN_ADDRESS] // Initially admin
const EXECUTORS = [ADMIN_ADDRESS] // Initially admin
```

## 🔄 Deployment Order (EXACT SEQUENCE)

### Step 1: Deploy TimelockController

```bash
npx hardhat run scripts/nsf/1_deploy_timelock.js --network polygon
```

**Purpose**: Creates governance timelock with 48-hour delay

**Verification**:
```bash
npx hardhat verify --network polygon <TIMELOCK_ADDRESS> \
  <MIN_DELAY> \
  '[<PROPOSERS>]' \
  '[<EXECUTORS>]' \
  <ADMIN>
```

**Save**: `TIMELOCK_ADDRESS` to .env

---

### Step 2: Deploy NSFToken

```bash
npx hardhat run scripts/nsf/2_deploy_token.js --network polygon
```

**Purpose**: Deploy immutable token with fixed supply

**Verification**:
```bash
npx hardhat verify --network polygon <NSF_TOKEN_ADDRESS> \
  <INITIAL_DISTRIBUTOR>
```

**Critical Checks**:
- [ ] Total supply = 1,000,000,000 * 10^18
- [ ] Balance of distributor = total supply
- [ ] No owner address exists
- [ ] MINT_RENOUNCED = true

**Save**: `NSF_TOKEN_ADDRESS` to .env

---

### Step 3: Deploy FactoryQualification (Implementation)

```bash
npx hardhat run scripts/nsf/3_deploy_qualification_impl.js --network polygon
```

**Purpose**: Deploy implementation contract for UUPS proxy

**Verification**:
```bash
npx hardhat verify --network polygon <QUALIFICATION_IMPL_ADDRESS>
```

**Save**: `QUALIFICATION_IMPL_ADDRESS` to .env

---

### Step 4: Deploy FactoryQualification (Proxy)

```bash
npx hardhat run scripts/nsf/4_deploy_qualification_proxy.js --network polygon
```

**Purpose**: Deploy ERC1967 proxy pointing to implementation

**Includes**: Initialize call with parameters

**Verification**:
```bash
# Verify implementation
npx hardhat verify --network polygon <QUALIFICATION_PROXY_ADDRESS>

# Check initialization
npx hardhat run scripts/nsf/verify_qualification.js --network polygon
```

**Critical Checks**:
- [ ] nsfToken address matches Step 2
- [ ] minBalanceForAccess set correctly
- [ ] Admin role granted to TIMELOCK
- [ ] Proxy points to correct implementation

**Save**: `QUALIFICATION_PROXY_ADDRESS` to .env

---

### Step 5: Deploy EmergencyGuardian

```bash
npx hardhat run scripts/nsf/5_deploy_guardian.js --network polygon
```

**Purpose**: Deploy multisig emergency circuit breaker

**Verification**:
```bash
npx hardhat verify --network polygon <GUARDIAN_ADDRESS> \
  '[<GUARDIAN_ADDRESSES>]' \
  <TIMELOCK_ADDRESS>
```

**Critical Checks**:
- [ ] 7 guardians configured
- [ ] PAUSE_THRESHOLD = 4
- [ ] AUTO_UNPAUSE_DELAY = 48 hours
- [ ] Timelock has TIMELOCK_ROLE

**Save**: `GUARDIAN_ADDRESS` to .env

---

### Step 6: Configure Guardian with Pausable Contracts

```bash
npx hardhat run scripts/nsf/6_configure_guardian.js --network polygon
```

**Purpose**: Register FactoryQualification as pausable by guardian

**Actions**:
```javascript
await guardian.addPausableContract(QUALIFICATION_PROXY_ADDRESS)
```

**Critical Checks**:
- [ ] Qualification added to pausable contracts
- [ ] Test pause functionality (testnet only!)

---

### Step 7: Transfer Roles to Timelock

```bash
npx hardhat run scripts/nsf/7_transfer_roles.js --network polygon
```

**Purpose**: Move all admin roles from deployer to timelock

**Actions**:
```javascript
// Transfer FactoryQualification admin
await qualification.grantRole(DEFAULT_ADMIN_ROLE, TIMELOCK_ADDRESS)
await qualification.revokeRole(DEFAULT_ADMIN_ROLE, DEPLOYER_ADDRESS)

// Verify deployer has no roles
```

**Critical Checks**:
- [ ] Timelock has DEFAULT_ADMIN_ROLE on Qualification
- [ ] Deployer has NO roles on Qualification
- [ ] Timelock has TIMELOCK_ROLE on Guardian
- [ ] All changes require 48h timelock

---

## 🔍 Post-Deployment Verification

### Automated Verification Script

```bash
npx hardhat run scripts/nsf/verify_deployment.js --network polygon
```

**Checks**:
1. ✅ NSFToken supply is correct and immutable
2. ✅ FactoryQualification initialized correctly
3. ✅ EmergencyGuardian configured correctly
4. ✅ All roles assigned to Timelock
5. ✅ No deployer has admin privileges
6. ✅ All contracts verified on Polygonscan

### Manual Verification

#### NSFToken
```javascript
const token = await ethers.getContractAt("NSFToken", NSF_TOKEN_ADDRESS)
console.log("Total Supply:", await token.totalSupply())
console.log("Mint Renounced:", await token.MINT_RENOUNCED())
console.log("Deployment Time:", await token.DEPLOYMENT_TIMESTAMP())
```

#### FactoryQualification
```javascript
const qual = await ethers.getContractAt("FactoryQualification", QUALIFICATION_PROXY_ADDRESS)
console.log("NSF Token:", await qual.nsfToken())
console.log("Min Balance:", await qual.minBalanceForAccess())
console.log("Admin:", await qual.hasRole(DEFAULT_ADMIN_ROLE, TIMELOCK_ADDRESS))
```

#### EmergencyGuardian
```javascript
const guardian = await ethers.getContractAt("EmergencyGuardian", GUARDIAN_ADDRESS)
console.log("Guardians:", await guardian.GUARDIAN_COUNT())
console.log("Threshold:", await guardian.PAUSE_THRESHOLD())
console.log("Pausables:", await guardian.getPausableContracts())
```

---

## 📋 Post-Deployment Actions

### Immediate (Day 0)

- [ ] Publish all contract addresses on official channels
- [ ] Update documentation with mainnet addresses
- [ ] Verify all contracts on block explorer
- [ ] Transfer tokens to distribution contract (if applicable)
- [ ] Announce deployment with security audit links

### Short-term (Week 1)

- [ ] Begin manual qualification of first 100 users
- [ ] Test emergency pause mechanism (on testnet replica)
- [ ] Monitor guardian multisig security
- [ ] Set up contract monitoring (Tenderly, Defender)
- [ ] Establish incident response protocol

### Medium-term (Month 1)

- [ ] Qualify 500+ users
- [ ] Publish transparency report
- [ ] Test governance proposal flow (testnet)
- [ ] Review and adjust minBalanceForAccess if needed
- [ ] Conduct post-deployment security review

---

## 🚨 Emergency Procedures

### If Critical Bug Found

1. **Pause System** via EmergencyGuardian (4-of-7 vote)
2. **Assess Impact** - determine affected components
3. **Deploy Fix** for upgradeable components (Qualification)
4. **Timelock Upgrade** - submit via governance (48h delay)
5. **Execute Upgrade** after timelock
6. **Unpause System** via Guardian or Timelock
7. **Post-Mortem** - publish incident report

### If Guardian Compromise Suspected

1. **Do NOT use compromised guardian address**
2. **Use remaining 6 guardians** for operations
3. **Rotate guardian** via Timelock admin
4. **Audit all recent guardian actions**
5. **Publish transparency report**

---

## 📊 Deployment Costs Estimate

| Network | Component | Est. Gas | Cost (30 gwei) |
|---------|-----------|----------|----------------|
| Polygon | TimelockController | ~1,000,000 | ~$0.30 |
| Polygon | NSFToken | ~1,200,000 | ~$0.36 |
| Polygon | Qualification Impl | ~2,000,000 | ~$0.60 |
| Polygon | Qualification Proxy | ~500,000 | ~$0.15 |
| Polygon | EmergencyGuardian | ~1,500,000 | ~$0.45 |
| Polygon | Configuration | ~500,000 | ~$0.15 |
| **Total** | | **~6,700,000** | **~$2.01** |

*Costs are estimates and vary with gas prices*

---

## 🔗 Contract Addresses Registry

### Polygon Mainnet

```
NSFToken: 0x...
TimelockController: 0x...
FactoryQualification (Proxy): 0x...
FactoryQualification (Impl): 0x...
EmergencyGuardian: 0x...
```

### Base Mainnet

```
NSFToken: 0x...
TimelockController: 0x...
FactoryQualification (Proxy): 0x...
FactoryQualification (Impl): 0x...
EmergencyGuardian: 0x...
```

---

## 📚 Additional Resources

- [Technical Specification](./NSF_TOKEN_SPECIFICATION.md)
- [Regulatory Compliance (Brazil)](./NSF_REGULATORY_COMPLIANCE_BR.md)
- [Communication Policy](./NSF_COMMUNICATION_POLICY.md)
- [Governance Guide](./NSF_GOVERNANCE.md) (when implemented)

---

**Version:** 1.0  
**Author:** Eurycles Ramos Neto / NODE NEØ  
**Date:** 2026-01-26  
**Status:** Ready for Implementation
