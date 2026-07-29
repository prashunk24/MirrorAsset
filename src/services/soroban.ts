/**
 * soroban.ts — MirrorAsset Soroban Contract Invocation Service
 *
 * Provides helpers for interacting with the MirrorVault Soroban smart contract
 * on the Stellar Testnet via stellar-sdk's rpc.Server.
 *
 * Supported contract calls:
 *   - depositCollateral(publicKey, contractId, amount)
 *   - mintSynthetic(publicKey, contractId, amount)
 *   - getVault(publicKey, contractId)
 *   - fetchContractEvents(contractId, startLedger, limit)
 *
 * All calls target the Soroban Testnet RPC endpoint.
 */

import {
  rpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Contract,
  nativeToScVal,
  Address,
  xdr,
  scValToNative,
  Account,
} from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
export const HORIZON_TESTNET_URL = 'https://horizon-testnet.stellar.org';
export const NETWORK_PASSPHRASE = Networks.TESTNET;

// Default contract ID — override via env or props
export const DEFAULT_CONTRACT_ID =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CONTRACT_ID) ||
  'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VaultData {
  collateral_amount: bigint;
  minted_amount: bigint;
}

export interface SorobanCallResult {
  success: boolean;
  txHash?: string;
  result?: any;
  error?: string;
  simulated?: boolean;
}

