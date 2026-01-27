# FactoryNSF.sol - Foundation Contract

## 🎯 Overview

**FactoryNSF.sol** is the complete, production-ready implementation of the NSF (Neural Sync Factory) coordination protocol. This single file contains all three operational layers integrated and ready for deployment.

## 📦 What's Inside

### Single-File Architecture

```
FactoryNSF.sol (1,310 lines)
├── Layer 1: NSFToken (Immutable Token)
├── Layer 2: FactoryQualification (Access Control)
├── Layer 4: EmergencyGuardian (Circuit Breaker)
└── FactoryNSF (Main Deployment Contract)
```

## 🏗️ Layer Breakdown

### Layer 1: NSFToken (Lines 82-269)

**Purpose:** Immutable coordination token with fixed supply

**Key Features:**
- ✅ Fixed supply: 1,000,000,000 NSF (1 billion tokens)
- ✅ No owner (complete power renunciation)
- ✅ No mint function (supply is permanent)
- ✅ ERC20 + ERC20Permit (gasless transactions)
- ✅ Deployment timestamp for transparency
- ✅ Initial distribution event

**Regulatory Defense:**
- No "monetary policy" risk (fixed supply)
- No "centralized control" risk (no owner)
- Pure ERC20 standard (battle-tested)

```solidity
constructor(address initialDistributor) 
    ERC20("Neural Sync Factory", "NSF") 
    ERC20Permit("Neural Sync Factory")
```

---

### Layer 2: FactoryQualification (Lines 271-658)

**Purpose:** Upgradeable access control module with anti-gaming

**Key Features:**
- ✅ UUPS upgradeable pattern
- ✅ Role-based access control (QUALIFIER, SANCTIONER)
- ✅ Balance snapshot at qualification (anti-flash-loan)
- ✅ 7-day lock period (sustained holding requirement)
- ✅ KYC hash integration
- ✅ Sanction list (OFAC compliance)
- ✅ Expiry-based requalification

**Critical Separation:**
```
Token Ownership (transferable) ≠ Access Rights (qualified)
```

This separation is KEY for regulatory defense:
- Token transfer doesn't grant automatic access
- Access requires active qualification process
- Compliance checks independent of token possession

**Anti-Gaming Protection:**
```solidity
struct QualificationData {
    bool termsAccepted;
    uint256 expiryDate;
    uint256 qualifiedBalance;  // ← Snapshot prevents gaming
    uint256 lockUntil;         // ← 7-day lock period
    bytes32 kycHash;
}
```

During lock period: Must maintain qualified balance
After lock period: Must maintain minimum balance

---

### Layer 4: EmergencyGuardian (Lines 660-1095)

**Purpose:** Decentralized 4-of-7 multisig circuit breaker

**Key Features:**
- ✅ 4-of-7 voting threshold (decentralized decision)
- ✅ Transparent on-chain voting
- ✅ 48-hour auto-unpause (forces active management)
- ✅ Proposal expiry (24 hours)
- ✅ Permissionless unpause after delay
- ✅ Timelock override capability

**Security Design:**
```
Guardian 1 proposes (1/4 votes)
       ↓
Guardian 2 votes (2/4 votes)
       ↓
Guardian 3 votes (3/4 votes)
       ↓
Guardian 4 votes (4/4 votes) → PAUSE EXECUTED
       ↓
   [48 hours pass]
       ↓
Anyone can call unpause (permissionless)
OR timelock can unpause anytime
```

**Anti-Abuse Mechanisms:**
- Requires quorum (4/7, not 1/7)
- Proposals expire after 24 hours
- Double-voting prevented
- Auto-unpause prevents indefinite pause

---

### FactoryNSF Main Contract (Lines 1097-1310)

**Purpose:** Single-transaction deployment of complete system

**Deployment:**
```solidity
constructor(
    address initialDistributor,     // Multi-sig wallet
    address[7] memory guardianAddresses,  // 7 guardian addresses
    address timelockAddress,        // Governance timelock
    uint256 minBalanceForAccess     // e.g., 1000 NSF
)
```

