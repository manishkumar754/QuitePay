/**
 * contract.ts
 * -----------
 * Thin wrapper around the Midnight wallet connector and the generated
 * contract client for `contracts/quietpay.compact`.
 *
 * Everything that talks to real infrastructure is marked with
 * TODO(midnight-sdk). Until wired up, this module runs a local, honest
 * simulation of the same commit/claim/prove flow (hashing, nullifier
 * derivation, threshold checks) so the UI is fully testable before
 * wallet + Preprod wiring is finished.
 *
 * To go live:
 *   1. `compact compile contracts/quietpay.compact managed/quietpay`
 *   2. `npm install @midnight-ntwrk/dapp-connector-api @midnight-ntwrk/midnight-js-contracts`
 *   3. Replace the TODO(midnight-sdk) blocks below with real calls
 *      against the generated `managed/quietpay` contract client.
 */

export interface WalletState {
  address: string;
  network: "preview" | "preprod" | "mainnet";
}

export interface SplitEntry {
  recipientLabel: string; // local display label only, never sent on-chain
  recipientKey: string; // opaque identifier — a hash of the recipient's key
  amount: number; // private: real payout amount
}

export interface CommitmentRecord {
  recipientKey: string;
  recipientLabel: string;
  commitment: string;
}

export interface ClaimInput {
  recipientKey: string;
  periodId: string;
  amount: number;
  salt: string;
  holderSecret: string;
}

export interface ClaimRecord {
  nullifier: string;
  claimed: boolean;
  timestamp: number;
}

export interface IncomeProofInput {
  recipientKey: string;
  amount: number;
  salt: string;
  threshold: number;
}

// ---------------------------------------------------------------------
// Wallet connection
// ---------------------------------------------------------------------
export async function connectWallet(): Promise<WalletState> {
  // TODO(midnight-sdk): replace with the real Lace/Midnight connector, e.g.
  //   const api = await window.midnight?.mnLace?.enable();
  //   const state = await api.state();
  //   return { address: state.address, network: "preprod" };
  await delay(500);
  return { address: "addr_preprod1" + randomHex(20), network: "preprod" };
}

export async function disconnectWallet(): Promise<void> {
  await delay(150);
}

// ---------------------------------------------------------------------
// fundPool — payer discloses only the total.
// ---------------------------------------------------------------------
export async function fundPool(totalAmount: number): Promise<{ poolTotal: number }> {
  // TODO(midnight-sdk): call contract.callTx.fundPool(BigInt(totalAmount))
  await delay(400);
  if (totalAmount <= 0) throw new Error("Pool total must be greater than zero");
  return { poolTotal: totalAmount };
}

// ---------------------------------------------------------------------
// commitSplit — publish one commitment per recipient without the amount.
// ---------------------------------------------------------------------
export async function commitSplit(entry: SplitEntry): Promise<CommitmentRecord> {
  // TODO(midnight-sdk): call contract.callTx.commitSplit(recipientKey, commitment)
  await delay(300);
  const salt = randomHex(16);
  const commitment = await sha256Hex(`${entry.amount}:${salt}`);
  return {
    recipientKey: entry.recipientKey,
    recipientLabel: entry.recipientLabel,
    commitment,
  };
}

// ---------------------------------------------------------------------
// claimPayout — mirrors the exact checks the circuit performs.
// ---------------------------------------------------------------------
export async function claimPayout(input: ClaimInput): Promise<ClaimRecord> {
  // TODO(midnight-sdk): replace with a real call into the generated
  // contract client:
  //   const tx = await contract.callTx.claimPayout(recipientKey, periodId, {
  //     privateState: { amount, salt, holderSecret },
  //   });
  //   return { nullifier: tx.public.nullifier, claimed: tx.public.claimed, ... };
  await delay(900);

  if (input.amount <= 0) {
    throw new Error("Nothing to claim — amount must be greater than zero");
  }

  const nullifier = await sha256Hex(
    `${input.periodId}:${input.recipientKey}:${input.holderSecret}`
  );

  return {
    nullifier,
    claimed: true,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

// ---------------------------------------------------------------------
// proveIncomeAtLeast — pure verification, writes nothing on-chain.
// ---------------------------------------------------------------------
export async function proveIncomeAtLeast(
  input: IncomeProofInput
): Promise<{ passes: boolean }> {
  // TODO(midnight-sdk): call contract.callTx.proveIncomeAtLeast(...)
  // as a read-only circuit call against the recipient's committed leaf.
  await delay(700);
  return { passes: input.amount >= input.threshold };
}

// ---------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

export function randomKeyHex(bytes = 16): string {
  return randomHex(bytes);
}
