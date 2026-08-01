# MirrorAsset 🪙

> A decentralized synthetic-asset protocol built on the **Stellar Network** with **Soroban Smart Contracts** — supporting over-collateralized vaults, oracle price feeds, direct peg redemptions, and a liquidation engine.

[![CI/CD Pipeline](https://github.com/prashunk24/MirrorAsset/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/prashunk24/MirrorAsset/actions/workflows/ci.yml)

---

## 📌 Quick Reference

| Item | Value |
|---|---|
| **Live Demo** | [https://mirror-asset.vercel.app](https://mirror-asset.vercel.app) |
| **Level 3 Contract ID** | `CACISJARB6WERDJZUTXPN357Q5PDSADLJ6XICJJE3XSKCOB62EMYXQ2D` |
| **Level 2 Contract ID** | `CASOUZGUMQMEPHV5I2POCLPVRG4Y7Y3YJJ4UUKQMGT2KEMNJFTBNUC2K` |
| **Testnet** | Stellar Testnet (Horizon + Soroban RPC) |
| **Frontend CI** | `npm run build` → Vite production bundle |
| **Contract CI** | `cargo test` → 9 Soroban unit tests |

---

## 🏆 Challenge Levels

### 🥋 Level 1 — White Belt Playground
An interactive sandbox that lets developers experience raw Stellar fundamentals:

- **Task 1 — Wallet Creation**: Generate a cryptographic Ed25519 Stellar keypair entirely client-side using `@stellar/stellar-sdk`. Display and safely reveal the public key (G…) and secret key (S…) with clipboard copy and JSON backup.
- **Task 2 — Balance Check**: Connect to the Stellar Testnet Horizon server and fetch real on-chain XLM account data for the generated keypair. Integrates **Friendbot** for one-click testnet funding.
- **Task 3 — Sign & Broadcast Transaction**: Build, sign, and submit a `PAYMENT` operation XDR transaction to Horizon. A real-time terminal log streams every step (keypair → account load → fee → sign → submit → ledger confirmation).

**Artifacts**:
- [Demo Screenshot — White Belt Terminal](https://github.com/user-attachments/assets/1e4aa2ed-2b45-438b-a301-348fd8702ddd)
- [Wallet Connected Screenshot](https://github.com/user-attachments/assets/cf7f20c4-95f3-4d89-84b8-b2d297f86634)

---

### 🍊 Level 2 — Orange Belt: On-Chain Soroban Integration
A fully integrated console communicating with a live Soroban smart contract on Testnet using **StellarWalletsKit** for multi-wallet abstraction:

- **Multi-Wallet Support**: Freighter, Albedo, xBull — single unified interface with error-state handling (extension not installed, user rejected, insufficient balance).
- **Contract Invocation**: Build and sign Soroban contract call XDR transactions, broadcast them via the Soroban RPC endpoint, and display results.
- **Live Event Listener**: Subscribe to Soroban contract event topics in real time — UI state automatically refreshes on contract event receipt.
- **Transaction History**: View all contract interactions (deposit, mint, burn, redeem, liquidate) with Stellar Expert explorer deep-links for every tx hash.

**Deployed Contract**: `CASOUZGUMQMEPHV5I2POCLPVRG4Y7Y3YJJ4UUKQMGT2KEMNJFTBNUC2K`
**Instantiation Tx**: `8372cbd3cf80c112183ef61e4ee62100a363eadaa910c7c0a5046e0a7d3269b3`

**Artifacts**:
- [Balance Displayed Screenshot](https://github.com/user-attachments/assets/07b64758-1410-442b-923c-ae5d2deb4059)

---

### 🔴 Level 3 — Red Belt: CI/CD Pipeline + Smart Contract Test Suite
Production-grade engineering infrastructure for the MirrorAsset protocol:

#### 3.1 GitHub Actions CI/CD Pipeline (`.github/workflows/ci.yml`)

Three parallel jobs run on every push and pull request to `main`:

| Job | What it does |
|---|---|
| **Frontend** | `npm install` → `npx tsc -b` (type check) → `npm run test` (vitest) → `npm run build` (vite production bundle) |
| **contract-test** | `cargo test --verbose` — runs all 9 Soroban unit tests; a guard step asserts ≥ 9 tests pass |
| **contract-build** | `stellar contract build` → compiles to optimised WASM; verifies the `.wasm` artifact exists (only runs after `contract-test` passes) |

Features:
- **Concurrency cancellation** — in-progress runs for the same branch are cancelled on new push
- **Cargo registry cache** — `actions/cache@v4` on `Cargo.lock` hash for fast re-runs
- **npm cache** — `actions/setup-node` built-in caching

#### 3.2 Soroban Smart Contract Unit Tests (`contracts/mirror_vault/src/test.rs`)

9 distinct passing unit tests covering the full contract lifecycle:

| # | Test | What it verifies |
|---|---|---|
| 1 | `test_initialize_and_get_vault` | Fresh vault starts at zero collateral + zero debt |
| 2 | `test_initialize_twice_is_rejected` | Second `initialize()` returns `AlreadyInitialized` |
| 3 | `test_deposit_collateral` | Vault collateral equals deposited amount |
| 4 | `test_deposit_zero_is_rejected` | Zero-amount deposit returns `NegativeAmount` |
| 5 | `test_mint_synths_and_ratio_enforcement` | Mint within ratio succeeds; mint beyond ratio fails |
| 6 | `test_burn_synths_reduces_debt` | Burn reduces debt; over-burn returns `BurnAmountExceedsDebt` |
| 7 | `test_redeem_synths_succeeds_for_positive_amount` | Positive redeem OK; zero redeem returns `NegativeAmount` |
| 8 | `test_withdraw_collateral_respects_ratio` | Safe withdrawal OK; ratio-breaking withdrawal fails |
| 9 | `test_liquidate_healthy_vault_is_rejected` | Healthy vault returns `VaultIsHealthy` |

**Deployed Contract (Level 3)**: `CACISJARB6WERDJZUTXPN357Q5PDSADLJ6XICJJE3XSKCOB62EMYXQ2D`

> **Demo Video**: _[Link to be added after recording]_
> **CI Run Screenshot**: _[Link to be added after first green pipeline run]_

---

## 🚀 Key Product Features

| Feature | Description |
|---|---|
| **Over-Collateralized Vaults** | Lock XLM or USDC to mint synthetic assets (sXAU, sAAPL, sEUR) |
| **Oracle Price Feeds** | On-chain price oracle with real-time SVG sparkline tickers |
| **Position Health Visualizer** | Live collateralization ratio bar; Safe / Risky / Liquidatable states |
| **Direct Peg Redemptions** | Swap synths for collateral at oracle rates with 0.5% fee |
| **Liquidation Dashboard** | Pay off unhealthy vault debt; earn 10% collateral bonus |
| **Send XLM (Freighter)** | Native XLM transfer via Freighter wallet with real Horizon broadcast |
| **Transaction History** | Full ledger of vault operations with Stellar Expert deep-links |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS v4 (custom `@theme` tokens) |
| Icons | Lucide React |
| Smart Contracts | Rust + Soroban SDK 21 |
| Stellar SDK | `@stellar/stellar-sdk`, `@creit.tech/stellar-wallets-kit` |
| CI/CD | GitHub Actions (3-job pipeline) |
| Hosting | Vercel |

---

## 📂 Project Structure

```text
MirrorAsset/
├── .github/
│   └── workflows/
│       └── ci.yml              # 3-job CI/CD pipeline
├── contracts/
│   └── mirror_vault/
│       ├── Cargo.toml          # Soroban SDK 21 dependencies
│       └── src/
│           ├── lib.rs          # Contract: initialize, deposit, mint, burn,
│           │                   #           withdraw, redeem, liquidate
│           └── test.rs         # 9 unit tests (Level 3)
├── scripts/
│   └── deploy.js               # Node.js WASM contract deployer
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx       # Main dashboard (stat cards, send XLM)
│   │   ├── LandingPage.tsx     # Hero page with oracle ticker
│   │   ├── MasteryPlayground.tsx  # Level 1/2 tab wrapper
│   │   ├── WhiteBeltPlayground.tsx # Level 1 tasks + Horizon console
│   │   ├── OrangeBeltPlayground.tsx # Level 2 Soroban console
│   │   ├── LiquidationPanel.tsx # Liquidation board
│   │   ├── MintRedeemModal.tsx # Vault management overlay
│   │   ├── Navbar.tsx          # Floating glassmorphic navbar
│   │   ├── RedemptionPanel.tsx # Peg redemptions
│   │   ├── TransactionHistory.tsx # On-chain tx ledger
│   │   ├── ToastContainer.tsx  # Global notification system
│   │   └── VaultCreationModal.tsx # Vault creation flow
│   ├── context/
│   │   └── StellarContext.tsx  # Global wallet + vault state
│   ├── hooks/
│   │   └── useSorobanEvents.ts # Real-time event listener
│   ├── services/
│   │   └── soroban.ts          # RPC service layer
│   ├── types/
│   │   └── index.ts            # TypeScript definitions
│   ├── App.tsx                 # App layout & tab routing
│   ├── index.css               # Design system (glass-card, icon-glow-box)
│   └── main.tsx                # Client entry point
├── package.json
└── vite.config.ts
```

---

## 🔧 Local Setup

### Prerequisites

- [Node.js ≥ 18](https://nodejs.org/)
- [Rust stable + `wasm32v1-none` target](https://rustup.rs/)
- [Stellar CLI](https://github.com/stellar/stellar-cli) (for contract build)

### 1. Clone & Install

```bash
git clone https://github.com/prashunk24/MirrorAsset.git
cd MirrorAsset
npm install --legacy-peer-deps --cache .npm_cache
```

### 2. Configure Environment

```bash
cp .env.example .env
```

`.env` contents:
```env
VITE_STELLAR_NETWORK=testnet
VITE_VAULT_CONTRACT_ID=CACISJARB6WERDJZUTXPN357Q5PDSADLJ6XICJJE3XSKCOB62EMYXQ2D
```

### 3. Start Development Server

```bash
npm run dev
# → http://localhost:5173
```

### 4. Run Frontend Tests

```bash
npm run test          # vitest watch
npx tsc -b            # TypeScript type check (0 errors expected)
```

### 5. Run Contract Unit Tests

```bash
cd contracts/mirror_vault
cargo test
# Expected: 9 passed, 0 failed
```

Output:
```
running 9 tests
test test::test_initialize_and_get_vault ... ok
test test::test_initialize_twice_is_rejected ... ok
test test::test_deposit_collateral ... ok
test test::test_deposit_zero_is_rejected ... ok
test test::test_mint_synths_and_ratio_enforcement ... ok
test test::test_burn_synths_reduces_debt ... ok
test test::test_redeem_synths_succeeds_for_positive_amount ... ok
test test::test_withdraw_collateral_respects_ratio ... ok
test test::test_liquidate_healthy_vault_is_rejected ... ok

test result: ok. 9 passed; 0 failed
```

### 6. Build WASM Contract

```bash
cd contracts/mirror_vault
stellar contract build
# Output: target/wasm32v1-none/release/mirror_vault.wasm
```

### 7. Deploy to Testnet

```bash
node scripts/deploy.js
```

---

## 🔄 CI/CD Pipeline

Every push or PR to `main` triggers the GitHub Actions pipeline:

```
push / pull_request → main
        │
        ├── [Job 1] Frontend
        │     ├── npm install
        │     ├── npx tsc -b          ← type check
        │     ├── npm run test         ← 27 vitest tests
        │     └── npm run build        ← Vite production bundle
        │
        ├── [Job 2] contract-test
        │     ├── cargo test --verbose ← 9 Soroban unit tests
        │     └── Assert count ≥ 9
        │
        └── [Job 3] contract-build  (needs: contract-test)
              ├── stellar contract build
              └── Verify .wasm artifact
```

View live runs: [GitHub Actions](https://github.com/prashunk24/MirrorAsset/actions)

---

## 📸 Screenshots

### Wallet Connected State
<img width="1470" height="882" alt="Wallet Connected" src="https://github.com/user-attachments/assets/cf7f20c4-95f3-4d89-84b8-b2d297f86634" />

### Balance Displayed
<img width="1262" height="372" alt="Balance Displayed" src="https://github.com/user-attachments/assets/07b64758-1410-442b-923c-ae5d2deb4059" />

### Successful Testnet Transaction
<img width="1470" height="956" alt="Successful Testnet Transaction" src="https://github.com/user-attachments/assets/1e4aa2ed-2b45-438b-a301-348fd8702ddd" />

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
