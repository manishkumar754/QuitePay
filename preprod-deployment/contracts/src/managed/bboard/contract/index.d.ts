import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  amount(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  salt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  holderSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  fundPool(context: __compactRuntime.CircuitContext<PS>, totalAmount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  commitSplit(context: __compactRuntime.CircuitContext<PS>,
              recipientKey_0: Uint8Array,
              commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimPayout(context: __compactRuntime.CircuitContext<PS>,
              recipientKey_0: Uint8Array,
              periodId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveIncomeAtLeast(context: __compactRuntime.CircuitContext<PS>,
                     recipientKey_0: Uint8Array,
                     threshold_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  isClaimed(context: __compactRuntime.CircuitContext<PS>,
            nullifier_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
}

export type ProvableCircuits<PS> = {
  fundPool(context: __compactRuntime.CircuitContext<PS>, totalAmount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  commitSplit(context: __compactRuntime.CircuitContext<PS>,
              recipientKey_0: Uint8Array,
              commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimPayout(context: __compactRuntime.CircuitContext<PS>,
              recipientKey_0: Uint8Array,
              periodId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveIncomeAtLeast(context: __compactRuntime.CircuitContext<PS>,
                     recipientKey_0: Uint8Array,
                     threshold_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  isClaimed(context: __compactRuntime.CircuitContext<PS>,
            nullifier_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  fundPool(context: __compactRuntime.CircuitContext<PS>, totalAmount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  commitSplit(context: __compactRuntime.CircuitContext<PS>,
              recipientKey_0: Uint8Array,
              commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimPayout(context: __compactRuntime.CircuitContext<PS>,
              recipientKey_0: Uint8Array,
              periodId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveIncomeAtLeast(context: __compactRuntime.CircuitContext<PS>,
                     recipientKey_0: Uint8Array,
                     threshold_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  isClaimed(context: __compactRuntime.CircuitContext<PS>,
            nullifier_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
}

export type Ledger = {
  readonly poolTotal: bigint;
  recipientCommitments: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  claimedNullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  claims: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
