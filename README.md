# QuietPay

![CI](https://github.com/manishkumar754/QuitePay/actions/workflows/deploy.yml/badge.svg)

> Pay everyone. Reveal to no one.

## Live Demo

https://quite-pay-iota.vercel.app

## Video Demo

[Watch the MVP Demo on Google Drive](https://drive.google.com/file/d/18OfcwmqD3VmO2GF-HplJ--C2U1YneOTs/view?usp=sharing)

## Contract Address

| Network | Address |
|---------|---------|
| Preprod | `ec858b2e7ba657d3c4e0282007b5e281eb118ad3a7f4fb2779ebdc549e4a3fb3` ([Explorer Link](https://preprod.midnightexplorer.com/contracts/0xec858b2e7ba657d3c4e0282007b5e281eb118ad3a7f4fb2779ebdc549e4a3fb3)) |

## What This Product Does

Payroll is one of the strongest arguments for using a blockchain — trustless
execution, no intermediary, auditable proof that everyone got paid — and one
of the worst fits for a *public* one, because every recipient's exact
compensation would become permanently visible to anyone who looks.

QuietPay separates the two facts that get conflated: **that a pool was
funded and distributed correctly** (public, auditable) from **who got how
much** (private, provable only by the recipient, to whomever they choose). A
payer funds a pool and commits a hash of each recipient's amount. Recipients
claim by proving their private amount matches the commitment — the ledger
only ever records a nullifier and a claimed flag. A recipient can also prove
"I was paid at least X" to a third party, like a lender, without revealing
the amount to that party or to QuietPay itself.

It's built for DAOs distributing contributor payouts, teams running
crypto-native payroll, and revenue-split pools — anywhere a group needs
trustless, on-chain fund distribution without turning compensation into
public information.

Midnight is the natural fit because `disclose()` forces every public
exposure to be a deliberate, auditable choice in the contract code — rather
than "everything is public unless you build an entire off-chain layer to
hide it," which is how every other chain handles this problem today.

## Privacy Model

**PUBLIC (on-chain, anyone can see):**
- The total amount funded into a pay period.
- A commitment (hash) published per recipient key — binding, not revealing.
- Nullifiers marking that a claim has already happened for a given period.
- A log mapping each nullifier to a single claimed boolean.

**PRIVATE (private witness, never on-chain):**
- Each recipient's real payout amount.
- The random salt mixed into their commitment.
- The recipient's holder secret used to derive their claim nullifier.
- The real-world identity behind a recipient key.

**What gets PROVED without revealing:**
"This recipient's private amount and salt match the commitment published
for their key, it hasn't been claimed for this period yet, and (separately)
their amount is at or above some threshold" — all without revealing the
amount itself, to the contract, to other recipients, or to whoever the
threshold proof is shared with.

## Tech Stack

- **Contract:** [Compact](https://docs.midnight.network) (Midnight's
  privacy-preserving smart contract language)
- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS v4
- **Testing:** Vitest
- **CI/CD:** GitHub Actions
- **Network:** Midnight Preprod

## Prerequisites

- [Node.js](https://nodejs.org) v20 or later
- npm (bundled with Node)
- [Lace wallet](https://www.lace.io) with the Midnight Preprod network
  enabled
- [Docker](https://www.docker.com) (required by the Compact toolchain for
  proof server / local node tooling)
- The [Compact compiler CLI](https://docs.midnight.network) (`compact`)

## Setup & Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_GITHUB_USERNAME/quietpay.git
cd quietpay

# 2. Install frontend dependencies
npm install

# 3. Compile the Compact contract (generates ./managed/quietpay)
compact compile contracts/quietpay.compact managed/quietpay

# 4. Run the frontend locally
npm run dev
```

The dev server prints a local URL (typically `http://localhost:5173`).
Connect your Preprod-configured wallet from there.

## Run Tests

```bash
npm test
```

Runs the Vitest suite in `tests/quietpay.test.ts` (11 tests) covering pool
funding validation, commitment randomness, claim success/failure, nullifier
stability and uniqueness across periods, and income-threshold proof logic —
mirroring the checks the on-chain circuit performs.

## Deploying the Contract to Preprod

```bash
compact compile contracts/quietpay.compact managed/quietpay
midnight-contract deploy managed/quietpay --network preprod
```

*(Exact deploy invocation depends on your installed Midnight CLI version —
check the official docs.)* After deploying, paste the resulting contract
address into the table above.

## CI/CD

Every push to `main` and every pull request runs:
1. `npm ci`
2. `npm test` (Vitest suite)
3. `npm run build` (TypeScript check + production Vite build)
4. `npm run lint` (oxlint)

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Contract
compilation is included as a commented-out step — uncomment it once the
Compact CLI is available in your CI runner.

## Usage Guide

See [`docs/USAGE.md`](docs/USAGE.md) for a full walkthrough covering both
the payer flow (fund + commit) and the recipient flow (claim + prove
income).

## Product X Profile

[QuietPay X Profile](https://x.com/quietpayS)
- [Launch Tweet](https://x.com/quietpayS/status/2103888560378277949)

## Project Structure

```
quietpay/
├── contracts/quietpay.compact   # privacy-critical core: fund/commit/claim/prove circuits
├── managed/                     # compact compile output (generated)
├── src/
│   ├── components/               # WalletConnect, PayerPanel, RecipientPanel, PublicLedger, Layout
│   ├── hooks/useMidnight.ts      # wallet + contract call orchestration
│   └── utils/contract.ts         # wallet/contract client (SDK wiring points marked)
├── tests/quietpay.test.ts        # 11 passing tests
├── docs/USAGE.md
├── PROPOSAL.md                   # carried over from Level 3
└── .github/workflows/ci.yml
```

## Roadmap (Level 5–6)

- Real token transfers instead of a counter-based pool
- Merkle-tree commitments for arbitrary-size recipient lists
- Recurring pay periods and vesting schedules
- Mainnet deployment at Level 6 (the Supermoon)
