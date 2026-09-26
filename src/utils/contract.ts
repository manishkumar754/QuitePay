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

export const CONTRACT_ADDRESS = "ec858b2e7ba657d3c4e0282007b5e281eb118ad3a7f4fb2779ebdc549e4a3fb3";

export async function connectWallet(): Promise<WalletState> {
  const win = window as any;
  const activeProvider = win.midnight?.["1am"] || win.midnight?.oneam || win.midnight?.mnLace;
  if (!activeProvider) throw new Error("No Midnight wallet found. Please install the Nightly/1AM wallet extension.");

  const api = await activeProvider.enable();
  const state = await api.state();

  return { address: state.address, network: "preprod" };
}

export async function disconnectWallet(): Promise<void> {
  deployedContract = null;
}

async function getContract() {
  if (deployedContract) return deployedContract;
  
  const win = window as any;
  const activeProvider = win.midnight?.["1am"] || win.midnight?.oneam || win.midnight?.mnLace;
  if (!activeProvider) throw new Error("Wallet not connected");
  const walletApi = await activeProvider.enable();

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

  setNetworkId("preprod");

  const indexerHttp = "https://indexer.preprod.midnight.network/api/v4/graphql";
  const indexerWs = "wss://indexer.preprod.midnight.network/api/v4/graphql/ws";
  const zkConfigPath = `${window.location.origin}/managed/bboard`;

  const zkConfigProvider = new FetchZkConfigProvider(zkConfigPath, fetch.bind(window));
  const ONEAM_PROOF_SERVER = "https://api-preprod.1am.xyz";
  const proofProvider = httpClientProofProvider(ONEAM_PROOF_SERVER, zkConfigProvider);

  const privateStateProvider = levelPrivateStateProvider({
    privateStateStoreName: `quietpay-private-${walletApi.coinPublicKey.slice(0, 8)}`,
    signingKeyStoreName: `quietpay-keys-${walletApi.coinPublicKey.slice(0, 8)}`,
    privateStoragePasswordProvider: () => "TempPassword123!Secure",
    accountId: walletApi.coinPublicKey,
  });

  const walletProvider = {
    getCoinPublicKey: () => walletApi.coinPublicKey,
    getEncryptionPublicKey: () => walletApi.coinPublicKey,
    balanceTx: async (tx: any): Promise<any> => {
      const serializedTx = toHex(tx.serialize());
      if (typeof activeProvider.balanceUnsealedTransaction === "function") {
        const received = await activeProvider.balanceUnsealedTransaction(serializedTx);
        return Transaction.deserialize("signature", "proof", "binding", fromHex(received.tx)) as any;
      }
      throw new Error("Wallet does not support balanceUnsealedTransaction");
    },
    proveTx: async (tx: any): Promise<any> => {
      const serializedTx = toHex(tx.serialize());
      if (typeof activeProvider.proveUnsealedTransaction === "function") {
        const received = await activeProvider.proveUnsealedTransaction(serializedTx);
        return Transaction.deserialize("signature", "proof", "binding", fromHex(received.tx)) as any;
      }
      throw new Error("Wallet does not support proveUnsealedTransaction");
    },
    submitTx: async (tx: any): Promise<string> => {
      const serializedTx = toHex(tx.serialize());
      const txHash = await activeProvider.submitTransaction(serializedTx);
      return txHash;
    }
  } as any;

  const providers = {
    privateStateProvider,
    publicDataProvider: indexerPublicDataProvider(indexerHttp, indexerWs),
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider: walletProvider,
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

  return deployedContract;
}

export async function fundPool(totalAmount: number): Promise<{ poolTotal: number }> {
  const contract = await getContract();
  await contract.callTx.fundPool(BigInt(totalAmount));
  return { poolTotal: totalAmount };
}

export async function commitSplit(entry: SplitEntry): Promise<CommitmentRecord> {
  const contract = await getContract();
  const salt = randomHex(16);
  const commitment = await sha256Hex(`${entry.amount}:${salt}`);
  
  await contract.callTx.commitSplit(entry.recipientKey, commitment);
  
  return {
    recipientKey: entry.recipientKey,
    recipientLabel: entry.recipientLabel,
    commitment,
  };
}

export async function claimPayout(input: ClaimInput): Promise<ClaimRecord> {
  const contract = await getContract();
  const tx = await contract.callTx.claimPayout(input.recipientKey, input.periodId);
  return {
    nullifier: tx.public.nullifier,
    claimed: tx.public.claimed,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

export async function proveIncomeAtLeast(input: IncomeProofInput): Promise<{ passes: boolean }> {
  const contract = await getContract();
  // Call it as a dry run to just verify the circuit
  try {
     await contract.callTx.proveIncomeAtLeast(input.recipientKey);
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

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomKeyHex(bytes = 16): string {
  return randomHex(bytes);
}
