# NSF Deployment Checklist · v1.0

---

## Pre-Deployment

### Code Preparation
- [ ] All contracts finalized and reviewed
- [ ] Code comments complete and accurate
- [ ] NatSpec documentation complete
- [ ] README and guides up to date
- [ ] Constitution and governance docs finalized

### Testing
- [ ] Unit tests passing (100% for critical functions)
- [ ] Integration tests passing
- [ ] Governance flow end-to-end test complete
- [ ] Emergency pause/unpause tested
- [ ] Qualification flow tested
- [ ] Coverage report generated (>90% recommended)
- [ ] Fuzz testing completed (if applicable)
- [ ] Gas optimization reviewed

### Security
- [ ] Internal code review completed
- [ ] External audit scheduled/completed (3 firms recommended)
- [ ] Formal verification completed (if applicable)
- [ ] Threat model reviewed
- [ ] Invariants documented and tested
- [ ] Known issues documented
- [ ] Bug bounty program prepared

### Legal & Compliance
- [ ] Legal opinion obtained (US)
- [ ] Legal opinion obtained (EU)
- [ ] Legal opinion obtained (Brazil/relevant jurisdictions)
- [ ] Regulatory compliance documentation complete
- [ ] Terms of service prepared
- [ ] Privacy policy prepared

### Infrastructure
- [ ] Deployment scripts tested on testnet
- [ ] Multi-sig wallets prepared
- [ ] Guardian addresses identified and confirmed
- [ ] Initial distributor wallet prepared
- [ ] RPC endpoints configured and tested
- [ ] Block explorer API keys obtained
- [ ] Monitoring infrastructure ready

### Parameters
- [ ] Initial distributor address confirmed
- [ ] 7 guardian addresses confirmed and verified
- [ ] Minimum balance parameter set (default: 1000 NSF)
- [ ] Timelock delay confirmed (default: 48 hours)
- [ ] Deployment gas costs estimated
- [ ] Network selection finalized

---

## Deployment (Testnet)

### Initial Deployment
- [ ] Fund deployer wallet with sufficient ETH/MATIC/etc
- [ ] Deploy CompleteNSFDeployer contract
- [ ] Verify deployment transaction succeeded
- [ ] Record deployment transaction hash
- [ ] Record CompleteNSFDeployer address

### Get Deployed Addresses
- [ ] Call `getDeployedAddresses()` to retrieve all contract addresses
- [ ] Record NSFToken address
- [ ] Record TimelockController address
- [ ] Record NSFGovernance address
- [ ] Record FactoryQualification address
- [ ] Record EmergencyGuardian address

### Verification
- [ ] Verify all contracts on block explorer
- [ ] Check bytecode matches compiled contracts
- [ ] Verify source code on explorer
- [ ] Check constructor arguments correct

### Role Verification
- [ ] Verify governance has PROPOSER role on timelock
  ```
  timelock.hasRole(PROPOSER_ROLE, governance) == true
  ```
- [ ] Verify timelock has admin role on qualification
  ```
  qualification.hasRole(DEFAULT_ADMIN_ROLE, timelock) == true
  ```
- [ ] Verify guardian has correct configuration
  ```
  guardian.getPausableContracts() includes qualification
  ```
- [ ] Verify deployer renounced all roles
  ```
  timelock.hasRole(DEFAULT_ADMIN_ROLE, deployer) == false
  ```

### System Integrity Check
- [ ] Call `verifySystemIntegrity()` on deployer
- [ ] Confirm returns `(true, [])` (no issues)
- [ ] If issues found, investigate and resolve

### Initial State Verification
- [ ] Token supply equals 1,000,000,000 NSF
- [ ] Token owner is address(0) or no owner
- [ ] Initial distributor received all tokens
- [ ] Min balance set correctly
- [ ] Timelock delay set correctly (48 hours)
- [ ] Voting delay set correctly (1 day)
- [ ] Voting period set correctly (3 days)
- [ ] Proposal threshold set correctly (100k NSF)
- [ ] Quorum set correctly (10%)
- [ ] Guardian count equals 7
- [ ] Pause threshold equals 4

---

## Post-Deployment (Testnet)

### Testing on Testnet
- [ ] Distribute test tokens to test accounts
- [ ] Test token transfers
- [ ] Test delegation functionality
- [ ] Test proposal creation (with sufficient voting power)
- [ ] Test voting on proposal
- [ ] Test proposal queuing
- [ ] Test timelock delay wait
- [ ] Test proposal execution
- [ ] Test guardian emergency pause proposal
- [ ] Test guardian voting on pause
- [ ] Test auto-unpause after 48 hours
- [ ] Test manual unpause via timelock
- [ ] Test user qualification flow
- [ ] Test access control enforcement

### Documentation
- [ ] Update deployment addresses in docs
- [ ] Create network-specific configuration file
- [ ] Document any issues encountered
- [ ] Update README with testnet info
- [ ] Create user guides for testnet

### Monitoring Setup
- [ ] Set up event monitoring
- [ ] Configure alerts for critical events
- [ ] Test alert system
- [ ] Create dashboard for system status

