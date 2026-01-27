# NSF Invariants · v1.0

These invariants MUST always hold. Any violation indicates a critical bug or attack.

---

## Token Invariants

### I-T1: Fixed Supply
```
MUST: totalSupply() == 1_000_000_000 * 10**18
```
The total supply must always equal exactly 1 billion NSF tokens.
No minting or burning should change this value.

### I-T2: No Owner
```
MUST: NSFToken has no owner() or Ownable pattern
```
The token contract must have no privileged ownership role.

### I-T3: No Mint Capability
```
MUST: No mint() function exists or is disabled
MUST: MINT_RENOUNCED == true
```
No mechanism to create additional tokens can exist.

### I-T4: Voting Power Conservation
```
MUST: sum of all voting power == totalSupply()
```
The total voting power across all checkpoints equals total supply.

---

## Governance Invariants

### I-G1: Whitelist Enforcement
```
MUST: propose() reverts for any non-whitelisted selector
```
Governance cannot propose execution of functions not explicitly whitelisted.

### I-G2: No Treasury Access
```
MUST: No transfer(), transferFrom(), or approve() in whitelist
```
Governance cannot access token movement functions.

### I-G3: No Upgrade Access
```
MUST: upgradeToAndCall() not whitelisted
MUST: Only admin (timelock) can upgrade
```
Governance cannot upgrade contracts.

### I-G4: No Role Management
```
MUST: grantRole(), revokeRole() not whitelisted
```
Governance cannot manipulate access control roles.

### I-G5: Proposal Threshold Enforced
```
MUST: propose() reverts if proposer votes < proposalThreshold()
```
Only addresses with sufficient voting power can create proposals.

### I-G6: Quorum Required
```
MUST: Proposal cannot succeed if total votes < quorum
```
Proposals without sufficient participation cannot pass.

---

## Timelock Invariants

### I-TL1: Positive Delay
```
MUST: getMinDelay() > 0
MUST: getMinDelay() >= 24 hours (recommended)
```
Timelock must enforce a non-zero delay before execution.

### I-TL2: Governance is Proposer
```
MUST: timelock.hasRole(PROPOSER_ROLE, governance) == true
```
The governance contract must have proposer role on timelock.

### I-TL3: Open Executor
```
MUST: EXECUTOR_ROLE granted to address(0) OR specific executors only
```
Either anyone can execute after delay, or only specific addresses.

### I-TL4: No Direct Admin Functions
```
MUST: Protected contracts have no functions callable without timelock
```
Critical functions must route through timelock.

---

## Qualification Invariants

### I-Q1: Lock Period Enforced
```
MUST: User cannot pass hasAccess() if now < lockUntil
```
Anti-gaming lock period must be respected.

### I-Q2: Min Balance Enforced
```
MUST: hasAccess() returns false if balance < minBalanceForAccess
```
Minimum balance requirement must be enforced.

### I-Q3: Admin is Timelock
```
MUST: hasRole(DEFAULT_ADMIN_ROLE, timelock) == true
MUST: No other address has DEFAULT_ADMIN_ROLE
```
Only timelock can be admin of FactoryQualification.

### I-Q4: Upgrade Path Protected
```
MUST: _authorizeUpgrade() requires DEFAULT_ADMIN_ROLE
```
Only admin (timelock) can authorize upgrades.

### I-Q5: Sanction Enforcement
```
MUST: hasAccess() returns false if sanctioned[user] == true
```
Sanctioned users cannot have access.

---

## Guardian Invariants

### I-E1: Pause Has Maximum Duration
```
MUST: Auto-unpause occurs at pausedAt + AUTO_UNPAUSE_DELAY
MUST: AUTO_UNPAUSE_DELAY == 48 hours
```
System cannot remain paused indefinitely.

### I-E2: Quorum Required
```
MUST: Pause requires >= PAUSE_THRESHOLD guardian votes
MUST: PAUSE_THRESHOLD >= 4 (for 7 guardians)
```
Multiple guardians must agree to emergency pause.

### I-E3: Guardian Count Fixed
```
MUST: Number of guardians == 7 at deployment
```
Guardian count is established at deployment.

### I-E4: No Permanent Disable
```
MUST: unpause() callable after AUTO_UNPAUSE_DELAY
MUST: unpause() callable by timelock anytime
```
System can always be unpaused.

---

## Cross-Contract Invariants

### I-X1: Role Separation
```
MUST: Governance cannot be admin of protected contracts
MUST: Guardian cannot be proposer on timelock
MUST: Deployer has no roles post-deployment
```
Roles must be properly separated to prevent privilege escalation.

### I-X2: Timelock Integration
```
MUST: All admin actions on protected contracts go through timelock
MUST: Timelock delay always enforced for admin actions
```
No backdoor to bypass timelock delay.

### I-X3: Event Emission
```
MUST: All state changes emit events
MUST: Role changes emit events
MUST: Proposals emit events
```
All critical operations must be traceable.

---

## Economic Invariants

### I-E1: Proposal Cost
```
MUST: proposalThreshold >= 100_000 * 10**18
```
Creating proposals must be expensive enough to prevent spam.

### I-E2: Quorum Feasibility
```
MUST: quorum <= 20% of totalSupply
```
Quorum must be achievable with reasonable participation.

---

## Deployment Invariants

### I-D1: Deployer Renunciation
```
MUST: After deployment, deployer has no roles
MUST: Deployer cannot call admin functions
```
Deployer must renounce all privileges.

### I-D2: Initial State Valid
```
MUST: All contracts deployed and initialized
MUST: All roles correctly assigned
MUST: All integrations working
```
System must be in valid state post-deployment.

---

## Testing Invariants

These should be validated in test suite:

### Unit Tests
- [ ] Token supply never changes
- [ ] No owner exists on token
- [ ] Whitelist enforcement works
- [ ] Timelock delay enforced
- [ ] Lock period enforced
- [ ] Guardian quorum required

### Integration Tests
- [ ] Full governance flow works
- [ ] Emergency pause/unpause works
- [ ] Qualification checks work
- [ ] Role separation maintained

### Fuzzing Tests
- [ ] No function calls can bypass whitelist
- [ ] No arithmetic overflows
- [ ] No reentrancy vulnerabilities
- [ ] No state corruption

---

## Runtime Monitoring

Recommended invariant monitoring in production:

**Critical (Alert immediately):**
- Token totalSupply changed
- Unauthorized role granted
- Timelock delay reduced
- Guardian count changed
- Non-whitelisted function proposed

**Important (Alert within 1 hour):**
- Proposal with low quorum passed
- Emergency pause initiated
- Qualification parameters changed
- Large delegation changes

**Informational (Log for analysis):**
- New proposals created
- Votes cast
- Proposals executed
- Access qualifications granted

---

## Invariant Violation Response

If invariant violated:

1. **Immediate**: Pause system via guardian
2. **1 hour**: Assess root cause
3. **6 hours**: Coordinate response
4. **24 hours**: Deploy fix or mitigation
5. **1 week**: Post-mortem and lessons learned

---

**Version:** 1.0  
**Last Updated:** 2026-01-27  
**Status:** Active invariant specification for NSF v2.0  
**Enforcement:** Should be validated in tests and runtime monitoring
