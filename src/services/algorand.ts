/**
 * Algorand Service - ASA Opt-in & Badge Issuance
 * 
 * Handles:
 * - Opt-in status checking via indexer API
 * - ASA opt-in transaction building and submission
 * - Badge NFT issuance with automatic opt-in handling
 * - Minimum balance validation
 * - Fee estimation for grouped transactions
 */

import algosdk from 'algosdk';

// Environment configuration
const ALGOD_TOKEN = process.env.NEXT_PUBLIC_ALGOD_TOKEN || '';
const ALGOD_SERVER = process.env.NEXT_PUBLIC_ALGOD_SERVER || 'https://testnet-api.algorand.stackprint.io';
const ALGOD_PORT = process.env.NEXT_PUBLIC_ALGOD_PORT || '';
const INDEXER_SERVER = process.env.NEXT_PUBLIC_INDEXER_SERVER || 'https://testnet-idx.algorand.stackprint.io';

// Minimum Algo balance required for ASA opt-in (0.1 Algo = 100,000 microAlgos)
export const MIN_BALANCE_FOR_OPTIN_MICROALGOS = 100_000;

// Standard transaction fee in microAlgos
export const TXN_FEE_MICROALGOS = 1_000;

// Create Algod and Indexer clients
const getAlgodClient = (): algosdk.Algodv2 => {
  return new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
};

const getIndexerClient = (): algosdk.Indexer => {
  return new algosdk.Indexer(ALGOD_TOKEN, INDEXER_SERVER, '');
};

/**
 * Check if an account has opted into an ASA (Asset)
 */
export async function hasOptedIntoAsset(
  accountAddress: string,
  assetId: number
): Promise<boolean> {
  try {
    const indexer = getIndexerClient();
    const accountInfo = await indexer
      .lookupAccountAssets(accountAddress)
      .assetId(assetId)
      .do();
    
    // If the account has the asset, they have opted in
    return accountInfo.assets.length > 0;
  } catch (error) {
    console.error(`[Algorand] Error checking opt-in status for ${accountAddress} asset ${assetId}:`, error);
    return false;
  }
}

/**
 * Get account's Algo balance in microAlgos
 */
export async function getAlgoBalance(accountAddress: string): Promise<bigint> {
  try {
    const indexer = getIndexerClient();
    const accountInfo = await indexer.lookupAccountByID(accountAddress).do();
    return accountInfo.account.amount as bigint;
  } catch (error) {
    console.error(`[Algorand] Error fetching Algo balance for ${accountAddress}:`, error);
    return BigInt(0);
  }
}

/**
 * Check if account has sufficient balance for ASA opt-in
 */
export async function hasSufficientBalanceForOptin(accountAddress: string): Promise<boolean> {
  const balance = await getAlgoBalance(accountAddress);
  return balance >= BigInt(MIN_BALANCE_FOR_OPTIN_MICROALGOS);
}

/**
 * Build an ASA opt-in transaction
 * This is a special transaction that sends 0 of the asset to self
 */
export async function buildOptInTransaction(
  senderAddress: string,
  assetId: number
): Promise<algosdk.Transaction> {
  const algod = getAlgodClient();
  const params = await algod.getTransactionParams().do();
  
  // Opt-in transaction: send 0 assets to self
  const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: senderAddress,
    receiver: senderAddress,
    amount: 0,
    assetIndex: assetId,
    suggestedParams: {
      ...params,
      fee: TXN_FEE_MICROALGOS,
      flatFee: true,
    },
  });

  return optInTxn;
}

/**
 * Build an ASA transfer transaction (mint/transfer badge to receiver)
 */
export async function buildTransferTransaction(
  senderAddress: string,
  receiverAddress: string,
  assetId: number,
  amount: number = 1
): Promise<algosdk.Transaction> {
  const algod = getAlgodClient();
  const params = await algod.getTransactionParams().do();

  const transferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: senderAddress,
    receiver: receiverAddress,
    amount: amount,
    assetIndex: assetId,
    suggestedParams: {
      ...params,
      fee: TXN_FEE_MICROALGOS,
      flatFee: true,
    },
  });

  return transferTxn;
}

/**
 * Estimate total fees for a group of transactions
 */
export function estimateGroupFees(transactionCount: number): number {
  return transactionCount * TXN_FEE_MICROALGOS;
}

/**
 * Result of ASA opt-in check
 */
export interface OptInCheckResult {
  needsOptIn: boolean;
  hasSufficientBalance: boolean;
  currentBalance: bigint;
  currentBalanceAlgo: number;
}

/**
 * Check if a receiver needs ASA opt-in and has sufficient balance
 */
export async function checkOptInRequirements(
  receiverAddress: string,
  assetId: number
): Promise<OptInCheckResult> {
  const [hasOptedIn, balance, hasSufficient] = await Promise.all([
    hasOptedIntoAsset(receiverAddress, assetId),
    getAlgoBalance(receiverAddress),
    hasSufficientBalanceForOptin(receiverAddress),
  ]);

  return {
    needsOptIn: !hasOptedIn,
    hasSufficientBalance: hasSufficient,
    currentBalance: balance,
    currentBalanceAlgo: Number(balance) / 1_000_000,
  };
}

/**
 * Submit raw signed transaction bytes and wait for confirmation
 */
