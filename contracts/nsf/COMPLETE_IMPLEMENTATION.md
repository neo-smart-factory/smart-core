# NSF Complete System - Implementation Guide

## 🎯 Overview

The Neural Sync Factory (NSF) coordination protocol is now **complete** with all 4 layers implemented:

- **Layer 1**: NSFToken - Immutable ERC20 token with governance support
- **Layer 2**: FactoryQualification - Upgradeable access control
- **Layer 3**: NSFGovernance + TimelockController - Limited-scope governance
- **Layer 4**: EmergencyGuardian - Decentralized circuit breaker

## 📦 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NSF COORDINATION PROTOCOL                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: NSFToken (Immutable)                              │
│  ├─ Fixed supply: 1 billion NSF                             │
│  ├─ No owner, no mint capability                            │
│  ├─ ERC20Votes for governance                               │
│  └─ Delegation-based voting power                           │
│                                                              │
│  Layer 3: Governance (Limited Scope)                        │
│  ├─ TimelockController (48h delay)                          │
│  ├─ NSFGovernance (whitelist-based)                         │
│  ├─ Voting: 1 day delay, 3 day period                       │
│  └─ Quorum: 10%, Threshold: 100k NSF                        │
│                                                              │
│  Layer 2: FactoryQualification (Upgradeable)                │
│  ├─ Access control with anti-gaming                         │
│  ├─ KYC/AML integration                                     │
│  ├─ Sanction list support                                   │
│  └─ Balance snapshot system                                 │
│                                                              │
│  Layer 4: EmergencyGuardian (Circuit Breaker)               │
│  ├─ 4-of-7 multisig voting                                  │
│  ├─ Transparent on-chain proposals                          │
│  ├─ Auto-unpause after 48 hours                             │
│  └─ Timelock override capability                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Deployment

### Prerequisites

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Deploy Complete System

```bash
# Deploy to testnet
npx hardhat run scripts/deployCompleteNSF.js --network baseSepolia

# Deploy to mainnet (after audits!)
npx hardhat run scripts/deployCompleteNSF.js --network base
```

### Environment Variables

```bash
# Required for mainnet
PRIVATE_KEY=your_private_key_here
DISTRIBUTOR_ADDRESS=0x... # Multi-sig wallet

# Guardian addresses (7 required)
GUARDIAN_1=0x...
GUARDIAN_2=0x...
GUARDIAN_3=0x...
GUARDIAN_4=0x...
GUARDIAN_5=0x...
GUARDIAN_6=0x...
GUARDIAN_7=0x...

# Network RPC
BASE_RPC=https://mainnet.base.org
BASESCAN_KEY=your_api_key
```

## 🔧 Configuration

### Governance Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Voting Delay | 1 day | Time before voting starts |
| Voting Period | 3 days | Duration of voting |
| Proposal Threshold | 100,000 NSF | Min tokens to propose |
| Quorum | 10% | Min participation required |
| Timelock Delay | 48 hours | Execution delay |

### Access Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Min Balance | 1,000 NSF | Min tokens for access |
| Lock Period | 7 days | Anti-gaming lock |
| Qualification | Manual | KYC required |

### Emergency Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Guardian Count | 7 | Total guardians |
| Pause Threshold | 4 | Votes needed to pause |
| Auto-Unpause | 48 hours | Forced unpause time |

## 📝 Usage Guide

### For Token Holders

#### 1. Delegate Voting Power

Before participating in governance, you must delegate your voting power:

```javascript
// Delegate to yourself
await nsfToken.delegate(yourAddress);

// Or delegate to someone else
await nsfToken.delegate(delegateAddress);
```

#### 2. Create a Proposal

Requirements:
- Have ≥ 100,000 NSF voting power (delegated)
- Function must be whitelisted

```javascript
// Example: Propose to change min balance
const newMinBalance = ethers.parseEther("2000");
const calldata = factoryQualification.interface.encodeFunctionData(
    "setMinBalance",
    [newMinBalance]
);

await governance.propose(
    [qualificationAddress],
    [0],
    [calldata],
    "Proposal: Increase minimum balance to 2000 NSF"
);
```

#### 3. Vote on Proposals

```javascript
// 0 = Against, 1 = For, 2 = Abstain
await governance.castVote(proposalId, 1);

// With reason
await governance.castVoteWithReason(
    proposalId, 
    1, 
    "Supporting this change"
);
```

#### 4. Execute Proposals

After voting period ends and proposal succeeds:

```javascript
// Queue (anyone can call)
await governance.queue(
    targets,
    values,
    calldatas,
    descriptionHash
);

// Wait for timelock delay (48 hours)

// Execute (anyone can call)
await governance.execute(
    targets,
    values,
    calldatas,
    descriptionHash
);
```

### For Administrators

#### Add Votable Functions

Only whitelisted functions can be voted on. To add a new function:

```javascript
// 1. Encode the addVotableFunction call
const selector = factoryQualification.interface
    .getFunction("setMinBalance").selector;

const addVotableCall = governance.interface.encodeFunctionData(
    "addVotableFunction",
    [selector, "setMinBalance(uint256)"]
);

// 2. Schedule via timelock
await timelock.schedule(
    governanceAddress,
    0,
    addVotableCall,
    ethers.ZeroHash,
    ethers.ZeroHash,
    TIMELOCK_DELAY
);

// 3. Wait 48 hours

// 4. Execute
await timelock.execute(
    governanceAddress,
    0,
    addVotableCall,
    ethers.ZeroHash,
    ethers.ZeroHash
);
```

#### Qualify Users

```javascript
const expiryDate = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year
const kycHash = ethers.keccak256(ethers.toUtf8Bytes("kyc_proof_data"));

await factoryQualification.qualifyUser(
    userAddress,
    expiryDate,
    kycHash
);
```

### For Guardians

#### Propose Emergency Pause

```javascript
await emergencyGuardian.proposeEmergencyPause(
    "Security vulnerability detected in module X"
);
```

#### Vote on Emergency Pause

```javascript
await emergencyGuardian.voteEmergencyPause(proposalId);
```

When 4 of 7 guardians vote, the system automatically pauses.

#### Unpause System

After 48 hours, anyone can unpause:

```javascript
await emergencyGuardian.unpause("System verified secure");
```

Or timelock can unpause anytime:

```javascript
// Via timelock
const unpauseCall = emergencyGuardian.interface
    .encodeFunctionData("unpause", ["Emergency resolved"]);

await timelock.schedule(...);
// wait
await timelock.execute(...);
```

## 🧪 Testing

### Run All Tests

```bash
# Run all NSF tests
npx hardhat test test/NSFToken.test.js
npx hardhat test test/FactoryQualification.test.js
npx hardhat test test/NSFGovernance.test.js
npx hardhat test test/EmergencyGuardian.test.js

# Run integration tests (when network allows)
npx hardhat test test/CompleteNSF.integration.test.js
```

### Test Coverage

Expected coverage:
- NSFToken: 100% (immutable, simple)
- FactoryQualification: 95%+
- NSFGovernance: 90%+
- EmergencyGuardian: 95%+

## 🔒 Security

### Pre-Deployment

- [ ] Complete smart contract audit (3 firms recommended)
- [ ] Formal verification (Certora/Runtime Verification)
- [ ] Economic modeling and game theory analysis
- [ ] Legal compliance review (US, EU, Brazil)
- [ ] Bug bounty program setup ($500k+ recommended)

### Post-Deployment

- [ ] Verify all contracts on block explorer
- [ ] Monitor guardian addresses
- [ ] Set up monitoring/alerting system
- [ ] Document emergency procedures
- [ ] Regular security reviews

### Known Limitations

1. **OpenZeppelin Version**: Currently using 5.0.2 for Solidity 0.8.20 compatibility
2. **Compiler Network**: May require local setup due to network restrictions
3. **Test Coverage**: Integration tests pending network access for compilation

## 📚 Documentation

### Contract Documentation

- [NSFToken](./contracts/nsf/NSFToken.sol) - Layer 1: Immutable token
- [NSFGovernance](./contracts/nsf/NSFGovernance.sol) - Layer 3: Governance
- [FactoryQualification](./contracts/nsf/FactoryQualification.sol) - Layer 2: Access
- [EmergencyGuardian](./contracts/nsf/EmergencyGuardian.sol) - Layer 4: Circuit breaker
- [CompleteNSFDeployer](./contracts/nsf/CompleteNSFDeployer.sol) - Deployment helper

### Regulatory Documentation

See issue #7 for complete regulatory positioning and compliance framework.

Key points:
- NOT a security under Howey Test
- Utility token classification (CVM, MiCA)
- No promise of financial return
- Access coordination only

## 🎯 Roadmap

### Phase 1: Foundation (Complete ✅)
- [x] NSFToken implementation
- [x] FactoryQualification implementation
- [x] EmergencyGuardian implementation
- [x] NSFGovernance implementation
- [x] Complete integration

### Phase 2: Deployment (Next)
- [ ] Security audits (3 firms)
- [ ] Formal verification
- [ ] Legal opinions (3 jurisdictions)
- [ ] Bug bounty program
- [ ] Testnet deployment
- [ ] Mainnet deployment

### Phase 3: Operations
- [ ] Token distribution
- [ ] User qualification process
- [ ] Governance activation
- [ ] FactoryCore integration

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - See [LICENSE](../../LICENSE)

## 🆘 Support

For technical support:
- GitHub Issues: [Report bugs](https://github.com/neo-smart-token-factory/smart-core/issues)
- Documentation: [Full docs](../../docs/)

For security issues:
- Email: security@neo-protocol.org
- DO NOT open public issues for security vulnerabilities

---

**Version**: 2.0.0 (Complete Implementation)  
**Author**: Eurycles Ramos Neto / NODE NEØ  
**Date**: 2026-01-27  
**Status**: Implementation Complete, Pending Audits
