# NSF Threat Model · v1.0

---

## Assets
- Governance legitimacy
- Qualification integrity
- Protocol availability
- Upgrade safety boundaries
- Emergency correctness

---

## Trust Zones

### Untrusted
- **Token holders**: May act maliciously for profit
- **Delegates**: May be bribed or act against protocol interest
- **Proposers**: May attempt governance capture
- **External contracts**: May attempt reentrancy or manipulation

### Trusted (with constraints)
- **Timelock**: Trusted executor but constrained by delay
- **Guardian multisig**: Trusted for emergency but time-limited
- **Qualification admin**: Timelock-controlled, not independent
- **Auditors**: Review code but don't control execution

### Must Renounce
- **Deployer**: Must renounce all roles post-deployment

---

## Threats

### T1 — Governance Capture
**Vector:**
- Token concentration in single entity
- Delegate bribery/coercion
- Vote buying through OTC markets
- Sybil attacks via multiple addresses

**Impact:**
- Parameter sabotage (e.g., set minBalance to impossible values)
- Qualification criteria manipulation
- Protocol operational degradation

**Mitigation:**
- High proposal threshold (100k NSF = 0.01% supply)
- 10% quorum requirement
- Whitelist-only scope (limited damage surface)
- 1-day voting delay (detection window)
- Community monitoring

**Residual Risk:** Medium (requires significant capital)

---

### T2 — Flash-loan / Vote-buying Attacks
**Vector:**
- Flash loan to temporarily acquire voting power
- Borrow NSF, delegate to self, vote, return
- Rent voting power from holders
- Temporary balance injection

**Impact:**
- Proposal passes without long-term stakeholder support
- Parameter changes against protocol interest
- Governance legitimacy undermined

**Mitigation:**
- ERC20Votes checkpoint model (voting power snapshot at proposal creation)
- 7-day qualification lock prevents flash-loan gaming
- 1-day voting delay ensures checkpoint is stable
- Delegation tracked at historical block

**Residual Risk:** Low (checkpoint system prevents this)

---

### T3 — Timelock Bypass
**Vector:**
- Direct privileged role to contract functions
- PROPOSER role given to non-governance entity
- EXECUTOR role misconfigured
- Emergency override misused

**Impact:**
- Instant execution without community review
- Catastrophic parameter changes
- Upgrade attacks
- Complete protocol compromise

**Mitigation:**
- Only governance has PROPOSER role
- EXECUTOR is open (anyone after delay)
- Guardian override only for pause/unpause
- No direct admin functions on protected contracts
- Deployment verification checklist

**Residual Risk:** Very Low (if deployment correct)

---

### T4 — Guardian Abuse
**Vector:**
- Multisig collusion (4 of 7 guardians)
- Indefinite system pause
- Censorship of legitimate proposals
- Personal or political motives

**Impact:**
- Protocol unavailability
- User censorship
- Governance paralysis
- Ecosystem damage

**Mitigation:**
- On-chain transparent voting
- Auto-unpause after 48 hours (forced recovery)
- Constitution doctrine defines legitimate emergency
- Community can monitor guardian actions
- Guardian rotation possible via governance (if implemented)

**Residual Risk:** Low-Medium (48h max disruption)

---

### T5 — Upgradeability Backdoor (FactoryQualification)
**Vector:**
- UUPS upgrade mechanism misused
- Malicious implementation deployed
- Hidden capability injection
- Storage layout manipulation

**Impact:**
- Bypass qualification checks
- Grant unauthorized access
- Steal user data
- Compromise anti-gaming mechanisms

**Mitigation:**
- Upgrade path timelocked (48h delay)
- Only timelock can authorize upgrades
- Upgrade functions NOT whitelisted for governance
- Storage layout managed carefully
- Audit invariants checked

**Residual Risk:** Medium (inherent to upgradeability)

---

### T6 — Proposal Spam
**Vector:**
- Create numerous proposals to clutter governance
- DOS governance UI/monitoring
- Confuse voters with similar proposals

**Impact:**
- Governance fatigue
- Important proposals overlooked
- Community coordination costs increase

