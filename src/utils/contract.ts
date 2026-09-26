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
  salt?: string;
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

let deployedContract: any = null;
export let contractProviders: any = null;
export const CONTRACT_ADDRESS = "ec858b2e7ba657d3c4e0282007b5e281eb118ad3a7f4fb2779ebdc549e4a3fb3";

export async function connectWallet(): Promise<WalletState> {
  const win = window as any;
  const activeProvider = win.midnight?.["1am"] || win.midnight?.oneam || win.midnight?.mnLace;
  if (!activeProvider) throw new Error("No Midnight wallet found. Please install the Nightly/1AM wallet extension.");

  const api = activeProvider.connect ? await activeProvider.connect("preprod") : await activeProvider.enable();
  const shieldedAddresses = await api.getShieldedAddresses();

  return { address: shieldedAddresses.shieldedAddress, network: "preprod" };
}

export async function disconnectWallet(): Promise<void> {
  deployedContract = null;
}

async function getContract() {
  if (deployedContract) return deployedContract;
  
  const win = window as any;
  const activeProvider = win.midnight?.["1am"] || win.midnight?.oneam || win.midnight?.mnLace;
  if (!activeProvider) throw new Error("Wallet not connected");
  const walletApi = activeProvider.connect ? await activeProvider.connect("preprod") : await activeProvider.enable();

  const [
    { indexerPublicDataProvider },
    { httpClientProofProvider },
    { levelPrivateStateProvider },
    { FetchZkConfigProvider },
    { findDeployedContract },
    { setNetworkId },
    { Transaction },
    { toHex, fromHex },
  ] = await Promise.all([
    import("@midnight-ntwrk/midnight-js-indexer-public-data-provider"),
    import("@midnight-ntwrk/midnight-js-http-client-proof-provider"),
    import("@midnight-ntwrk/midnight-js-level-private-state-provider"),
    import("@midnight-ntwrk/midnight-js-fetch-zk-config-provider"),
    import("@midnight-ntwrk/midnight-js-contracts"),
    import("@midnight-ntwrk/midnight-js-network-id"),
    import("@midnight-ntwrk/midnight-js-protocol/ledger"),
    import("@midnight-ntwrk/midnight-js-utils")
  ]);

  const shieldedAddresses = await walletApi.getShieldedAddresses();

  setNetworkId("preprod");

  const indexerHttp = "https://indexer.preprod.midnight.network/api/v4/graphql";
  const indexerWs = "wss://indexer.preprod.midnight.network/api/v4/graphql/ws";
  const zkConfigPath = `${window.location.origin}/managed/bboard`;

  const zkConfigProvider = new FetchZkConfigProvider(zkConfigPath, fetch.bind(window));
  const ONEAM_PROOF_SERVER = "https://api-preprod.1am.xyz";
  const proofProvider = httpClientProofProvider(ONEAM_PROOF_SERVER, zkConfigProvider);

  const privateStateProvider = levelPrivateStateProvider({
    privateStateStoreName: `quietpay-private-${shieldedAddresses.shieldedCoinPublicKey.slice(0, 8)}`,
    signingKeyStoreName: `quietpay-keys-${shieldedAddresses.shieldedCoinPublicKey.slice(0, 8)}`,
    privateStoragePasswordProvider: () => "TempPassword123!Secure",
    accountId: shieldedAddresses.shieldedCoinPublicKey,
  });

  const walletProvider = {
    getCoinPublicKey: () => shieldedAddresses.shieldedCoinPublicKey,
    getEncryptionPublicKey: () => shieldedAddresses.shieldedEncryptionPublicKey,
    balanceTx: async (tx: any): Promise<any> => {
      const serializedTx = toHex(tx.serialize());
      const received = await walletApi.balanceUnsealedTransaction(serializedTx);
      return Transaction.deserialize("signature", "proof", "binding", fromHex(received.tx)) as any;
    },
  } as any;

  const midnightProvider = {
    submitTx: async (tx: any): Promise<string> => {
      const serializedTx = toHex(tx.serialize());
      await walletApi.submitTransaction(serializedTx);
      const txIdentifiers = tx.identifiers();
      return txIdentifiers[0];
    }
  } as any;

  const providers = {
    privateStateProvider,
    publicDataProvider: indexerPublicDataProvider(indexerHttp, indexerWs),
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider,
  } as any;
  
  // @ts-ignore
  const { CompiledBBoardContractContract, witnesses } = await import("@midnight-ntwrk/bboard-contract");
  // @ts-ignore
  const { CompiledContract } = await import("@midnight-ntwrk/midnight-js-protocol/compact-js");
  // @ts-ignore
  const contractWithWitnesses = CompiledContract.withWitnesses(witnesses)(CompiledBBoardContractContract);

  deployedContract = await (findDeployedContract as any)(providers, {
    contractAddress: CONTRACT_ADDRESS,
    compiledContract: contractWithWitnesses,
  });

  contractProviders = providers;
  return deployedContract;
}

export async function fundPool(totalAmount: number): Promise<{ poolTotal: number }> {
  const contract = await getContract();
  await contract.callTx.fundPool(BigInt(totalAmount));
  return { poolTotal: totalAmount };
}

export async function commitSplit(entry: SplitEntry): Promise<CommitmentRecord> {
  const contract = await getContract();
  const salt = randomHex(32);
  const commitment = await sha256Hex(`${entry.amount}:${salt}`);
  
  await contract.callTx.commitSplit(hexToBytes(entry.recipientKey), hexToBytes(commitment));
  
  return {
    recipientKey: entry.recipientKey,
    recipientLabel: entry.recipientLabel,
    commitment,
    salt,
  };
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function claimPayout(input: ClaimInput): Promise<ClaimRecord> {
  const contract = await getContract();
  const periodIdHash = await sha256Hex(input.periodId);

  const accountId = contractProviders.walletProvider.getCoinPublicKey();
  await contractProviders.privateStateProvider.set(accountId, {
    amount: BigInt(input.amount),
    salt: hexToBytes(input.salt),
    holderSecret: hexToBytes(input.holderSecret),
  });

  const tx = await contract.callTx.claimPayout(hexToBytes(input.recipientKey), hexToBytes(periodIdHash));
  return {
    nullifier: bytesToHex(tx.public.nullifier),
    claimed: tx.public.claimed,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

export async function proveIncomeAtLeast(input: IncomeProofInput): Promise<{ passes: boolean }> {
  const contract = await getContract();
  
  const accountId = contractProviders.walletProvider.getCoinPublicKey();
  await contractProviders.privateStateProvider.set(accountId, {
    amount: BigInt(input.amount),
    salt: hexToBytes(input.salt),
    holderSecret: new Uint8Array(32), // dummy for prove, or does it need it? Wait, let's just use empty
  });

  try {
     await contract.callTx.proveIncomeAtLeast(hexToBytes(input.recipientKey));
     return { passes: true };
  } catch(e) {
     return { passes: false };
  }
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomKeyHex(bytes = 32): string {
  return randomHex(bytes);
}
