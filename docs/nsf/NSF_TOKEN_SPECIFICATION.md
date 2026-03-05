# NSF Token - Technical Specification

## 📋 Executive Summary

The **NSF (Neural Sync Factory)** token is a protocol coordination instrument designed for institutional access qualification within the NEØ Smart Factory ecosystem. It is explicitly NOT a security or investment vehicle.

## 🎯 Design Philosophy

### Core Principle
> "The NSF is the cryptographic signature of participation in the Neural Sync Factory protocol, not a financial asset."

### Regulatory Positioning
- **NOT** an investment opportunity
- **NOT** a promise of financial return
- **NOT** equity participation
- **IS** an institutional coordination instrument
- **IS** a utility token for ecosystem access

## 🏗️ Architecture Overview

The NSF system consists of 4 independent layers:

```
┌─────────────────────────────────────────┐
│  LAYER 1: NSFToken                      │
│  - Fixed supply (1B tokens)             │
│  - No owner, no mint, immutable         │
│  - Pure ERC20 + ERC20Permit             │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  LAYER 2: FactoryQualification          │
│  - Upgradeable access control           │
│  - KYC/AML integration                  │
│  - Balance + qualification checks       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  LAYER 3: NSFGovernance (Future)        │
│  - Limited parameter voting             │
│  - Timelock-controlled                  │
│  - Non-financial decisions only         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  LAYER 4: EmergencyGuardian             │
│  - 4-of-7 multisig pause                │
│  - Auto-unpause after 48h               │
│  - Circuit breaker system               │
└─────────────────────────────────────────┘
```

## 📜 Layer 1: NSFToken Contract

### Key Features

#### Fixed Supply
```solidity
uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
```
- Supply is minted once at deployment
- No mint function exists
- No admin can create more tokens
- Immutable and permanent

#### No Owner
- Contract has NO owner role
- Contract has NO admin functions
- Contract CANNOT be modified after deployment
- Complete power renunciation

#### ERC20Permit Support
- Gasless transactions enabled
- Account Abstraction ready
- EIP-2612 compliant
- Reduces gas costs for users

### Technical Specifications

| Property | Value |
|----------|-------|
| Name | Neural Sync Factory |
| Symbol | NSF |
| Decimals | 18 |
| Total Supply | 1,000,000,000 |
| Standard | ERC20, ERC20Permit |
| Upgradeable | No |
| Owner | None |
| Mint Function | None |
| Burn Function | User-controlled only |

### Constructor Parameters

```solidity
constructor(address initialDistributor)
```

- `initialDistributor`: Address that receives entire supply for distribution
- Must not be zero address
- Cannot be changed after deployment

### Public Functions

#### View Functions

```solidity
function decimals() public pure returns (uint8)
```
Returns 18 (standard ERC20 decimals)

```solidity
function getTokenInfo() external view returns (
    string memory name,
    string memory symbol,
    uint256 supply,
    uint256 deploymentTime,
    bool mintRenounced
)
```
Returns complete token metadata for institutional verification

## 📜 Layer 2: FactoryQualification Contract

### Purpose
Separates token ownership from access rights, critical for regulatory compliance.

### Key Features

#### Qualification System
- Users must be explicitly qualified for Factory access
- Qualification requires:
  - Minimum NSF balance
  - Terms acceptance
  - KYC verification
  - Active qualification (not expired)

#### Anti-Gaming Protection
```solidity
uint256 public constant BALANCE_LOCK_PERIOD = 7 days;
```
- Prevents flash loan attacks
- Requires sustained token holding
- Validates genuine participation

#### Compliance Integration
- Sanction list management (OFAC, etc.)
- KYC hash verification
- Expiry-based requalification
- Audit trail via events

### Access Control Roles

| Role | Purpose | Functions |
|------|---------|-----------|
| DEFAULT_ADMIN_ROLE | System administration | Upgrade, set parameters |
| QUALIFIER_ROLE | User qualification | Qualify/disqualify users |
| SANCTIONER_ROLE | Compliance enforcement | Sanction/unsanction users |

### Core Functions

#### qualifyUser
```solidity
function qualifyUser(
    address user,
    uint256 expiryDate,
    bytes32 kycProof
) external onlyRole(QUALIFIER_ROLE)
```
Qualifies user for Factory access after verification

#### hasAccess
```solidity
function hasAccess(address user) public view returns (bool)
```
Checks if user currently has valid Factory access

Validation checks:
1. Not sanctioned
2. Terms accepted
3. Qualification not expired
4. Sufficient NSF balance

