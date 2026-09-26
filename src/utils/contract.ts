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
export let contractPureCircuits: any = null;
const CONTRACT_ADDRESS = "ec858b2e7ba657d3c4e0282007b5e281eb118ad3a7f4fb2779ebdc549e4a3fb3";

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
  const { CompiledBBoardContractContract, witnesses, pureCircuits } = await import("@midnight-ntwrk/bboard-contract");
  // @ts-ignore
  const { CompiledContract } = await import("@midnight-ntwrk/midnight-js-protocol/compact-js");
  // @ts-ignore
  const contractWithWitnesses = CompiledContract.withWitnesses(witnesses)(CompiledBBoardContractContract);

  contractPureCircuits = pureCircuits;

  deployedContract = await (findDeployedContract as any)(providers, {
    contractAddress: CONTRACT_ADDRESS,
    compiledContract: contractWithWitnesses,
    privateStateId: CONTRACT_ADDRESS,
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
  
  const amountBigInt = BigInt(entry.amount);
  const saltBytes = hexToBytes(salt);
  const recipientKeyBytes = hexToBytes(entry.recipientKey);

  console.log("=== DEBUG COMMIT SPLIT ===");
  console.log("entry amount:", entry.amount, "-> BigInt:", amountBigInt);
  console.log("generated salt:", salt);
  console.log("entry recipientKey:", entry.recipientKey);

  const commitmentBytes = contractPureCircuits.computeCommitment(amountBigInt, saltBytes);
  const commitment = bytesToHex(commitmentBytes);
  
  console.log("commitment computed:", commitment);

  await contract.callTx.commitSplit(recipientKeyBytes, commitmentBytes);
  
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

  const amountBigInt = BigInt(input.amount);
  const saltBytes = hexToBytes(input.salt);
  const recipientKeyBytes = hexToBytes(input.recipientKey);

  console.log("=== DEBUG CLAIM PAYOUT ===");
  console.log("input amount:", input.amount, "-> BigInt:", amountBigInt);
  console.log("input salt:", input.salt);
  console.log("input recipientKey:", input.recipientKey);
  
  try {
    const computedLeaf = contractPureCircuits.computeCommitment(amountBigInt, saltBytes);
    console.log("re-computed leaf offline:", bytesToHex(computedLeaf));
  } catch (e) {
    console.error("Error computing leaf offline:", e);
  }

  await contractProviders.privateStateProvider.set(CONTRACT_ADDRESS, {
    amount: amountBigInt,
    salt: saltBytes,
    holderSecret: hexToBytes(input.holderSecret),
  });

  await contract.callTx.claimPayout(recipientKeyBytes, hexToBytes(periodIdHash));
  
  const nullifierBytes = contractPureCircuits.computeNullifier(
    hexToBytes(periodIdHash),
    recipientKeyBytes,
    hexToBytes(input.holderSecret)
  );

  return {
    nullifier: bytesToHex(nullifierBytes),
    claimed: true,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

export async function proveIncomeAtLeast(input: IncomeProofInput): Promise<{ passes: boolean }> {
  const contract = await getContract();
  
  await contractProviders.privateStateProvider.set(CONTRACT_ADDRESS, {
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
