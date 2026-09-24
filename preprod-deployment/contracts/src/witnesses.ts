import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

export type BBoardPrivateState = {
  readonly amount: bigint;
  readonly salt: Uint8Array;
  readonly holderSecret: Uint8Array;
};

export const createBBoardPrivateState = (amount: bigint, salt: Uint8Array, holderSecret: Uint8Array) => ({
  amount, salt, holderSecret
});

export const witnesses = {
  amount: ({ privateState }: any): [any, bigint] => [privateState, privateState.amount || 0n],
  salt: ({ privateState }: any): [any, Uint8Array] => [privateState, privateState.salt || new Uint8Array(32)],
  holderSecret: ({ privateState }: any): [any, Uint8Array] => [privateState, privateState.holderSecret || new Uint8Array(32)],
};
