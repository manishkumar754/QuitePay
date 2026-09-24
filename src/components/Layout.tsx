import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-text-hi">
      <header className="border-b border-slate-700">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-3">
            <VaultMark />
            <span className="font-display text-xl tracking-tight">
              QuietPay
            </span>
          </a>
          <nav className="flex items-center gap-6 text-sm text-text-mid">
            <a
              href="https://github.com"
              className="hover:text-text-hi transition-colors"
            >
              GitHub
            </a>
            <a href="#docs" className="hover:text-text-hi transition-colors">
              How it works
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-700">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-text-low">
          <p>Built on Midnight · Preprod</p>
          <p className="font-mono text-xs">contracts/quietpay.compact</p>
        </div>
      </footer>
    </div>
  );
}

function VaultMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#1F252B" />
      <circle cx="32" cy="32" r="30" stroke="#5E9C81" strokeWidth="2" />
      <circle cx="32" cy="32" r="15" stroke="#5E9C81" strokeWidth="2.5" fill="none" />
      <circle cx="32" cy="32" r="3.5" fill="#5E9C81" />
      <path
        d="M32 15 V21 M32 43 V49 M15 32 H21 M43 32 H49"
        stroke="#5E9C81"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
