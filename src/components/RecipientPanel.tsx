import { useState, type FormEvent } from "react";
import type { Status } from "../hooks/useMidnight";
import { randomKeyHex } from "../utils/contract";

interface RecipientPanelProps {
  status: Status;
  connected: boolean;
  lastProof: boolean | null;
  onClaim: (input: {
    recipientKey: string;
    periodId: string;
    amount: number;
    salt: string;
    holderSecret: string;
  }) => void;
  onProveIncome: (input: {
    recipientKey: string;
    amount: number;
    salt: string;
    threshold: number;
  }) => void;
}

export function RecipientPanel({
  status,
  connected,
  lastProof,
  onClaim,
  onProveIncome,
}: RecipientPanelProps) {
  const [mode, setMode] = useState<"claim" | "prove">("claim");
  const [recipientKey, setRecipientKey] = useState("");
  const [periodId, setPeriodId] = useState("2026-09");
  const [amount, setAmount] = useState("");
  const [salt, setSalt] = useState("");
  const [holderSecret, setHolderSecret] = useState(randomKeyHex());
  const [threshold, setThreshold] = useState("2000");

  const busy = status === "working";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (Number.isNaN(amt)) return;

    if (mode === "claim") {
      onClaim({ recipientKey, periodId, amount: amt, salt, holderSecret });
    } else {
      onProveIncome({
        recipientKey,
        amount: amt,
        salt,
        threshold: Number(threshold) || 0,
      });
    }
  }

  return (
    <div className="rounded-2xl border border-patina-600/40 bg-ledger-100 text-slate-950 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-patina-600 mb-1">
            Recipient — stays on your device
          </p>
          <h2 className="font-display text-2xl">Claim or prove</h2>
        </div>
        <div className="flex rounded-lg border border-ledger-300 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setMode("claim")}
            className={`px-3 py-1.5 transition-colors ${
              mode === "claim"
                ? "bg-slate-900 text-ledger-100"
                : "bg-white text-slate-700"
            }`}
          >
            Claim
          </button>
          <button
            type="button"
            onClick={() => setMode("prove")}
            className={`px-3 py-1.5 transition-colors ${
              mode === "prove"
                ? "bg-slate-900 text-ledger-100"
                : "bg-white text-slate-700"
            }`}
          >
            Prove income
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="rkey" className="block text-sm mb-1.5 text-slate-800">
            Your recipient key
          </label>
          <input
            id="rkey"
            type="text"
            required
            value={recipientKey}
            onChange={(e) => setRecipientKey(e.target.value)}
            placeholder="Paste the key your payer committed against"
            className="w-full rounded-lg border border-ledger-300 bg-white px-3 py-2.5 text-xs font-mono focus-visible:outline-patina-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="amt" className="block text-sm mb-1.5 text-slate-800">
              Your amount
            </label>
            <input
              id="amt"
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-ledger-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-patina-600"
            />
          </div>
          <div>
            <label htmlFor="salt" className="block text-sm mb-1.5 text-slate-800">
              Salt from your payer
            </label>
            <input
              id="salt"
              type="text"
              required
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              className="w-full rounded-lg border border-ledger-300 bg-white px-3 py-2.5 text-xs font-mono focus-visible:outline-patina-600"
            />
          </div>
        </div>

        {mode === "claim" ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="period" className="block text-sm mb-1.5 text-slate-800">
                Pay period ID
              </label>
              <input
                id="period"
                type="text"
                value={periodId}
                onChange={(e) => setPeriodId(e.target.value)}
                className="w-full rounded-lg border border-ledger-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-patina-600"
              />
            </div>
            <div>
              <label htmlFor="secret" className="block text-sm mb-1.5 text-slate-800">
                Holder secret
              </label>
              <input
                id="secret"
                type="text"
                value={holderSecret}
                onChange={(e) => setHolderSecret(e.target.value)}
                className="w-full rounded-lg border border-ledger-300 bg-white px-3 py-2.5 text-xs font-mono focus-visible:outline-patina-600"
              />
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="threshold" className="block text-sm mb-1.5 text-slate-800">
              Threshold to prove against
            </label>
            <input
              id="threshold"
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full rounded-lg border border-ledger-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-patina-600"
            />
            <p className="mt-1 text-xs text-slate-800/60">
              Proves "my payout was ≥ this value" to whoever you share the
              proof with — nothing is written to the ledger.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !connected}
          className="w-full rounded-lg bg-slate-900 text-ledger-100 py-3 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {!connected
            ? "Connect a wallet to continue"
            : busy
            ? mode === "claim"
              ? "Submitting claim…"
              : "Generating proof…"
            : mode === "claim"
            ? "Claim payout"
            : "Generate income proof"}
        </button>

        {mode === "prove" && lastProof !== null && (
          <p
            className={`text-sm rounded-lg px-3 py-2 ${
              lastProof
                ? "text-patina-600 bg-patina-500/10"
                : "text-clay-500 bg-clay-500/10"
            }`}
          >
            {lastProof
              ? "Proof succeeded — your payout meets that threshold."
              : "Proof failed — your payout is below that threshold."}
          </p>
        )}
      </form>
    </div>
  );
}
