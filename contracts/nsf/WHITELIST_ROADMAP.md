# NSF Whitelist Roadmap · v1.0

This document defines the progressive whitelist expansion strategy.

---

## Stage 0 — Frozen Governance (Bootstrap)
Goal: ensure the protocol cannot be harmed before real legitimacy forms.

Whitelist includes:
- (OPTIONAL) read-only operational toggles
- nothing that changes qualification or security

Rules:
- no whitelist expansion until testnet cycle completion

---

## Stage 1 — Qualification Tuning (Minimum viable coordination)
Goal: allow governance to tune access rules for coordination.

Whitelist candidates:
- `setMinBalance(uint256)`
- `setLockPeriod(uint256)` (if implemented)
- `setSanctionsPolicy(bool)` (if exists)
- `setKycRequirement(bool)` (if exists)

Strict rule:
- must not include any upgrade/role/timelock controls

---

## Stage 2 — Operational Optimization
Goal: allow governance to adjust coordination friction.

Whitelist candidates:
- quorum settings (if adjustable safely)
- threshold settings (proposal threshold only if safe)
- operational delays (never timelock delay below min)

---

## Stage 3 — Advanced Institutionalization
Goal: enable governance to evolve the protocol interface gradually.

Whitelist candidates:
- onboarding coordination parameters
- compliance integration parameters
- additional factory gating logic switches

Rule:
- must be preceded by audit cycle + community review

---

## Forbidden Forever (Hard ban)
Never whitelist:
- `upgradeTo` / `upgradeToAndCall`
- `grantRole` / `revokeRole` / `renounceRole`
- any treasury transfer method
- any token mint/burn method
- pause/unpause methods

---

## Whitelist Addition Process

### Step 1: Proposal
- Community member proposes function for whitelist
- Includes rationale, use cases, risk analysis
- Posted in governance forum for discussion

### Step 2: Review Period
- Minimum 7-day community review
- Technical review by core team
- Security review by auditors (if available)

### Step 3: Governance Vote
- Create governance proposal to add function
- Standard voting process (1 day delay, 3 day period)
- Requires quorum and majority

### Step 4: Timelock Execution
- If passed, queued in timelock
- 48-hour delay before execution
- Final verification window

### Step 5: Activation
- Function becomes votable
- Documented in governance UI
- Added to this roadmap

---

## Current Whitelist Status

### Stage 0 (Current)
**Active Functions**: None  
**Status**: Frozen governance during bootstrap phase  
**Next Review**: After testnet validation complete

### Stage 1 (Planned)
**Target Functions**:
- `FactoryQualification.setMinBalance(uint256)`

**Prerequisites**:
- [ ] Complete testnet cycle
- [ ] Security audit completion
- [ ] Community governance activation

**Timeline**: Q2 2026 (estimated)

---

## Whitelist Governance Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Minimum Review Period | 7 days | Allow community input |
| Voting Period | 3 days | Standard governance |
| Timelock Delay | 48 hours | Emergency review window |
| Required Quorum | 10% | Prevent low participation |
| Approval Threshold | 50% + 1 | Simple majority |

---

## Emergency Whitelist Removal

If a whitelisted function is found to be unsafe:

1. **Guardian Action**: Guardian can propose emergency pause
2. **Community Coordination**: Emergency governance vote to remove
3. **Timelock Override**: In extreme cases, timelock admin can act
4. **Post-Mortem**: Full analysis and documentation required

---

## Audit Requirements for Whitelist Expansion

Before adding any function to whitelist:

- [ ] Static analysis completed
- [ ] Dynamic testing completed
- [ ] Game theory analysis (if applicable)
- [ ] Legal compliance review
- [ ] Documentation updated
- [ ] Community signoff

---

## Version History

**v1.0** (2026-01-27)
- Initial roadmap
- Stage 0-3 definitions
- Process documentation
- Current status: Frozen governance
