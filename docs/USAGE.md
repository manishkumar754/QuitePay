# How to Use QuietPay

## What You Need

- A Midnight-compatible wallet (e.g. Lace with the Midnight preview
  extension) set to **Preprod**.
- Some test tokens on Preprod to cover transaction fees.
- A modern browser — no other software required to *use* the deployed app.

## Step-by-Step Guide

### If you're the payer

1. **Open the app** and connect your wallet.
2. **Fund the pool.** Enter the total amount for this pay period and click
   "Fund pool." This total becomes public — it's how anyone can confirm
   the pool was fully funded.
3. **Commit each recipient's split.** For every recipient, enter a label
   (for your own reference only — never sent on-chain), an opaque
   recipient key, and their real amount. Click "Publish commitment." The
   amount is hashed with a random salt locally; only the hash is
   published.
4. **Share the details privately.** Off-chain (Signal, email, whatever your
   org already uses), send each recipient their recipient key, amount, and
   salt so they can claim.

### If you're a recipient

1. **Open the app** and connect your wallet.
2. **Switch to "Claim."** Enter the recipient key, amount, and salt your
   payer gave you, plus the pay period ID and a holder secret (keep this
   secret — it's what lets you claim again next period without linking
   the two claims together).
3. **Click "Claim payout."** The app checks that your amount and salt
   match the published commitment, then submits a claim. The public
   ledger updates with a nullifier and a "Claimed" badge — nothing else.
4. **To prove your income to someone else** (a lender, a landlord), switch
   to "Prove income," enter the same recipient key/amount/salt plus the
   threshold they're asking about, and click "Generate income proof."
   Nothing is written on-chain — you get a pass/fail result to share
   however you choose.

## What Gets Proved (and What Stays Private)

| | |
|---|---|
| **Proved publicly** | The pool was funded with a specific total; a specific commitment was published for a recipient key; a valid, unclaimed entitlement was claimed. |
| **Stays private** | Every recipient's actual amount, the salt behind each commitment, and (for income proofs) the threshold comparison result stays between the recipient and whoever they share the proof with. |
| **Written on-chain** | Pool total, per-recipient commitment hashes, and claim nullifiers + a claimed boolean. |

## Troubleshooting

**"Pool total must be greater than zero"**
Enter a positive number before clicking "Fund pool."

**"Amount/salt do not match the published commitment"** *(shown by the
contract once compiled — the local demo mirrors this as a claim failure)*
Double-check you entered the exact amount and salt your payer sent you —
even a small mismatch produces a completely different hash.

**"Nothing to claim — amount must be greater than zero"**
The amount field was zero or blank. Enter the real amount your payer
committed for you.

**Wallet won't connect**
Confirm your wallet extension is set to the **Preprod** network — this
contract is deployed on Preprod for Level 4.

**My income proof says "failed" but I know I was paid enough**
Check that the threshold you entered is actually lower than or equal to
your amount — the proof checks `amount >= threshold`, so entering a higher
number than your real amount will correctly fail.
