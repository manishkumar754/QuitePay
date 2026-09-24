/**
 * quietpay.test.ts
 * ----------------
 * Exercises the same fund/commit/claim/prove logic that
 * `contracts/quietpay.compact` implements in-circuit. Runs today against
 * the local mirror in `src/utils/contract.ts` (see the
 * TODO(midnight-sdk) markers there); point these at the compiled
 * contract's test harness once `compact compile` has produced
 * `managed/quietpay`.
 *
 * Run with: npm test
 */
import { describe, it, expect } from "vitest";
import {
  claimPayout,
  commitSplit,
  fundPool,
  proveIncomeAtLeast,
  randomKeyHex,
} from "../src/utils/contract";

describe("quietpay pool funding", () => {
  it("accepts a positive pool total", async () => {
    const { poolTotal } = await fundPool(10000);
    expect(poolTotal).toBe(10000);
  });

  it("rejects a zero or negative pool total", async () => {
    await expect(fundPool(0)).rejects.toThrow(/greater than zero/i);
    await expect(fundPool(-500)).rejects.toThrow(/greater than zero/i);
  });
});

describe("quietpay split commitments", () => {
  it("produces a commitment that does not contain the raw amount", async () => {
    const key = randomKeyHex();
    const record = await commitSplit({
      recipientLabel: "Contributor A",
      recipientKey: key,
      amount: 4200,
    });
    expect(record.commitment).not.toContain("4200");
    expect(record.recipientKey).toBe(key);
  });

  it("produces different commitments for the same amount (random salt)", async () => {
    const key = randomKeyHex();
    const a = await commitSplit({ recipientLabel: "A", recipientKey: key, amount: 1000 });
    const b = await commitSplit({ recipientLabel: "A", recipientKey: key, amount: 1000 });
    expect(a.commitment).not.toBe(b.commitment);
  });
});

describe("quietpay claims", () => {
  const baseClaim = {
    recipientKey: randomKeyHex(),
    periodId: "2026-09",
    amount: 2500,
    salt: "abc123",
    holderSecret: "secret-0001",
  };

  it("claims successfully with a positive amount", async () => {
    const record = await claimPayout(baseClaim);
    expect(record.claimed).toBe(true);
    expect(record.nullifier).toBeTruthy();
  });

  it("rejects a claim with zero amount", async () => {
    await expect(
      claimPayout({ ...baseClaim, amount: 0 })
    ).rejects.toThrow(/nothing to claim/i);
  });

  it("produces a stable nullifier for the same period + recipient + secret", async () => {
    const a = await claimPayout(baseClaim);
    const b = await claimPayout(baseClaim);
    expect(a.nullifier).toBe(b.nullifier);
  });

  it("produces a different nullifier for a different pay period", async () => {
    const a = await claimPayout(baseClaim);
    const b = await claimPayout({ ...baseClaim, periodId: "2026-10" });
    expect(a.nullifier).not.toBe(b.nullifier);
  });

  it("never includes the raw amount in the returned claim record", async () => {
    const record = await claimPayout(baseClaim);
    expect(JSON.stringify(record)).not.toContain("2500");
  });
});

describe("quietpay income threshold proof", () => {
  it("passes when the amount meets the threshold", async () => {
    const { passes } = await proveIncomeAtLeast({
      recipientKey: randomKeyHex(),
      amount: 3000,
      salt: "salt-1",
      threshold: 2000,
    });
    expect(passes).toBe(true);
  });

  it("fails when the amount is below the threshold", async () => {
    const { passes } = await proveIncomeAtLeast({
      recipientKey: randomKeyHex(),
      amount: 1200,
      salt: "salt-1",
      threshold: 2000,
    });
    expect(passes).toBe(false);
  });
});
