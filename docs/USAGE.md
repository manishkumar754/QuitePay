# How to Use QuietPay

## What You Need
- The **Midnight Lace Wallet Extension** connected to the Preprod network.
- Some **testnet tNIGHT tokens** to pay for transaction fees.
- Access to the QuietPay web app.

## Step-by-Step Guide

### For Payers (Funding and Committing)
1. **Connect Wallet:** Click "Connect Wallet" at the top right of the app.
2. **Fund Pool:** In the Payer panel, enter the total payroll amount for the period (e.g. 5000) and click "Fund Pool". This publishes the total amount to the public ledger so your solvency is auditable. Approve the transaction in your wallet.
3. **Commit Splits:** For each recipient you want to pay:
   - Enter their Recipient Key (a 64-character hex string they provide to you).
   - Enter their specific Amount.
   - Click "Publish commitment".
   - Approve the transaction in your wallet. 
   - A random salt will be generated and mixed with the amount. Provide this salt, the amount, and the recipient key back to the recipient so they can claim it.

### For Recipients (Claiming Payouts)
1. **Connect Wallet:** Click "Connect Wallet" at the top right of the app.
2. **Enter Details:** In the Recipient panel, ensure you are on the "Claim" tab.
   - **Your recipient key:** The 64-character hex string you gave the payer.
   - **Your amount:** The amount the payer committed for you.
   - **Salt from your payer:** The 64-character hex string the payer provided to you.
   - **Pay period ID:** The ID for this pay cycle (e.g. 2026-09).
   - **Holder secret:** A random secret you keep to secure your claim.
3. **Submit Claim:** Click "Claim payout" and approve the transaction in your wallet. The smart contract will silently verify your details using zero-knowledge proofs and mark your allocation as claimed.

### Proving Income
1. **Switch to Prove Income:** In the Recipient panel, click the "Prove income" tab.
2. **Enter Details:** Provide your recipient key, amount, salt, and the threshold you want to prove (e.g. proving you earned at least 2000).
3. **Generate Proof:** Click "Generate income proof". This happens entirely off-chain and reveals nothing but "Yes, the amount is above this threshold" to the verifier.

## What Gets Proved (and What Stays Private)
- **Public:** The total pool amount, a random hashed commitment of each recipient's payout, and a one-way nullifier showing a claim happened.
- **Private:** The exact amount each recipient gets, their salt, and their personal identity.
- **The Proof:** You prove mathematically that your private (amount + salt) matches the public commitment hash *without* revealing the amount.

## Troubleshooting
- **"amount/salt do not match the published commitment"**: Wait 15-20 seconds after the payer publishes the commitment to give the network indexer time to catch up, then try again.
- **"Network error: Response body loading was aborted"**: Your internet connection dropped while downloading the WebAssembly prover file. Refresh the page and try again.
- **Stuck on "Submitting claim..."**: Check your browser extensions — the Midnight Wallet popup might be hidden or waiting for your approval in the background!
