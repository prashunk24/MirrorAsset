# Stellar Journey to Mastery — Challenge Submission Guide

This document serves as proof of completion for the **Stellar Journey to Mastery — White Belt (Level 1)** and **Orange Belt (Level 2)** challenges. It records the tasks completed, the tools built, on-chain contract addresses, transaction hashes, and instructions for submission.

---

## 🥋 Level 1: White Belt Verification Summary

All core requirements of the White Belt challenge have been successfully implemented and verified:

1. **Task 1: Wallet Creation** — Cryptographically generates a secure Stellar Keypair, separates the public address from the secret seed, and implements secure download and local handling.
2. **Task 2: Balance Retrieval** — Fetches XLM balances from the Horizon Testnet, handling loading/error states, and includes a one-click connection to the Friendbot Faucet.
3. **Task 3: First Transaction** — Signs and broadcasts a native payment transaction on Stellar Testnet, retrieving the transaction hash and linking to the block explorer.

### Screenshots Required (Level 1):
1. **Wallet Creation**: Show the generated Public Key and the masked Secret Key.
2. **Balance Retrieval**: Show the 10,000 XLM balance retrieved from Horizon after Friendbot funding.
3. **Transaction Confirmation**: Show the transaction hash and success badge after sending XLM.

---

## 🍊 Level 2: Orange Belt Verification Summary

All core requirements of the Orange Belt challenge have been successfully implemented, compiled, deployed, and integrated:

1. **Multi-Wallet Support** — Integrated **StellarWalletsKit** to support Freighter, Albedo, and xBull wallet extensions, resolving all connection prompts and handling not installed / user rejected scenarios.
2. **Soroban Smart Contract Deployment** — Compiled and deployed a custom Rust smart contract (`mirror_vault`) targeting `wasm32v1-none` on the Stellar Testnet.
3. **Contract Integration (Read & Write)** — Implemented simulated reads (`get_vault`) and signed write calls (`deposit_collateral`) directly via the multi-wallet client.
4. **Live Event Listener** — Programmed an event poller fetching contract events from the Stellar Testnet ledger and updating UI state reactively.

### Level 2 Deployed Assets:
- **Contract Address (CONTRACT_ID)**: `CASOUZGUMQMEPHV5I2POCLPVRG4Y7Y3YJJ4UUKQMGT2KEMNJFTBNUC2K`
- **Instantiation Transaction Hash**: `8372cbd3cf80c112183ef61e4ee62100a363eadaa910c7c0a5046e0a7d3269b3`
- **Horizon Network Explorer URL**: [Stellar Expert Explorer](https://stellar.expert/explorer/testnet/tx/8372cbd3cf80c112183ef61e4ee62100a363eadaa910c7c0a5046e0a7d3269b3)

### Screenshots Required (Level 2):
1. **Multi-Wallet Selection**: Show the StellarWalletsKit modal containing Freighter, Albedo, and xBull choices.
2. **On-Chain Vault Read**: Show the active contract state displaying the user's locked collateral and minted debt balance.
3. **Contract Deposit Transaction**: Show the pending, then success state, along with the transaction hash and ledger explorer link.
4. **Live Soroban Event Logger**: Show the live event ticker displaying `deposit_collateral` event topics and data payloads.

---

## 📜 Conceptual Recap

### What is a Stellar wallet?
A Stellar wallet is a cryptographic keypair (a public key and a secret key) that controls access to an account on the Stellar network.

### Public Key vs. Secret Key
- **Public Key**: Public identifier starting with `G`, acting like an account number for receiving funds.
- **Secret Key**: Cryptographic seed starting with `S`, acting like a digital signature key. It must be kept private to prevent unauthorized fund movements.
