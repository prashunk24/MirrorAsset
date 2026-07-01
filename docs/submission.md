# Stellar Journey to Mastery — White Belt Submission

This document serves as proof of completion for the **Stellar Journey to Mastery — White Belt** challenge. It records the tasks completed, the tools built, and provides placeholders/instructions for the final screenshots required for submission.

---

## 🥋 Challenge Verification Summary

All core requirements of the White Belt challenge have been successfully implemented and tested on the Stellar Testnet:

1. **Task 1: Wallet Creation** — Successfully generated a cryptographically secure Keypair, separated the public address from the secret seed, and implemented secure local storage/backup handling (never committed to version control).
2. **Task 2: Balance Retrieval** — Built real-time Horizon testnet queries to fetch XLM balances, handling loading states, errors, and implementing a Friendbot testnet funding interface.
3. **Task 3: First Transaction** — Created, signed, and broadcasted a live payment transaction on the Stellar Testnet using the generated secret key, retrieving the transaction hash and linking to the blockchain explorer.

---

## 📂 Task Proofs

### 1. Wallet Creation Proof

*   **Public Key Format:** Starts with `G` (e.g. `GCBA...` or similar generated address).
*   **Secret Key Format:** Starts with `S` (e.g. `SCBA...` or similar generated secret seed).
*   **Playground Implementation:** Users can click **"Generate Wallet"** in the UI to generate a new keypair in memory. The secret key is masked behind a visual toggle and can be backed up as a JSON file.
*   **Security Standard:** Secrets are stored locally in the browser's context and never committed to GitHub or sent to any server.

### 2. Balance Retrieval Proof

*   **API Used:** Stellar Horizon Testnet API (`https://horizon-testnet.stellar.org/accounts/{publicKey}`).
*   **Friendbot Faucet Integration:** If the account has a balance of `0` (or is not yet on-chain), the UI triggers a call to `https://friendbot.stellar.org/?addr={publicKey}` to automatically fund the wallet with **10,000 XLM**.
*   **Horizon State:** Once funded, subsequent calls to `loadAccount()` successfully retrieve and display the correct XLM balance.

### 3. First Transaction Proof

*   **Transaction Type:** Stellar Native Payment (XLM).
*   **SDK Signer:** `@stellar/stellar-sdk`'s `TransactionBuilder` and `Keypair.fromSecret(secretKey)`.
*   **Explorer Link:** Completed transactions link directly to the Stellar Expert Testnet Explorer (`https://stellar.expert/explorer/testnet/tx/{txHash}`).
*   **Example Successful Terminal Output:**
    ```text
    Initializing Stellar Transaction Builder...
    Loading sequence number for source: G...
    Constructing Payment operation: 10 XLM
    Signing transaction locally using Secret Key...
    Submitting signed transaction XDR to Stellar Horizon network...
    Transaction success! Ledger: 1489240
    Transaction Hash: 43a6d9620...
    ```

---

## 📸 Screenshots Required for Submission

To complete your submission on the Stellar Journey dashboard, please capture the following screenshots from the running application:

1.  **Wallet Creation Screenshot:**
    *   Navigate to the **White Belt** tab.
    *   Click **"Generate Wallet"**.
    *   Take a screenshot showing the generated Public Address and the warning notice about storing the Secret Key safely.
2.  **Balance Retrieval & Friendbot Funding Screenshot:**
    *   Click **"Friendbot Faucet"** or check the balance.
    *   Take a screenshot showing the **10,000 XLM** balance successfully fetched from the Horizon Testnet.
3.  **Transaction Confirmation Screenshot:**
    *   Enter a recipient address (or keep the default self-payment) and click **"Sign & Broadcast First Transaction"**.
    *   Wait for the transaction to complete.
    *   Take a screenshot showing the **Transaction Submitted Successfully!** badge along with the Transaction Hash and the link to Stellar Expert.

---

## 📜 Conceptual Recap (For Submission Review)

### What is a Stellar wallet?
A Stellar wallet is a pair of cryptographic keys (a keypair) that controls access to funds on the Stellar network. Unlike traditional physical wallets, it doesn't store tokens directly. Instead, it stores the cryptographic keys used to authorize ledger changes.

### Public Key vs. Secret Key
*   **Public Key (Address):** Analogous to an email address or bank account number. It identifies your account on the ledger and is shared publicly. Anyone can send funds or check the balance of a public key.
*   **Secret Key (Seed):** Analogous to a password or digital signature stamp. It must be kept strictly private. It is used to generate the cryptographic signature required to authorize payments, trade, or make configuration changes to your account.
