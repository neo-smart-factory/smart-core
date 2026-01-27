# NSF CONSTITUTION · v1.0
Neural Sync Factory (NSF) Coordination Protocol  
NEØ Smart Factory

---

## 0. Status
This document is the canonical governance constitution for the NSF protocol.
It defines: scope, invariants, emergency doctrine, proposal constraints, and the legitimacy rules for coordination.

---

## 1. Purpose (Why NSF Exists)

NSF exists to provide a **coordination instrument** for the NEØ Smart Factory ecosystem.

It is NOT:
- a treasury distribution system
- an investment vehicle
- a profit-sharing mechanism
- a promise of return

It IS:
- a verifiable coordination layer
- a governance participation mechanism
- a qualification gate for protocol-level operations
- an alignment instrument for institutional execution

---

## 2. Core Principles (Non-Negotiable)

### P1 — Separation of Powers
Token ownership ≠ access rights  
Access rights ≠ financial returns  
Governance ≠ treasury control  
Utility ≠ investment

### P2 — Governance is Parameterized
Governance may only modify **explicitly whitelisted functions**.
If a function is not whitelisted, it is non-governable by definition.

### P3 — Emergency has expiry
Emergency powers are temporary, transparent, and time-limited:
- pause is allowed
- indefinite pause is forbidden
- auto-unpause restores baseline availability

### P4 — No silent upgrades
Upgradeable contracts must obey:
- timelock requirements
- role constraints
- audit trail requirements
No direct upgrade path bypassing governance and timelock is legitimate.

---

## 3. Governance Scope

### 3.1 What Governance MAY Change (Allowed Scope)
Only the following categories may be governed, subject to whitelist enforcement:

- Qualification parameters (non-financial)
  - minimum balance requirements
  - qualification lock periods
  - allowlist/sanctions list policy toggles (if designed as parameter)
  - KYC/AML integration toggles (if implemented as parameter)

- Protocol operational parameters
  - thresholds (non-treasury)
  - delays
  - config switches

- EmergencyGuardian policy parameters (only if implemented as parameters and explicitly whitelisted)
  - auto-unpause duration
  - guardian quorum threshold (if supported safely)

### 3.2 What Governance MUST NEVER Control (Forbidden Scope)
Governance is strictly forbidden from controlling:
- treasury / token distribution / funds movement
- minting/burning privileges
- contract upgrades
- role reassignment (admin/proposer/executor)
- pausing/unpausing system (guardian-only)
- security primitives (guardian, timelock ownership, privileged roles)

If any of these become technically possible, it is a protocol-level defect.

---

## 4. Proposal Doctrine

### 4.1 Proposal Requirements
Every proposal must include:
- a clear title + intent
- exact function calls + parameters
- rationale + expected effect
- risk analysis (min 3 risks)
- rollback procedure (if applicable)

### 4.2 Proposal Invalidity Conditions
A proposal is invalid if:
- it contains a non-whitelisted function selector
- it attempts role control / upgrade / treasury access
- it reduces timelock delay below safety minimum (if configured)
- it attempts to disable qualification integrity mechanisms

---

## 5. Whitelist Doctrine (Most Important Rule)

Whitelist is the canonical definition of "governable reality".

A function becomes governable only if:
1) it is added to the whitelist
2) addition happens via timelock
3) it passed community review window

Whitelist must be minimal by default.
Expansion must be slow and auditable.

---

## 6. EmergencyGuardian Doctrine

### 6.1 Emergency Definition
An emergency is ONLY:
- active exploit attempt
- severe protocol malfunction affecting integrity
- detected governance capture attempt
- sanctions / legal compliance incident requiring immediate action (if applicable)

Emergency is NOT:
- social conflict
- unpopular outcome
- market price events
- community drama

### 6.2 Guardian Actions Allowed
Guardian may:
- pause specific modules (if designed)
- pause system globally (if designed)
- override timelock execution only to prevent irrecoverable damage

### 6.3 Guardian Actions Forbidden
Guardian must NEVER:
- permanently disable protocol
- create indefinite pause (auto-unpause exists exactly to prevent this)
- change roles
- upgrade contracts
- bypass timelock to enact non-emergency policy changes

---

## 7. Legitimacy & Distribution Principles

### 7.1 Distribution Principles
Token distribution should aim for:
- quorum feasibility
- representation diversity
- anti-capture resilience

### 7.2 Anti-Capture Rule
No single entity should hold de facto unilateral governance control.
If such concentration exists, governance is considered "institutionally incomplete".

---

## 8. Minimum Security Requirements (Invariants)

The protocol must always preserve:

- Token is immutable supply, no owner, no mint
- Governance cannot access treasury
- Governance cannot upgrade contracts
- Governance cannot change roles
- Guardian pause auto-expires
- Timelock delay exists and is non-zero
- FactoryQualification anti-gaming lock cannot be bypassed

---

## 9. Change Policy for this Constitution
This constitution is not governed by NSF governance.
It is a canonical spec.

Changes to this file require:
- repo-based governance (human governance)
- multi-sig approval
- audit log entry

---

## 10. Final Statement
NSF is a coordination kernel.
Its legitimacy comes from constraint, not power.
