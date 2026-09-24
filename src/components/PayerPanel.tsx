import { useState, type FormEvent } from "react";
import type { Status } from "../hooks/useMidnight";
import { randomKeyHex } from "../utils/contract";

interface PayerPanelProps {
  status: Status;
  error: string | null;
  connected: boolean;
  poolTotal: number | null;
  onFundPool: (total: number) => void;
  onCommitSplit: (entry: {
    recipientLabel: string;
    recipientKey: string;
    amount: number;
  }) => void;
}

export function PayerPanel({
  status,
  error,
  connected,
  poolTotal,
  onFundPool,
  onCommitSplit,
}: PayerPanelProps) {
  const [totalInput, setTotalInput] = useState("10000");
  const [recipientLabel, setRecipientLabel] = useState("Contributor A");
  const [recipientKey, setRecipientKey] = useState(randomKeyHex());
  const [amount, setAmount] = useState("");

  const busy = status === "working";

  function handleFund(e: FormEvent) {
    e.preventDefault();
    const total = Number(totalInput);
    if (Number.isNaN(total)) return;
    onFundPool(total);
  }

  function handleCommit(e: FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) return;
    onCommitSplit({ recipientLabel, recipientKey, amount: amt });
    setRecipientKey(randomKeyHex());
    setAmount("");
  }

  return (
    <div className="rounded-2xl border border-patina-600/40 bg-ledger-100 text-slate-950 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-patina-600 mb-1">
            Payer — stays on your device
          </p>
          <h2 className="font-display text-2xl">Fund &amp; commit splits</h2>
        </div>
        <VaultGlyph />
      </div>

      <form onSubmit={handleFund} className="mb-6 flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="total" className="block text-sm mb-1.5 text-slate-800">
            Pool total for this period
          </label>
          <input
            id="total"
            type="number"
            value={totalInput}
            onChange={(e) => setTotalInput(e.target.value)}
            className="w-full rounded-lg border border-ledger-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-patina-600"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !connected}
          className="rounded-lg bg-slate-900 text-ledger-100 px-4 py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Fund pool
        </button>
      </form>

      {poolTotal !== null && (
        <p className="mb-6 text-xs text-slate-800/70 bg-patina-500/10 rounded-lg px-3 py-2">
          Pool funded with <strong>{poolTotal.toLocaleString()}</strong> total —
          this figure is public. Individual splits below are not.
        </p>
      )}

      <div className="h-px bg-ledger-300 mb-6" />

      <form onSubmit={handleCommit} className="space-y-4">
        <p className="text-sm text-slate-800 font-medium">
          Commit one recipient's private split
        </p>
        <div>
          <label htmlFor="label" className="block text-sm mb-1.5 text-slate-800">
            Recipient label{" "}
            <span className="text-slate-800/50 font-normal">(local only, never on-chain)</span>
          </label>
          <input
            id="label"
            type="text"
            value={recipientLabel}
            onChange={(e) => setRecipientLabel(e.target.value)}
            className="w-full rounded-lg border border-ledger-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-patina-600"
          />
        </div>
        <div>
          <label htmlFor="key" className="block text-sm mb-1.5 text-slate-800">
            Recipient key (opaque identifier)
          </label>
          <input
            id="key"
            type="text"
            value={recipientKey}
            onChange={(e) => setRecipientKey(e.target.value)}
            className="w-full rounded-lg border border-ledger-300 bg-white px-3 py-2.5 text-xs font-mono focus-visible:outline-patina-600"
          />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm mb-1.5 text-slate-800">
            Amount for this recipient
          </label>
          <input
            id="amount"
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 2400"
            className="w-full rounded-lg border border-ledger-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-patina-600"
          />
          <p className="mt-1 text-xs text-slate-800/60">
            This number is hashed with a random salt before it ever leaves
            your device — only the resulting commitment is published.
          </p>
        </div>
        <button
          type="submit"
          disabled={busy || !connected}
          className="w-full rounded-lg bg-slate-900 text-ledger-100 py-3 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {!connected
            ? "Connect a wallet to continue"
            : busy
            ? "Committing…"
            : "Publish commitment"}
        </button>
        {error && (
          <p className="text-sm text-clay-500 bg-clay-500/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

function VaultGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="#457A64" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" stroke="#457A64" strokeWidth="1.6" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="#457A64" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
