# MirrorAsset 🪙

MirrorAsset is a decentralized synthetic asset platform built on the **Stellar Network** using **Soroban Smart Contracts**. It allows users to lock collateral (USDC or XLM) into isolated vaults to mint synthetic tokens ($sXAU, $sAAPL, $sEUR) that track real-world asset prices. The platform incorporates decentralized oracle price feeds, direct redemptions, and liquidations to maintain price peg stability and solvency.

Additionally, this repository features the **Stellar Mastery Playground**, a dedicated environment to test, inspect, and verify the requirements for both **Level 1 (White Belt)** and **Level 2 (Orange Belt)** of the Stellar Journey to Mastery challenge.

---

## 🚀 Key Features

*   **🥋 Level 1: White Belt Playground**: An interactive sandbox to generate Stellar keypairs, fund wallets via Friendbot, query account balances, and sign/broadcast payment transactions on the Stellar Testnet.
*   **🍊 Level 2: Orange Belt Smart Contract Console**: A fully integrated frontend console communicating with our live deployed Soroban contract on Testnet using **StellarWalletsKit** for multi-wallet integration.
*   **Multi-Wallet Support**: Support multiple Stellar web wallets (Freighter, Albedo, xBull) in a single interface with proper error state handling (not installed, user rejected, insufficient balance).
*   **Soroban Smart Contract Integration**: Read data from the on-chain vault state, build and sign contract invocation transactions, and broadcast them to the testnet.
*   **Live Event Listener**: Listen to Soroban contract event topics in real-time, automatically refreshing the UI state upon receipt of a contract event.
*   **Over-Collateralized Vaults**: Create isolated debt vaults, lock XLM or USDC collateral, and mint synthetic assets.
*   **Position Health Visualizer**: Interactive UI sliders showing real-time collateralization ratio indicators (Safe vs. Risky) to help users avoid liquidations.
*   **Direct Peg Redemptions**: Swap synthetic tokens directly with the collateral pool at current oracle rates to enforce peg arbitrage.
*   **Liquidation Dashboard**: View under-collateralized positions and pay off outstanding debt to receive vault collateral at a 10% bonus.
*   **Real-time Oracle Ticker**: Dynamic price feeds representing real-world stocks, forex, and commodities, with visual SVG sparkline indicators.

---

## 🥋 Challenge Submission Data

- **Level 2 Deployed Contract Address**: `CASOUZGUMQMEPHV5I2POCLPVRG4Y7Y3YJJ4UUKQMGT2KEMNJFTBNUC2K`
- **Successful Contract Call (Instantiation) Tx Hash**: `8372cbd3cf80c112183ef61e4ee62100a363eadaa910c7c0a5046e0a7d3269b3`
- **Live Demo URL**: [https://mirror-asset-stellar.vercel.app](https://mirror-asset-stellar.vercel.app) *(Deployable)*

---

## 🛠 Tech Stack

*   **Frontend**: React (v19), TypeScript, Vite (v8)
*   **Styling**: TailwindCSS (v4)
*   **Icons**: Lucide React
*   **Smart Contracts**: Rust (Soroban SDK)
*   **Stellar Integration**: `@stellar/stellar-sdk` & `@creit.tech/stellar-wallets-kit`

---

## 📂 Project Structure

```text
MirrorAsset/
├── contracts/                  # Soroban Rust Contracts
│   └── mirror_vault/
│       ├── Cargo.toml          # Rust package config (targets wasm32v1-none)
│       └── src/
│           └── lib.rs          # Soroban smart contract source code
├── scripts/
│   └── deploy.js               # Node-based on-chain WASM contract deployer
├── src/                        # Frontend source code
│   ├── assets/                 # SVGs and static media
│   ├── components/             # Reusable UI components
│   │   ├── Dashboard.tsx       # Main dashboard layout
│   │   ├── LandingPage.tsx     # Hero landing page
│   │   ├── MasteryPlayground.tsx  # Level 1/2 tab wrapper
│   │   ├── WhiteBeltPlayground.tsx # Level 1 tasks interface
│   │   ├── OrangeBeltPlayground.tsx # Level 2 on-chain Soroban dashboard
│   │   ├── LiquidationPanel.tsx # Liquidations board
│   │   ├── MintRedeemModal.tsx # Vault management overlay
│   │   ├── Navbar.tsx          # Navigation header
│   │   └── RedemptionPanel.tsx # Peg redemptions
│   ├── context/
│   │   └── StellarContext.tsx  # Global Stellar wallet context
│   ├── types/
│   │   └── index.ts            # TypeScript definitions
│   ├── App.tsx                 # App layout & routing
│   ├── index.css               # Design system & Tailwind imports
│   └── main.tsx                # Client entrypoint
```

---

## 🔧 Installation & Setup

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [Rust & Cargo](https://doc.rust-lang.org/cargo/) (To compile the Soroban contract)

### 1. Install Dependencies

```bash
git clone https://github.com/prashunk/MirrorAsset.git
cd MirrorAsset
npm install --legacy-peer-deps --cache .npm_cache
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_STELLAR_NETWORK=testnet
VITE_VAULT_CONTRACT_ID=CASOUZGUMQMEPHV5I2POCLPVRG4Y7Y3YJJ4UUKQMGT2KEMNJFTBNUC2K
```

---

## 💻 Running Locally

### Start development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Compile Smart Contract:

```bash
cd contracts/mirror_vault
rustup target add wasm32v1-none --toolchain 1.89.0-aarch64-apple-darwin
RUSTC=/Users/prashunk/.rustup/toolchains/1.89.0-aarch64-apple-darwin/bin/rustc cargo build --target wasm32v1-none --release
```

### Run Deployer script:

```bash
node scripts/deploy.js
```

---

## 📸 Screenshots Placeholders

*   **[Placeholder] Wallet Connected**: `docs/screenshots/wallet_connected.png`
*   **[Placeholder] Balance Retrieval**: `docs/screenshots/balance_retrieval.png`
*   **[Placeholder] Payment Transaction Success**: `docs/screenshots/transaction_success.png`
*   **[Placeholder] Multi-Wallet Kit Selection**: `docs/screenshots/multi_wallet_kit.png`
*   **[Placeholder] Soroban Deposit Call**: `docs/screenshots/contract_deposit.png`
*   **[Placeholder] Live Soroban Events**: `docs/screenshots/event_listener.png`

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
