# MirrorAsset 🪙

MirrorAsset is a decentralized synthetic asset platform built on the **Stellar Network** using **Soroban Smart Contracts**. It allows users to lock collateral (USDC or XLM) into isolated vaults to mint synthetic tokens ($sXAU, $sAAPL, $sEUR) that track real-world asset prices. The platform incorporates decentralized oracle price feeds, direct redemptions, and liquidations to maintain price peg stability and solvency.

---

## 🚀 Key Features

*   **Freighter Wallet Connection**: Sign transactions securely using Stellar's native Freighter browser extension, with automatic fallback to a simulated ledger mode if the extension is not detected.
*   **Over-Collateralized Vaults**: Create isolated debt vaults, lock USDC or XLM collateral, and mint synthetic assets.
*   **Position Health Visualizer**: Interactive UI sliders showing real-time collateralization ratio indicators (Safe vs. Risky) to help users avoid liquidations.
*   **Stellar Faucet**: Easily claim testnet XLM and USDC tokens directly inside the dashboard to test vaults and minting immediately.
*   **Direct Peg Redemptions**: Swap synthetic tokens directly with the collateral pool at current oracle rates (minus a 0.5% protocol fee) to enforce peg arbitrage.
*   **Liquidation Dashboard**: View under-collateralized positions and pay off outstanding debt (burning synthetics) to receive vault collateral at a 10% bonus.
*   **Real-time Oracle Ticker**: Dynamic price feeds representing real-world stocks, forex, and commodities, with visual SVG sparkline indicators updating automatically.
*   **Transaction Ledger**: Review historical ledger transactions (deposits, mints, liquidations) with direct transaction lookup on [Stellar Expert](https://stellar.expert).

---

## 🛠 Tech Stack

*   **Frontend**: React (v19), TypeScript, Vite (v8)
*   **Styling**: TailwindCSS (v4)
*   **Icons**: Lucide React
*   **Smart Contracts**: Rust (Soroban SDK)
*   **Stellar Integration**: `@stellar/stellar-sdk` & `@stellar/freighter-api`

---

## 📂 Project Structure

```text
MirrorAsset/
├── contracts/                  # Soroban Rust Contracts
│   └── mirror_vault/
│       ├── Cargo.toml          # Rust package manager config
│       └── src/
│           └── lib.rs          # Soroban smart contract source code
├── src/                        # Frontend source code
│   ├── assets/                 # SVGs and static media
│   ├── components/             # Reusable UI components
│   │   ├── Dashboard.tsx       # Main dashboard layout
│   │   ├── LandingPage.tsx     # Hero landing page
│   │   ├── LiquidationPanel.tsx# Liquidations board
│   │   ├── MintRedeemModal.tsx # Vault management overlay
│   │   ├── Navbar.tsx          # Navigation header
│   │   ├── RedemptionPanel.tsx # Peg redemptions
│   │   ├── ToastContainer.tsx  # Dynamic UI notification alerts
│   │   └── VaultCreationModal.tsx # New vault setup modal
│   ├── context/
│   │   └── StellarContext.tsx  # Ledger actions, wallet interface, and mock state
│   ├── types/
│   │   └── index.ts            # TypeScript definitions
│   ├── App.tsx                 # App layout & routing
│   ├── index.css               # Design system & Tailwind imports
│   └── main.tsx                # Client entrypoint
├── package.json                # Project dependencies
├── tsconfig.json               # TypeScript configurations
└── vite.config.ts              # Vite bundle configurations
```

---

## 🔧 Installation & Setup

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [Rust & Cargo](https://doc.rust-lang.org/cargo/) (To modify/examine the Soroban contract)

### 1. Clone the repository and install dependencies

```bash
git clone https://github.com/your-username/MirrorAsset.git
cd MirrorAsset
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_STELLAR_NETWORK=testnet
VITE_ORACLE_CONTRACT_ID=CD...ORACLE
VITE_VAULT_CONTRACT_ID=CB...VAULT
```

---

## 💻 Running Locally

To start the Vite development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Building for Production

To compile and optimize the assets for production:

```bash
npm run build
```

The output bundle will be generated in the `dist/` directory. Preview the production build locally:

```bash
npm run preview
```

---

## 🏛 Soroban Smart Contract Architecture

The contract code resides in `contracts/mirror_vault/src/lib.rs` and implements the following endpoints:

1.  **`initialize`**: Setup admin address, Chainlink oracle identifier, collateral token, and minimum collateralization thresholds.
2.  **`deposit_collateral`**: Lock up base asset collateral (USDC/XLM) for the user's active vault.
3.  **`withdraw_collateral`**: Withdraw locked collateral, verifying the vault's remaining collateral ratio is above the minimum threshold.
4.  **`mint_synths`**: Mints new synthetic tokens to the user if the vault meets the over-collateralization ratio.
5.  **`burn_synths`**: Burn synthetic tokens to pay down outstanding vault debt.
6.  **`redeem_synths`**: Arbitrage swap of synthetic tokens for collateral at current oracle prices.
7.  **`liquidate`**: Liquidates an under-collateralized vault. The liquidator covers the vault's outstanding debt and receives the equivalent collateral value plus a 10% premium.

---

## 🔮 Future Improvements

1.  **Arbitrage Bots**: Deploy off-chain workers that automatically trigger redemptions when a synthetic token trades below peg on automated market makers (AMMs).
2.  **Multi-Collateral Vaults**: Allow baskets of collateral assets (e.g. XLM + USDC) to back a single vault.
3.  **Governance ($MIR)**: Introduce a protocol governance token to decide asset additions and safety ratio adjustments.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
