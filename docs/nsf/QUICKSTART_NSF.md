# 🚀 Quick Start Guide - NSF Token

## TL;DR

Deploy the complete NSF ecosystem with a single command:

```javascript
const FactoryNSF = await ethers.getContractFactory("FactoryNSF");
const factory = await FactoryNSF.deploy(
  distributorAddress,  // Multi-sig wallet
  [g1, g2, g3, g4, g5, g6, g7],  // 7 guardians
  timelockAddress,     // Governance timelock
  ethers.parseEther("1000")  // Min balance: 1000 NSF
);
```

That's it! Three contracts deployed and wired together.

---

## 📁 Files You Need

### Production Deployment
- **contracts/nsf/FactoryNSF.sol** - The ONLY file to deploy

### Documentation (Read First)
- **docs/NSF_IMPLEMENTATION_SUMMARY.md** - Start here
- **contracts/nsf/README.md** - Deployment details
- **docs/NSF_REGULATORY_COMPLIANCE_BR.md** - Legal positioning

### Testing
- **test/NSFToken.test.js** - Token tests
- **test/FactoryQualification.test.js** - Access control tests
- **test/EmergencyGuardian.test.js** - Circuit breaker tests

---

## ⚡ 5-Minute Deployment

### Step 1: Prepare Parameters

```javascript
// .env file
NSF_DISTRIBUTOR=0x1234...  # Multi-sig wallet
NSF_GUARDIAN_1=0x5678...
NSF_GUARDIAN_2=0x9abc...
NSF_GUARDIAN_3=0xdef0...
NSF_GUARDIAN_4=0x1234...
NSF_GUARDIAN_5=0x5678...
NSF_GUARDIAN_6=0x9abc...
NSF_GUARDIAN_7=0xdef0...
NSF_TIMELOCK=0x1234...     # 48h timelock
NSF_MIN_BALANCE=1000       # 1000 NSF
```

### Step 2: Deploy

```bash
npx hardhat run scripts/deploy_factory_nsf.js --network polygon
```

### Step 3: Get Addresses

```javascript
const [token, qualification, guardian] = 
  await factory.getDeployedAddresses();
```

### Step 4: Verify

```bash
npx hardhat verify --network polygon <FACTORY_ADDRESS> \
  "<DISTRIBUTOR>" \
  '["<G1>","<G2>","<G3>","<G4>","<G5>","<G6>","<G7>"]' \
  "<TIMELOCK>" \
  "1000000000000000000000"
```

Done! 🎉

---

## 🔑 Key Addresses After Deployment

Save these addresses:

```javascript
{
  "factory": "0x...",           // Main contract
  "nsfToken": "0x...",          // Layer 1: Token
  "qualification": "0x...",     // Layer 2: Access
  "guardian": "0x..."           // Layer 4: Emergency
}
```

---

## 🎯 Common Operations

### Qualify a User

```javascript
const qual = await ethers.getContractAt(
  "FactoryQualification", 
  qualificationAddress
);

const expiry = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // +1 year
const kycHash = ethers.id("kyc-proof-for-user");

await qual.qualifyUser(userAddress, expiry, kycHash);
```

### Check Access

```javascript
const hasAccess = await qual.hasAccess(userAddress);
console.log("User has access:", hasAccess);
```

### Emergency Pause (Guardian)

```javascript
const guardian = await ethers.getContractAt(
  "EmergencyGuardian",
  guardianAddress
);

// Propose pause
await guardian.connect(guardian1).proposeEmergencyPause("Critical bug detected");

// Get proposal ID
const proposalId = await guardian.activeProposalId();

// Vote (need 3 more guardians)
await guardian.connect(guardian2).voteEmergencyPause(proposalId);
await guardian.connect(guardian3).voteEmergencyPause(proposalId);
await guardian.connect(guardian4).voteEmergencyPause(proposalId);
// System paused automatically when 4th vote comes in
```

### Unpause (After 48h)

```javascript
// Anyone can call after 48 hours
await guardian.unpause("Issue resolved, system stable");
```

---

## 📊 System Status Check

```javascript
const [supply, minBalance, isPaused, guardiansPaused] = 
  await factory.getSystemStatus();

console.log("Total Supply:", ethers.formatEther(supply));
console.log("Min Balance:", ethers.formatEther(minBalance));
console.log("Qualification Paused:", isPaused);
console.log("Guardian System Paused:", guardiansPaused);
```

---

## 🧪 Run Tests

```bash
# All tests
npx hardhat test

# Specific test
npx hardhat test test/NSFToken.test.js

# With coverage
npx hardhat coverage
```

---

## ⚠️ Critical Reminders

### Before Mainnet
- [ ] Get 3 independent audits
- [ ] Run formal verification
- [ ] Set up $500k bug bounty
- [ ] Obtain legal opinions (3 jurisdictions)
- [ ] Choose 7 trusted guardians
- [ ] Deploy timelock (48h delay)
- [ ] Prepare multi-sig for distribution

### Security
- ✅ NSFToken has NO owner (can't be changed)
- ✅ Supply is FIXED (1B tokens forever)
- ✅ Qualification is UPGRADEABLE (bug fixes possible)
- ✅ Guardian requires 4-of-7 consensus
- ✅ Auto-unpause after 48h (prevents lock)

### Regulatory
- ✅ NOT a security (CVM, SEC, MiCA compliant)
- ✅ Utility token (access qualification only)
- ✅ NO promise of returns
- ✅ Read communication policy before ANY public statement

---

## 📚 Full Documentation

### Must Read (Before Deployment)
1. **NSF_IMPLEMENTATION_SUMMARY.md** - Executive summary
2. **contracts/nsf/README.md** - Technical details
3. **NSF_REGULATORY_COMPLIANCE_BR.md** - Legal framework

### Reference (During Operation)
4. **NSF_DEPLOYMENT_GUIDE.md** - Complete procedures
5. **NSF_COMMUNICATION_POLICY.md** - Public statements
6. **NSF_TOKEN_SPECIFICATION.md** - Technical specs

---

## 🆘 Support

### Technical Issues
- 📧 dev@neo-protocol.org
- 📖 GitHub Issues

### Compliance Questions
- 📧 compliance@neo-protocol.org
- 📞 Legal hotline

### Emergency (Security)
- 🚨 security@neo-protocol.org
- 🔐 PGP key available

---

## ✅ Deployment Checklist

```markdown
- [ ] Read NSF_IMPLEMENTATION_SUMMARY.md
- [ ] Prepare 7 guardian addresses
- [ ] Deploy timelock (48h delay)
- [ ] Prepare multi-sig distributor
- [ ] Set min balance parameter
- [ ] Deploy FactoryNSF.sol
- [ ] Verify all contracts
- [ ] Save all addresses
- [ ] Transfer admin to timelock
- [ ] Test qualification flow
- [ ] Test emergency pause
- [ ] Publish addresses publicly
- [ ] Begin user onboarding
```

---

## 🎉 You're Ready!

The NSF Foundation is production-ready. Follow the deployment checklist, get your audits, and launch with confidence.

**Remember:** 
> "O NSF é a primeira instância do Protocolo de Coordenação Neural. Não compre o token. Compre a tese."

---

**Version:** 1.0.0  
**Status:** Production Ready (Pending Audits)  
**Author:** NODE NEØ  
**Date:** 2026-01-26