### Community
- [ ] Announce testnet deployment
- [ ] Provide testnet documentation
- [ ] Set up feedback channels
- [ ] Coordinate testnet participation

---

## Pre-Mainnet

### Final Preparation
- [ ] Testnet testing completed successfully
- [ ] All critical issues resolved
- [ ] All audit findings addressed
- [ ] Legal review completed
- [ ] Community feedback incorporated
- [ ] Final code freeze

### Mainnet Parameters Confirmed
- [ ] Production multi-sig address for initial distributor
- [ ] Production 7 guardian addresses
- [ ] Final minimum balance setting
- [ ] Final timelock delay (48 hours)
- [ ] Gas price strategy determined
- [ ] Deployment timing coordinated

### Security Final Check
- [ ] Re-run all tests on final code
- [ ] Re-verify no changes since audit
- [ ] Confirm audit report final
- [ ] Bug bounty program live
- [ ] Incident response plan ready
- [ ] Guardian contact verified

---

## Deployment (Mainnet)

### Pre-Deploy Checklist
- [ ] All pre-mainnet items complete
- [ ] Deployer wallet funded
- [ ] Team coordination call completed
- [ ] Communication plan ready
- [ ] Support channels staffed

### Deployment Execution
- [ ] Deploy CompleteNSFDeployer to mainnet
- [ ] **WAIT** - Do not proceed until verified
- [ ] Verify deployment succeeded
- [ ] Record all transaction hashes
- [ ] Record all deployed addresses

### Immediate Verification
- [ ] Call `getDeployedAddresses()`
- [ ] Verify all addresses non-zero
- [ ] Call `verifySystemIntegrity()`
- [ ] Verify returns `(true, [])`
- [ ] Verify all contracts on explorer
- [ ] Verify source code matches

### Role Verification (Critical)
- [ ] Governance is proposer on timelock
- [ ] Timelock is admin on qualification
- [ ] Timelock is admin on guardian
- [ ] Guardian linked to qualification
- [ ] **Deployer has NO roles** ⚠️ CRITICAL

### State Verification
- [ ] Total supply correct
- [ ] Distributor received tokens
- [ ] All parameters match expected
- [ ] No unexpected state

---

## Post-Deployment (Mainnet)

### Immediate Actions (0-24 hours)
- [ ] Announce deployment with addresses
- [ ] Update all documentation
- [ ] Activate monitoring systems
- [ ] Monitor for 24 hours continuously
- [ ] Check for any anomalies

### Token Distribution (24-72 hours)
- [ ] Begin controlled token distribution from multi-sig
- [ ] Document distribution plan
- [ ] Monitor for concentration issues
- [ ] Communicate with recipients

### Governance Activation (Week 1-2)
- [ ] Sufficient token distribution for quorum
- [ ] Community onboarding complete
- [ ] First votable function added (via timelock)
- [ ] Test proposal created (low risk)
- [ ] Community votes on test proposal
- [ ] Execute test proposal
- [ ] Verify governance works correctly

### Qualification Activation (Week 2-4)
- [ ] KYC/AML process defined
- [ ] Begin qualifying users
- [ ] Monitor access patterns
- [ ] Adjust parameters if needed (via governance)

### Long-term Monitoring (Ongoing)
- [ ] Weekly governance activity review
- [ ] Monthly security review
- [ ] Quarterly audit consideration
- [ ] Community feedback incorporation
- [ ] Incident response drills

---

## Emergency Procedures

### If Deployment Fails
1. Do NOT proceed with additional steps
2. Analyze failure cause
3. Fix issue in code/scripts
4. Re-audit if code changed
5. Re-deploy with new address

### If Role Assignment Wrong
1. Do NOT use contracts
2. Guardian pause if already in use
3. Deploy new system
4. Migrate if necessary

### If Critical Bug Found
1. Guardian emergency pause
2. Coordinate response team
3. Prepare fix
4. Audit fix
5. Deploy update via governance/timelock

---

## Post-Deployment Checklist Summary

**Sanity Checks** (Complete immediately):
- [ ] All addresses recorded
- [ ] All contracts verified
- [ ] Roles correctly assigned
- [ ] Deployer renounced
- [ ] System integrity valid
- [ ] Initial state correct

**First Week**:
- [ ] Monitoring active
- [ ] No critical issues
- [ ] Token distribution started
- [ ] Documentation complete
- [ ] Community activated

**First Month**:
- [ ] Governance tested
- [ ] Qualification working
- [ ] Guardian tested
- [ ] No security incidents
- [ ] Community engaged

---

## Deployment Team Responsibilities

**Deployer Operator**:
- Execute deployment scripts
- Verify transactions
- Record addresses
- Coordinate timing

**Security Lead**:
- Verify role assignments
- Check system integrity
- Monitor for issues
- Coordinate incident response

**Documentation Lead**:
- Update all docs
- Coordinate announcements
- Prepare guides
- Update repos

**Community Lead**:
- Coordinate communication
- Manage expectations
- Gather feedback
- Support users

---

**Version:** 1.0  
**Last Updated:** 2026-01-27  
**Status:** Active deployment checklist for NSF v2.0  
**Critical:** Complete ALL items before mainnet deployment