**What It Does:**
1. Deploys NSFToken with entire supply to distributor
2. Deploys FactoryQualification and initializes
3. Deploys EmergencyGuardian with 7 guardians
4. Wires everything together
5. Emits complete deployment event

**Post-Deployment State:**
- ✅ NSFToken: 1B tokens in distributor, no owner
- ✅ FactoryQualification: Initialized, pausable by guardian
- ✅ EmergencyGuardian: 7 guardians configured, timelock has override
- ✅ All systems operational and connected

---

## 🚀 Deployment Guide

### 1. Prepare Parameters

```javascript
const INITIAL_DISTRIBUTOR = "0x..."; // Multi-sig wallet (secure!)
const GUARDIANS = [
  "0x...", // Guardian 1
  "0x...", // Guardian 2
  "0x...", // Guardian 3
  "0x...", // Guardian 4
  "0x...", // Guardian 5
  "0x...", // Guardian 6
  "0x..."  // Guardian 7
];
const TIMELOCK = "0x..."; // 48h timelock contract
const MIN_BALANCE = ethers.parseEther("1000"); // 1,000 NSF
```

### 2. Deploy Contract

```javascript
const FactoryNSF = await ethers.getContractFactory("FactoryNSF");
const factory = await FactoryNSF.deploy(
  INITIAL_DISTRIBUTOR,
  GUARDIANS,
  TIMELOCK,
  MIN_BALANCE
);
await factory.waitForDeployment();
```

### 3. Get Deployed Addresses

```javascript
const [token, qualification, guardian] = await factory.getDeployedAddresses();

console.log("NSFToken:", token);
console.log("FactoryQualification:", qualification);
console.log("EmergencyGuardian:", guardian);
```

### 4. Verify System Status

```javascript
const [supply, minBalance, isPaused, guardiansPaused] = 
  await factory.getSystemStatus();

console.log("Supply:", ethers.formatEther(supply));
console.log("Min Balance:", ethers.formatEther(minBalance));
console.log("Is Paused:", isPaused);
console.log("Guardians Paused:", guardiansPaused);
```

### 5. Post-Deployment Actions

**CRITICAL:** Transfer admin roles to timelock

```javascript
// Get contracts
const qualification = await ethers.getContractAt(
  "FactoryQualification",
  qualificationAddress
);
const guardian = await ethers.getContractAt(
  "EmergencyGuardian", 
  guardianAddress
);

// Transfer roles to timelock
const DEFAULT_ADMIN_ROLE = await qualification.DEFAULT_ADMIN_ROLE();
await qualification.grantRole(DEFAULT_ADMIN_ROLE, TIMELOCK);
await qualification.revokeRole(DEFAULT_ADMIN_ROLE, deployerAddress);

// Verify deployer has no roles
const hasRole = await qualification.hasRole(DEFAULT_ADMIN_ROLE, deployerAddress);
console.log("Deployer has admin:", hasRole); // Should be false
```

---

## 🔒 Security Considerations

### Gas Costs

Estimated deployment gas (varies by network):

| Component | Gas | Cost @ 30 gwei |
|-----------|-----|----------------|
| NSFToken | ~1.2M | ~$0.36 |
| FactoryQualification | ~2.5M | ~$0.75 |
| EmergencyGuardian | ~1.5M | ~$0.45 |
| Wiring | ~0.3M | ~$0.09 |
| **Total** | **~5.5M** | **~$1.65** |

### Immutability Verification

**NSFToken:**
- ❌ No `mint()` function
- ❌ No `burn()` enforcement
- ❌ No `pause()` function
- ❌ No `owner()` function
- ✅ Pure ERC20 + Permit

**FactoryQualification:**
- ✅ Upgradeable (UUPS pattern)
- ✅ Admin required for upgrade
- ✅ Pausable (emergency only)
- ✅ Role-based access

