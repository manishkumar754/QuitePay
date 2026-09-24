import { Layout } from "./components/Layout";
import { WalletConnect } from "./components/WalletConnect";
import { PayerPanel } from "./components/PayerPanel";
import { RecipientPanel } from "./components/RecipientPanel";
import { PublicLedger } from "./components/PublicLedger";
import { useMidnight } from "./hooks/useMidnight";

function App() {
  const {
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
  } = useMidnight();

  return (
    <Layout>
      <section id="top" className="mx-auto max-w-6xl px-6 pt-16 pb-14">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
          <div>
            <h1 className="font-display text-5xl sm:text-6xl leading-[1.05] tracking-tight">
              Pay everyone.
              <br />
              Reveal to no one.
            </h1>
            <p className="mt-6 text-lg text-text-mid max-w-lg leading-relaxed">
              QuietPay distributes a pool of funds across a private split.
              The pool total and that everyone got paid are public and
              auditable — exactly who got how much never touches the
              ledger.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <WalletConnect
                status={status}
                wallet={wallet}
                onConnect={connect}
                onDisconnect={disconnect}
              />
              <a
                href="#docs"
                className="text-sm text-text-mid hover:text-text-hi underline underline-offset-4 transition-colors"
              >
                See how the split works
              </a>
            </div>
          </div>

          <div className="hidden lg:flex justify-center">
            <VaultIllustration />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            <PayerPanel
              status={status}
              error={error}
              connected={!!wallet}
              poolTotal={poolTotal}
              onFundPool={runFundPool}
              onCommitSplit={(entry) => runCommitSplit(entry)}
            />
            <RecipientPanel
              status={status}
              connected={!!wallet}
              lastProof={lastProof}
              onClaim={(input) => runClaimPayout(input)}
              onProveIncome={(input) => runProveIncome(input)}
            />
          </div>
          <PublicLedger
            poolTotal={poolTotal}
            commitments={commitments}
            claims={claims}
          />
        </div>
      </section>

      <section id="docs" className="border-t border-slate-700">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl mb-10">How the split works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <Step
              n="1"
              title="Fund and commit"
              body="The payer funds a pool (public total) and commits a hash of each recipient's amount plus a random salt — binding, but revealing nothing."
            />
            <Step
              n="2"
              title="Claim privately"
              body="Each recipient proves their private amount and salt match their published commitment, then claims — the ledger records only a nullifier and a claimed flag."
            />
            <Step
              n="3"
              title="Prove income later"
              body="A recipient can separately prove their payout cleared a threshold to a third party — a lender, a landlord — without that party or QuietPay ever seeing the amount."
            />
          </div>
        </div>
      </section>
    </Layout>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-patina-500/50 font-display text-patina-400">
        {n}
      </div>
      <h3 className="font-display text-lg mb-2">{title}</h3>
      <p className="text-sm text-text-mid leading-relaxed">{body}</p>
    </div>
  );
}

function VaultIllustration() {
  return (
    <svg width="280" height="280" viewBox="0 0 280 280" fill="none" aria-hidden="true">
      <circle cx="140" cy="140" r="120" fill="#1F252B" />
      <circle cx="140" cy="140" r="120" stroke="#5E9C81" strokeWidth="1.5" />
      <circle cx="140" cy="140" r="104" stroke="#3D4650" strokeWidth="1" strokeDasharray="2 6" />
      <circle cx="140" cy="140" r="58" stroke="#5E9C81" strokeWidth="3" fill="none" />
      <circle cx="140" cy="140" r="12" fill="#5E9C81" />
      <path
        d="M140 58 V82 M140 198 V222 M58 140 H82 M198 140 H222"
        stroke="#5E9C81"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default App;