export async function submitRawTransaction(
  signedTxnBlob: Uint8Array
): Promise<string> {
  const algod = getAlgodClient();
  const { txid } = await algod.sendRawTransaction(signedTxnBlob).do();
  
  // Wait for confirmation
  const result = await algosdk.waitForConfirmation(algod, txid, 10);
  
  console.log(`[Algorand] Transaction confirmed: ${txid}, round: ${result.confirmedRound}`);
  
  return txid;
}

/**
 * Submit a transaction group and wait for confirmation
 * Returns array of txIds for each transaction in the group
 */
export async function submitTransactionGroup(
  signedTxnBlobs: Uint8Array[]
): Promise<string[]> {
  const algod = getAlgodClient();
  
  // Send all transactions in the group as a single batch
  const { txid } = await algod.sendRawTransaction(signedTxnBlobs).do();

  // Wait for confirmation (group is atomic)
  const result = await algosdk.waitForConfirmation(algod, txid, 10);
  
  console.log(`[Algorand] Group transaction confirmed: ${txid}, round: ${result.confirmedRound}`);

  // Decode each blob to get the txId for each transaction
  const txIds: string[] = [];
  for (const blob of signedTxnBlobs) {
    const decoded = algosdk.decodeSignedTransaction(blob);
    txIds.push(decoded.txn.txID());
  }

  return txIds;
}

/**
 * Wallet signer function type compatible with algosdk v3
 * Returns array of signed transaction bytes
 */
export type WalletSigner = (txns: algosdk.Transaction[], indexesToSign?: number[]) => Promise<Uint8Array[]>;

/**
 * Issue a badge to a receiver, handling ASA opt-in automatically if needed
 */
export interface BadgeIssuanceResult {
  success: boolean;
  transactionIds: string[];
  optedIn: boolean;
  error?: string;
}

export async function issueBadgeWithOptIn(
  issuerAddress: string,
  receiverAddress: string,
  assetId: number,
  walletSigner: WalletSigner
): Promise<BadgeIssuanceResult> {
  console.log(`[Algorand] Issuing badge ${assetId} to ${receiverAddress}`);

  // Step 1: Check opt-in requirements
  const optInCheck = await checkOptInRequirements(receiverAddress, assetId);
  
  console.log(`[Algorand] Opt-in check for ${receiverAddress}:`, {
    needsOptIn: optInCheck.needsOptIn,
    balanceSufficient: optInCheck.hasSufficientBalance,
    balance: `${optInCheck.currentBalanceAlgo} Algo`,
  });

  // Step 2: Validate balance if opt-in is needed
  if (optInCheck.needsOptIn && !optInCheck.hasSufficientBalance) {
    const needed = MIN_BALANCE_FOR_OPTIN_MICROALGOS / 1_000_000;
    return {
      success: false,
      transactionIds: [],
      optedIn: false,
      error: `Insufficient Algo balance for ASA opt-in. ${receiverAddress} needs at least ${needed} Algo to receive this badge. Current balance: ${optInCheck.currentBalanceAlgo} Algo. Please fund the wallet and try again.`,
    };
  }

  // Step 3: Build transaction group
  const transactions: algosdk.Transaction[] = [];
  const indexesToSign: number[] = [];
  
  // Add opt-in transaction if needed (MUST come first in group)
  if (optInCheck.needsOptIn) {
    const optInTxn = await buildOptInTransaction(receiverAddress, assetId);
    transactions.push(optInTxn);
    indexesToSign.push(transactions.length - 1); // Sign this transaction
    console.log(`[Algorand] Building opt-in transaction for asset ${assetId}`);
  }

  // Add transfer transaction (mint/transfer badge to receiver)
  const transferTxn = await buildTransferTransaction(
    issuerAddress,
    receiverAddress,
    assetId,
    1 // Badges are non-fungible, amount = 1
  );
  transactions.push(transferTxn);
  indexesToSign.push(transactions.length - 1); // Sign this transaction too
  console.log(`[Algorand] Building transfer transaction for asset ${assetId}`);

  // Step 4: Assign group ID
  const groupedTransactions = algosdk.assignGroupID(transactions);

  // Step 5: Sign transactions using wallet signer
  let signedBlobs: Uint8Array[] = [];
  try {
    signedBlobs = await walletSigner(groupedTransactions, indexesToSign);
  } catch (signError) {
    console.error('[Algorand] Error signing transactions:', signError);
    return {
      success: false,
      transactionIds: [],
      optedIn: false,
      error: `Failed to sign transactions: ${signError instanceof Error ? signError.message : 'Unknown error'}`,
    };
  }

  // Step 6: Submit transaction group
  try {
    const txIds = await submitTransactionGroup(signedBlobs);
    
    console.log(`[Algorand] Badge issuance complete. Transaction IDs:`, txIds);

    return {
      success: true,
      transactionIds: txIds,
      optedIn: optInCheck.needsOptIn,
    };
  } catch (submitError) {
    console.error('[Algorand] Error submitting transactions:', submitError);
    return {
      success: false,
      transactionIds: [],
      optedIn: optInCheck.needsOptIn,
      error: `Failed to submit transactions: ${submitError instanceof Error ? submitError.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get asset information by ID
 */
export async function getAssetInfo(assetId: number): Promise<unknown> {
  try {
    const indexer = getIndexerClient();
    const response = await indexer.lookupAssetByID(assetId).do();
    return response.asset;
  } catch (error) {
    console.error(`[Algorand] Error fetching asset info for ${assetId}:`, error);
    return null;
  }
}