**Mitigation:**
- 100k NSF proposal threshold (expensive to spam)
- Proposal queue limits (if implemented)
- Community moderation tools

**Residual Risk:** Low (high cost)

---

### T7 — Sandwich Attacks on Governance
**Vector:**
- Front-run proposal creation with delegation
- Back-run proposal execution with state changes
- MEV exploitation during timelock execution

**Impact:**
- Unfair advantages to sophisticated actors
- Reduced governance legitimacy
- Value extraction from protocol

**Mitigation:**
- Checkpoint system prevents front-running votes
- Timelock delay provides detection window
- On-chain transparency enables monitoring

**Residual Risk:** Low-Medium (monitoring required)

---

### T8 — Quorum Manipulation
**Vector:**
- Large holder refuses to participate
- Coordinate non-participation to prevent quorum
- Strategic abstention attacks

**Impact:**
- Governance paralysis
- No proposals can pass
- Protocol ossification

**Mitigation:**
- 10% quorum (achievable but non-trivial)
- Community engagement incentives
- Alternative governance paths if needed

**Residual Risk:** Medium (social coordination problem)

---

### T9 — Reentrancy Attacks
**Vector:**
- Malicious token hooks during transfers
- Reentrancy during governance execution
- Cross-contract call manipulation

**Impact:**
- Double voting
- State corruption
- Unexpected behavior

**Mitigation:**
- OpenZeppelin contracts (reentrancy-safe)
- Checks-effects-interactions pattern
- No external calls during critical operations
- ERC20Votes uses safe patterns

**Residual Risk:** Very Low (OZ contracts)

---

### T10 — Oracle Manipulation (if KYC/sanctions use oracles)
**Vector:**
- Compromise KYC oracle
- False sanction reports
- Oracle downtime

**Impact:**
- Unauthorized access granted
- Legitimate users blocked
- Compliance failure

**Mitigation:**
- Multiple oracle sources (if implemented)
- Manual override capability via timelock
- Oracle data validation
- Fallback mechanisms

**Residual Risk:** Depends on oracle design

---

## Attack Surface Summary

| Component | Attack Surface | Risk Level |
|-----------|----------------|------------|
| NSFToken | Minimal (immutable) | Very Low |
| NSFGovernance | Medium (proposal spam, capture) | Low-Medium |
| TimelockController | Low (OZ standard) | Very Low |
| FactoryQualification | Medium (upgradeability) | Medium |
| EmergencyGuardian | Medium (abuse potential) | Low-Medium |

---

## Security Assumptions

The protocol security depends on:
1. OpenZeppelin contracts are secure (high confidence)
2. Solidity compiler is correct (high confidence)
3. EVM operates as specified (high confidence)
4. Guardian multisig is honest majority (trust assumption)
5. Community monitors governance actively (social assumption)
6. Economic security (100k NSF cost for proposals) (market assumption)

---

## Audit Focus Areas

Priority 1 (Critical):
- Governance proposal validation logic
- Whitelist enforcement mechanism
- Timelock integration
- Role management post-deployment

Priority 2 (High):
- UUPS upgrade safety
- Guardian emergency logic
- Checkpoint system integrity
- Quorum calculation

Priority 3 (Medium):
- Gas optimization
- Event emission completeness
- Error message clarity
- Documentation accuracy

---

## Incident Response Plan

If vulnerability discovered:

1. **Assessment** (0-2 hours)
   - Severity classification
   - Exploit feasibility evaluation
   - Affected components identification

2. **Coordination** (2-6 hours)
   - Guardian notification
   - Core team assembly
   - Communication preparation

3. **Response** (6-24 hours)
   - Guardian pause if needed
   - Emergency governance proposal
   - User communication

4. **Resolution** (24-72 hours)
   - Patch development
   - Audit of patch
   - Timelock execution

5. **Post-Mortem** (1-2 weeks)
   - Public disclosure
   - Lessons learned
   - Protocol improvements

---

**Version:** 1.0  
**Last Updated:** 2026-01-27  
**Status:** Active threat model for NSF v2.0
