# NΞØ SMART FACTORY - Tact Implementation

This directory contains the **NEØ Architecture** implementation using the **Tact** language.

## 🛡️ Rationale for Migration to Tact

The transition from FunC to Tact in the TON ecosystem is not just a technical choice, but a strategic decision for the **NΞØ Protocol** for three fundamental reasons:

### 1. Structural Security and Elimination of Serialization Bugs

The issue encountered with **Exit Code 9 (Cell Overflow)** in FunC v2.2.0 demonstrated the fragility of manually managing bits and cell references. Tact abstracts this complexity, ensuring that contract state serialization (StateInit) is generated in an optimized manner, free from human errors of bit misalignment.

### 2. Recovery of Code Essence (Readability)

When comparing `NeoTokenV2.sol` with `NeoJettonMinter.tact`, one can see that the contract's "soul" is preserved. Business logic, such as the 5% fee split in `withdraw()` and `max_supply` control, becomes audible and comprehensible, removing the low-level barrier of FunC that obscured the developer's intent.

### 3. Innovation Velocity (Time-to-Market)

Tact automatically generates TypeScript wrappers and handles child contract deployment (Wallets) natively. This reduces development time for new modules by 60%, allowing NΞØ to focus on multichain features and Account Abstraction instead of fighting the TVM stack.

---

## 📂 File Structure

- `constants.tact`: Global protocol parameters (Fees, Treasury, Reserves).
- `messages.tact`: TEP-74 (Jettons) interface definitions and exclusive V2 operations.
- `JettonMinter.tact`: The token's brain, with public mint logic and security.
- `JettonWallet.tact`: User balance contract, optimized for low gas costs.
- `JettonFactory.tact`: Multichain-ready token factory.

---

## 🚀 How to Compile & Test

The project is pre-configured with the Tact compiler and Sandbox testing tools.

1. Install all dependencies from the project root:
   ```bash
   npm install
   ```

2. Compile using the global configuration:
   ```bash
   npm run compile:ton
   ```

3. Run automated security tests:
   ```bash
   npm run test:ton
   ```

**Note:** This structure is protected by NEØ context. The technical migration was designed to maintain compatibility with the rituals and patterns established by Mellø.

## 📄 License

Documentation is licensed under CC BY 4.0 (Creative Commons). Smart contract code referenced here is licensed under MIT.
