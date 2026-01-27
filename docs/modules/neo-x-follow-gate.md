# NΞØ Smart Factory Module: NeoXFollowGate

## Summary
This module defines a canonical pattern for **social-triggered access grants** inside the **NΞØ Smart Factory** ecosystem.

It is intentionally included as a **future-ready blueprint**:
- the system can integrate it later into the Factory registry/router
- yet it already expresses the correct "NEØ-grade" architecture

This is **not** a simple "web2 automation".
It is a **state + trigger + proof + execution** pipeline.

---

## Why this exists
Most creators publish content and then "hope people convert".

NEØ does the inverse:
**user actions become verifiable state transitions**, and conversions become deterministic.

This module is a reference implementation of:

> Follow action (off-chain) → Proof signed by NODE NEØ → On-chain grant event → Access provisioned

---

## Trigger (Off-chain)
**User follows `@neoflowoff.eth` on X**

Important:
- EVM contracts **cannot read** social networks directly.
- Any "on-chain follow check" is a lie unless it uses an oracle/attester.

So the follow validation is executed by:
- `NODE NEØ` (MCP terminal runtime)
- or a dedicated attester service

This service confirms follow status and issues a signed proof.

---

## Reward (Off-chain execution)
**Access grant delivered via email**
Examples:
- create account in Members Area
- unlock premium content
- add user into a cohort
- issue a membership token later (optional)

The smart contract does not send email.
It emits an event that becomes a deterministic execution trigger.

---

## Core architecture (Pipeline)
### 1) User action
User follows the target X handle.

### 2) Attester validation
Attester checks:
- user wallet ownership (optional flow)
- follow state on X
- binds emailHash to wallet
- signs the `FollowProof` (EIP-712)

### 3) On-chain claim
User calls:
- `claimAccess(proof, signature)`

Contract validates:
- signature authenticity
- deadline validity
- nonce replay protection
- correct target handle

If valid:
- contract marks `granted[user] = true`
- emits `AccessGranted(...)`

### 4) Execution worker
An off-chain worker listens to `AccessGranted` events and executes:
- email dispatch
- member provisioning
- CRM tagging / ledger update

This worker can be:
- MCP agent in terminal
- Cloud worker (serverless)
- event-driven indexer

---

## What is considered "source of truth"
On-chain:
- `granted[user] == true`
- `AccessGranted` event log

Off-chain:
- member access system
- email service

The on-chain log is the canonical audit trail for:
- who received access
- when
- under which trigger
- under which attester

---

## Data design notes
### Email privacy
This module uses `emailHash` instead of plaintext email.

`emailHash = keccak256(normalized_email)`

Normalization rules recommended:
- trim spaces
- lowercase
- (optional) punycode if domain has unicode

Plaintext email should never be stored on-chain.

### Replay protection
Uses a `nonce`:
- `usedNonce[nonce] = true`

So no proof can be replayed.

### Signature security
EIP-712 typed signature prevents:
- accidental signing of wrong data
- replay across chains/contracts
- malformed message ambiguity

---

## Integration plan (future)
This module is designed to be later registered inside the Factory such as:
- `ModuleRegistry.register("X_FOLLOW_GATE", address(module))`
- or deployed by a Factory pattern:
  - `Factory.deployModule(bytes initData)`

Potential future upgrades:
- mint a SBT "MemberPass"
- tiered access:
  - follow = bronze
  - retweet = silver
  - comment proof = gold
- multi-attester quorum
- revoke/expire policies
- Proof of Intention (PoI) logs

---

## Threat model (what can go wrong)
- Attester compromised → false grants
- Poor email normalization → mismatch hashes
- Back-end event listener downtime → delayed emails
- Social API changes → attester breaks

Mitigation:
- rotate `attester` via `setAttester`
- use multiple attesters + quorum later
- robust logging and retries in execution worker

---

## Why this is NEØ Protocol
This module is not "automation".
It is **programmable legitimacy**:

- trigger in human networks
- validation by sovereign node
- state transition on-chain
- execution by agents

Content becomes protocol.
Audience becomes ledger.
Growth becomes architecture.
