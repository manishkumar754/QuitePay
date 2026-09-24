import { useCallback, useState } from "react";
import {
  claimPayout,
  commitSplit,
  connectWallet,
  disconnectWallet,
  fundPool,
  proveIncomeAtLeast,
  type ClaimInput,
  type ClaimRecord,
  type CommitmentRecord,
  type IncomeProofInput,
  type SplitEntry,
  type WalletState,
} from "../utils/contract";

export type Status =
  | "idle"
  | "connecting"
  | "connected"
  | "working"
  | "error";

/**
 * useMidnight
 * -----------
 * Central hook for all wallet + contract interaction across the payroll
 * flow: fund a pool, commit private splits, claim a payout, and prove
 * income to a third party. Components never talk to the wallet or
 * contract client directly — everything routes through here.
 *
 * The actual Midnight wallet connector and generated contract client
 * (from `managed/`, produced by `compact compile`) are wired up in
 * `src/utils/contract.ts` — this hook is SDK-agnostic on purpose.
 */
export function useMidnight() {
  const [status, setStatus] = useState<Status>("idle");
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [poolTotal, setPoolTotal] = useState<number | null>(null);
  const [commitments, setCommitments] = useState<CommitmentRecord[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [lastProof, setLastProof] = useState<boolean | null>(null);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    try {
      const w = await connectWallet();
      setWallet(w);
      setStatus("connected");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect wallet");
      setStatus("error");
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setWallet(null);
    setStatus("idle");
  }, []);

  const runFundPool = useCallback(async (total: number) => {
    setError(null);
    setStatus("working");
    try {
      const { poolTotal: total2 } = await fundPool(total);
      setPoolTotal(total2);
      setStatus("connected");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fund pool");
      setStatus("error");
    }
  }, []);

  const runCommitSplit = useCallback(async (entry: SplitEntry) => {
    setError(null);
    setStatus("working");
    try {
      const record = await commitSplit(entry);
      setCommitments((prev) => [record, ...prev]);
      setStatus("connected");
      return record;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to commit split");
      setStatus("error");
      return null;
    }
  }, []);

  const runClaimPayout = useCallback(
    async (input: ClaimInput) => {
      if (!wallet) {
        setError("Connect a wallet before claiming");
        setStatus("error");
        return null;
      }
      setError(null);
      setStatus("working");
      try {
        const record = await claimPayout(input);
        setClaims((prev) => [record, ...prev]);
        setStatus("connected");
        return record;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Claim failed");
        setStatus("error");
        return null;
      }
    },
    [wallet]
  );

  const runProveIncome = useCallback(async (input: IncomeProofInput) => {
    setError(null);
    setStatus("working");
    try {
      const { passes } = await proveIncomeAtLeast(input);
      setLastProof(passes);
      setStatus("connected");
      return passes;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Proof generation failed");
      setStatus("error");
      return null;
    }
  }, []);

  return {
    status,
    wallet,
    error,
    poolTotal,
    commitments,
    claims,
    lastProof,
    connect,
    disconnect,
    runFundPool,
    runCommitSplit,
    runClaimPayout,
    runProveIncome,
  };
}