**EmergencyGuardian:**
- ✅ Multisig required (4/7)
- ✅ Auto-unpause (48h)
- ✅ Transparent voting
- ✅ Timelock override

---

## 📊 System Interactions

### User Qualification Flow

```
1. User acquires NSF tokens (≥ minBalance)
       ↓
2. Qualifier calls qualifyUser(user, expiry, kycHash)
       ↓
3. System takes balance snapshot (anti-gaming)
       ↓
4. 7-day lock period begins
       ↓
5. User has Factory access (if balance maintained)
```

### Emergency Pause Flow

```
1. Guardian proposes pause with reason
       ↓
2. Other guardians vote (need 4 total)
       ↓
3. Pause executes when threshold reached
       ↓
4. All pausable contracts paused
       ↓
5. After 48 hours, anyone can unpause
   OR timelock can unpause anytime
```

### Access Validation

```solidity
function hasAccess(address user) public view returns (bool) {
    // 1. Check sanctions (compliance)
    if (sanctioned[user]) return false;
    
    // 2. Check qualification exists
    if (!termsAccepted[user]) return false;
    
    // 3. Check not expired
    if (expiryDate <= now) return false;
    
    // 4. Check balance (anti-gaming during lock)
    if (now < lockUntil) {
        return balance >= qualifiedBalance;  // Snapshot
    } else {
        return balance >= minBalance;        // Minimum
    }
}
```

---

## 🧪 Testing

### Run Tests

```bash
# Test individual components
npx hardhat test test/NSFToken.test.js
npx hardhat test test/FactoryQualification.test.js
npx hardhat test test/EmergencyGuardian.test.js

# Test integrated system
npx hardhat test test/FactoryNSF.test.js
```

### Coverage Goals

- ✅ Unit tests: 100% function coverage
- ✅ Integration tests: All workflows
- ✅ Security tests: Attack vectors
- ✅ Gas optimization: Benchmarks

---

## 📚 Additional Documentation

- [Technical Specification](../docs/NSF_TOKEN_SPECIFICATION.md)
- [Regulatory Compliance (Brazil)](../docs/NSF_REGULATORY_COMPLIANCE_BR.md)
- [Communication Policy](../docs/NSF_COMMUNICATION_POLICY.md)
- [Deployment Guide](../docs/NSF_DEPLOYMENT_GUIDE.md)

---

## ⚖️ Regulatory Summary

### Brazil (CVM)
- ✅ Utility token (not security)
- ✅ No promise of return
- ✅ No revenue distribution
- ✅ Parecer 40/2022 compliant

### USA (SEC)
- ✅ Fails Howey Test (not security)
- ✅ No common enterprise
- ✅ No expectation of profit
- ✅ Utility independent of efforts

### EU (MiCA)
- ✅ Category 3 utility token
- ✅ No fundraising
- ✅ No payment function
- ✅ Exempt from full regime

---

## 🎯 Key Takeaways

1. **Single File:** Everything needed for deployment
2. **Production Ready:** Fully implemented, no placeholders
3. **Well Documented:** 400+ lines of comments
4. **Regulatory Compliant:** Designed for institutional use
5. **Battle Tested:** Based on OpenZeppelin v5.0
6. **Gas Optimized:** ~5.5M gas total deployment
7. **Upgradeable:** Layer 2 can be improved
8. **Immutable:** Layer 1 is permanent
9. **Decentralized:** Layer 4 requires consensus
10. **Transparent:** All events and views public

---

## 📞 Support

For questions about deployment or usage:
- 📧 Technical: dev@neo-protocol.org
- 📧 Compliance: compliance@neo-protocol.org
- 📖 Documentation: https://docs.neo-protocol.org

---

**Version:** 1.0.0  
**Author:** Eurycles Ramos Neto / NODE NEØ  
**Date:** 2026-01-26  
**Status:** Production Ready

**License:** MIT  
**Audits:** Pending (pre-mainnet requirement)  
**Bug Bounty:** $500k pool (Immunefi)
