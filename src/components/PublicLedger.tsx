import type { ClaimRecord, CommitmentRecord } from "../utils/contract";

interface PublicLedgerProps {
  poolTotal: number | null;
  commitments: CommitmentRecord[];
  claims: ClaimRecord[];
}

export function PublicLedger({
  poolTotal,
  commitments,
  claims,
}: PublicLedgerProps) {
  return (
    <div className="steel-grain rounded-2xl border border-slate-600 bg-slate-800 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-patina-400 mb-1">
            Written to Preprod
          </p>
          <h2 className="font-display text-2xl">Public ledger</h2>
        </div>
        <span className="rounded-full border border-slate-600 px-3 py-1 text-xs text-text-mid">
          {claims.length} of {commitments.length} claimed
        </span>
      </div>

      <div className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3.5 mb-6 flex items-center justify-between">
        <span className="text-sm text-text-mid">Pool total this period</span>
        <span className="font-mono text-sm text-text-hi">
          {poolTotal !== null ? poolTotal.toLocaleString() : "— not funded yet"}
        </span>
      </div>

      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-text-low mb-2">
          Commitments ({commitments.length})
        </p>
        {commitments.length === 0 ? (
          <EmptyRow text="No splits committed yet." />
        ) : (
          <ul className="space-y-2">
            {commitments.map((c) => (
              <li
                key={c.commitment}
                className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm text-text-hi truncate">{c.recipientLabel}</p>
                  <p className="font-mono text-[11px] text-text-low truncate">
                    key {c.recipientKey.slice(0, 14)}…
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-patina-400">
                  {c.commitment.slice(0, 10)}…
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-text-low mb-2">
          Claims ({claims.length})
        </p>
        {claims.length === 0 ? (
          <EmptyRow text="No payouts claimed yet." />
        ) : (
          <ul className="space-y-2">
            {claims.map((c) => (
              <li
                key={c.nullifier + c.timestamp}
                className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 flex items-center justify-between gap-4"
              >
                <p className="font-mono text-[11px] text-text-low truncate">
                  nullifier {c.nullifier.slice(0, 20)}…
                </p>
                <span className="shrink-0 rounded-full bg-patina-500/15 text-patina-400 px-3 py-1 text-xs font-medium">
                  Claimed
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-slate-600 px-4 py-3 text-xs text-text-low leading-relaxed">
        Every amount here is a hash, not a number. No entry on this ledger —
        not the commitments, not the claims — reveals what any recipient
        was actually paid.
      </div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-slate-600 px-4 py-6 text-center">
      <p className="text-sm text-text-mid">{text}</p>
    </div>
  );
}