export interface ContractEvent {
  id: string;
  type: string;
  contractId: string;
  topic: string[];
  value: any;
  ledger: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// RPC server singleton factory
// ---------------------------------------------------------------------------

export function getSorobanServer(): rpc.Server {
  return new rpc.Server(SOROBAN_RPC_URL, { allowHttp: false });
}

// ---------------------------------------------------------------------------
// Helper: load account sequence from Horizon REST
// ---------------------------------------------------------------------------

export async function loadAccountSequence(publicKey: string): Promise<string> {
  const resp = await fetch(`${HORIZON_TESTNET_URL}/accounts/${publicKey}`);
  if (!resp.ok) {
    throw new Error(`Failed to load account (${resp.status}): ${publicKey}`);
  }
  const data = await resp.json();
  return data.sequence as string;
}

// ---------------------------------------------------------------------------
// Helper: build + simulate + sign + submit a Soroban transaction
// ---------------------------------------------------------------------------

export async function invokeContractFunction(
  publicKey: string,
  contractId: string,
  functionName: string,
  args: xdr.ScVal[]
): Promise<SorobanCallResult> {
  const server = getSorobanServer();

  try {
    // 1. Load account sequence
    const sequence = await loadAccountSequence(publicKey);
    const sourceAccount = new Account(publicKey, sequence);

    // 2. Build contract invocation
    const contract = new Contract(contractId);
    const operation = contract.call(functionName, ...args);

    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(300)
      .build();

    // 3. Simulate for preflight
    const simResult = await server.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(simResult)) {
      return {
        success: false,
        error: `Simulation failed: ${(simResult as any).error}`,
        simulated: true,
      };
    }

    if (!rpc.Api.isSimulationSuccess(simResult)) {
      return {
        success: false,
        error: 'Transaction simulation returned an unexpected result.',
        simulated: true,
      };
    }

    // 4. Assemble prepared transaction
    const preparedTx = rpc.assembleTransaction(tx, simResult).build();
    const unsignedXdr = preparedTx.toXDR();

    // 5. Sign via Freighter
    const signResponse = await signTransaction(unsignedXdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    if (!signResponse?.signedTxXdr) {
      return { success: false, error: 'Transaction signing rejected by user.' };
    }

    // 6. Submit signed transaction
    const signedTx = TransactionBuilder.fromXDR(
      signResponse.signedTxXdr,
      NETWORK_PASSPHRASE
    );
    const submitResult = await server.sendTransaction(signedTx as any);

    if (submitResult.status === 'ERROR') {
      return {
        success: false,
        error: `Submission error: ${JSON.stringify(submitResult.errorResult)}`,
      };
    }

    // 7. Poll for confirmation
    const txHash = submitResult.hash;
    let getResult = await server.getTransaction(txHash);
    let attempts = 0;
    const maxAttempts = 20;

    while (
      getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND &&
      attempts < maxAttempts
    ) {
      await new Promise(r => setTimeout(r, 1500));
      getResult = await server.getTransaction(txHash);
      attempts++;
    }

    if (getResult.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return { success: true, txHash };
    }

    return {
      success: false,
      txHash,
      error: `Transaction ended with status: ${getResult.status}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message ?? 'Unknown Soroban invocation error.',
    };
  }
}

// ---------------------------------------------------------------------------
// Contract call: deposit_collateral
// ---------------------------------------------------------------------------

export async function depositCollateral(
  publicKey: string,
  contractId: string,
  amountStroops: bigint
): Promise<SorobanCallResult> {
  const args: xdr.ScVal[] = [
    new Address(publicKey).toScVal(),
    nativeToScVal(amountStroops, { type: 'i128' }),
  ];
  return invokeContractFunction(publicKey, contractId, 'deposit_collateral', args);
}

// ---------------------------------------------------------------------------
// Contract call: mint_synthetic
// ---------------------------------------------------------------------------

export async function mintSynthetic(
  publicKey: string,
  contractId: string,
  amountStroops: bigint
): Promise<SorobanCallResult> {
  const args: xdr.ScVal[] = [
    new Address(publicKey).toScVal(),
    nativeToScVal(amountStroops, { type: 'i128' }),
  ];
  return invokeContractFunction(publicKey, contractId, 'mint_synths', args);
}

// ---------------------------------------------------------------------------
// Contract read: get_vault (read-only simulation)
// ---------------------------------------------------------------------------

export async function getVault(
  publicKey: string,
  contractId: string
): Promise<VaultData | null> {
  const server = getSorobanServer();

  try {
    const sequence = await loadAccountSequence(publicKey);
    const sourceAccount = new Account(publicKey, sequence);

    const contract = new Contract(contractId);
    const operation = contract.call('get_vault', new Address(publicKey).toScVal());

    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const simResult = await server.simulateTransaction(tx);

    if (!rpc.Api.isSimulationSuccess(simResult)) return null;

    const rawResult = (simResult as any).result?.retval;
    if (!rawResult) return null;

    const native = scValToNative(rawResult);
    return {
      collateral_amount: BigInt(native.collateral_amount ?? 0),
      minted_amount: BigInt(native.minted_amount ?? 0),
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Event polling: fetch recent contract events from Soroban RPC
// ---------------------------------------------------------------------------

export async function fetchContractEvents(
  contractId: string,
  startLedger: number,
  limit = 20
): Promise<ContractEvent[]> {
  const server = getSorobanServer();

  try {
    const response = await server.getEvents({
      startLedger,
      filters: [
        {
          type: 'contract' as const,
          contractIds: [contractId],
        },
      ],
      limit,
    });

    return (response.events ?? []).map((ev: any) => ({
      id: ev.id,
      type: ev.type,
      contractId: ev.contractId,
      topic: (ev.topic ?? []).map((t: xdr.ScVal) => {
        try {
          return String(scValToNative(t));
        } catch {
          return t.toXDR('base64');
        }
      }),
      value: (() => {
        try {
          return scValToNative(ev.value);
        } catch {
          return null;
        }
      })(),
      ledger: ev.ledger ?? startLedger,
      timestamp: Date.now(),
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Utility: stroops (7 decimal places) → human-readable string
// ---------------------------------------------------------------------------

export function stroopsToDisplay(stroops: bigint, decimals = 7): string {
  const divisor = BigInt(10 ** decimals);
  const whole = stroops / divisor;
  const frac = stroops % divisor;
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
  return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}

// ---------------------------------------------------------------------------
// Utility: human-readable string → stroops bigint
// ---------------------------------------------------------------------------

export function displayToStroops(amount: string, decimals = 7): bigint {
  const [whole, frac = ''] = amount.split('.');
  const fracPadded = frac.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole) * BigInt(10 ** decimals) + BigInt(fracPadded || '0');
}
