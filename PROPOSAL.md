# QuietPay — Product Proposal (Level 3 idea)

**Track:** Payments

## Problem Statement

Payroll and fund-distribution systems are one of the strongest use cases for
blockchains — trustless execution, no intermediary skimming fees, auditable
proof that everyone got paid — yet they're almost never built on public
chains, because public chains make the trade-off exactly backwards. To gain
the trustless guarantee, every recipient's exact compensation, every raise,
every bonus, and every performance-based split becomes permanently visible
to anyone who looks at the contract. That's the opposite of how real payroll
works anywhere in the world: compensation is typically confidential between
employer and employee, even when the fact that payroll ran, and that it was
funded correctly, is entirely fine to make public.

This creates a specific, recurring failure mode for teams, DAOs, and
contributor pools that want to use crypto rails for payments:

1. **Compensation becomes involuntarily public** — coworkers, competitors,
   and recruiters can all see exact pay differences, raises, and bonus
   structures, creating friction, inequity disputes, and competitive
   intelligence leaks that have nothing to do with the payment itself.
2. **No selective proof of income** — a recipient who legitimately needs to
   prove "I earned at least X this period" has no way to do that without
   either exposing their full payment history or falling back to a
   centralized, non-verifiable pay stub.
3. **No confidential multi-party splits** — pools that need to divide funds
   among several recipients by private, possibly performance-weighted
   percentages either abandon on-chain distribution entirely or accept that
   every recipient can see every other recipient's share.

**The gap this fills:** there's no accessible on-chain primitive that
separates "did the payout happen correctly, in full, from a solvent pool"
(which can and should be public and auditable) from "who got exactly how
much" (which should stay private by default, provable only by the
recipient, to whomever they choose).

## Idea

**QuietPay** is a Compact contract + frontend for confidential fund
distribution:

- A payer funds a pool with a **public total**.
- The payer commits a **hash** of each recipient's (amount, salt) pair —
  binding them to a specific split without revealing it.
- Each recipient proves their private amount and salt match their
  published commitment, then **claims** — the ledger records only a
  nullifier and a claimed flag, never the amount.
- A recipient can separately **prove income** ("my payout was ≥ X") to a
  third party without revealing the amount to that party or to QuietPay.

## Why Midnight

Midnight's private-by-default circuit inputs and explicit `disclose()`
boundary let the contract be precise about exactly which facts are public
(pool solvency, that a claim happened) and which stay private (who got how
much) — a distinction most chains can't express at all.

## Level 4 Scope (this submission)

- `contracts/quietpay.compact` — fund pool, commit split, claim payout
  (with nullifier), and a standalone income-threshold proof circuit.
- A frontend with a payer view (fund + commit) and a recipient view
  (claim + prove income), plus a public ledger panel showing only what's
  actually on-chain.
- CI running tests and a production build on every push.
- Full documentation of the privacy model.

## Path to Level 5/6

- Real token transfers instead of a counter-based pool.
- Merkle-tree commitments so a single root covers an arbitrary-size
  recipient list instead of one ledger entry per recipient.
- Recurring pay periods and vesting schedules.
- Mainnet deployment at Level 6.