#### setMinBalance
```solidity
function setMinBalance(uint256 newMinBalance) external onlyRole(DEFAULT_ADMIN_ROLE)
```
Updates minimum balance requirement (governance-controlled)

### Upgradeability

- Implements UUPS (Universal Upgradeable Proxy Standard)
- Only DEFAULT_ADMIN_ROLE can upgrade
- Preserves state across upgrades
- Transparent proxy pattern

## 📜 Layer 4: EmergencyGuardian Contract

### Purpose
Decentralized circuit breaker for emergency system pause

### Key Features

#### 4-of-7 Multisig
- 7 guardians total
- 4 votes required for pause
- Transparent voting on-chain
- No single point of failure

#### Auto-Unpause
```solidity
uint256 public constant AUTO_UNPAUSE_DELAY = 48 hours;
```
- Forces active monitoring
- Prevents indefinite pause
- Requires renewal for extended pause

#### Timelock Integration
- Timelock can unpause anytime
- Provides governance oversight
- Balances emergency response with control

### Workflow

```
Guardian 1 proposes pause + votes (1/4)
         ↓
Guardian 2 votes (2/4)
         ↓
Guardian 3 votes (3/4)
         ↓
Guardian 4 votes (4/4) → PAUSE EXECUTED
         ↓
    [48 hours pass]
         ↓
Any guardian OR timelock can unpause
```

## 🔒 Security Properties

### NSFToken Security
- ✅ No owner (zero attack surface)
- ✅ No mint function (supply manipulation impossible)
- ✅ No pause function (censorship resistant)
- ✅ Standard ERC20 (battle-tested code)
- ✅ Permit support (gasless, but user-controlled)

### FactoryQualification Security
- ✅ Upgradeable (bug fixes possible)
- ✅ Role-based access (separation of duties)
- ✅ Pausable (emergency stop)
- ✅ Balance lock period (anti-gaming)
- ✅ Sanction list (compliance)

### EmergencyGuardian Security
- ✅ Multisig requirement (decentralized)
- ✅ Transparent voting (on-chain audit trail)
- ✅ Auto-unpause (forces active management)
- ✅ Timelock override (governance control)

## 🧪 Testing Requirements

### Unit Tests
- [ ] NSFToken: deployment, transfers, permit
- [ ] FactoryQualification: qualification flow, access checks
- [ ] EmergencyGuardian: voting, pause/unpause

### Integration Tests
- [ ] Token + Qualification: access validation
- [ ] Guardian + Qualification: emergency pause
- [ ] Full system: end-to-end workflow

### Security Tests
- [ ] Reentrancy protection
- [ ] Access control validation
- [ ] Upgrade authorization
- [ ] Flash loan attack prevention

## 📊 Gas Estimates

| Operation | Estimated Gas |
|-----------|---------------|
| NSFToken deployment | ~1,200,000 |
| Transfer NSF | ~50,000 |
| Permit + Transfer | ~70,000 |
| Qualify user | ~150,000 |
| Check access | ~30,000 (view) |
| Emergency vote | ~80,000 |

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Audit by 3 independent firms
- [ ] Formal verification (Certora/Runtime Verification)
- [ ] Bug bounty program setup ($500k pool)
- [ ] Legal opinions (US, EU, Brazil)

### Deployment Order
```
1. NSFToken
   └─> Save address
2. TimelockController (48h delay)
   └─> Save address
3. FactoryQualification (proxy + implementation)
   ├─> Initialize with NSFToken address
   ├─> Transfer admin to Timelock
   └─> Save addresses
4. EmergencyGuardian
   ├─> Initialize with 7 guardians
   ├─> Add FactoryQualification as pausable
   └─> Save address
```

### Post-Deployment
- [ ] Verify all contracts on Etherscan/Polygonscan
- [ ] Transfer all admin roles to Timelock
- [ ] Publish security audit reports
- [ ] Document all addresses publicly

## 🔍 Audit Focus Areas

### Critical
1. NSFToken immutability verification
2. FactoryQualification upgrade authorization
3. EmergencyGuardian voting logic
4. Role-based access control

### Important
1. Balance lock period effectiveness
2. Qualification expiry handling
3. Sanction list enforcement
4. Event emission completeness

### Medium
1. Gas optimization
2. Error message clarity
3. View function accuracy
4. Documentation completeness

## 📚 References

- EIP-20: ERC20 Token Standard
- EIP-2612: Permit Extension for ERC20
- EIP-1967: Proxy Storage Slots
- OpenZeppelin Contracts v5.0
- UUPS Proxy Pattern

---

**Version:** 1.0  
**Author:** Eurycles Ramos Neto / NODE NEØ  
**Date:** 2026-01-26  
**Status:** Implementation Phase
