/**
 * soroban.test.ts — Unit tests for the Soroban contract service layer
 *
 * Tests cover:
 *  1. stroopsToDisplay — converts bigint stroops to a readable decimal string
 *  2. displayToStroops — converts a decimal string back to bigint stroops
 *  3. Round-trip conversion consistency
 *  4. fetchContractEvents — returns empty array on RPC error (graceful fallback)
 *  5. loadAccountSequence — throws on non-OK Horizon response
 *  6. loadAccountSequence — returns sequence on success
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  stroopsToDisplay,
  displayToStroops,
  fetchContractEvents,
  loadAccountSequence,
} from './soroban';

// ---------------------------------------------------------------------------
// Mock @stellar/stellar-sdk to avoid real network calls
// ---------------------------------------------------------------------------
vi.mock('@stellar/stellar-sdk', async () => {
  const actual = await vi.importActual<typeof import('@stellar/stellar-sdk')>(
    '@stellar/stellar-sdk'
  );

  const MockServer = vi.fn(function(this: any) {
    this.simulateTransaction = vi.fn().mockRejectedValue(new Error('mock-sim-error'));
    this.getEvents = vi.fn().mockRejectedValue(new Error('mock-events-error'));
    this.sendTransaction = vi.fn().mockRejectedValue(new Error('mock-send-error'));
    this.getTransaction = vi.fn().mockRejectedValue(new Error('mock-get-error'));
    this.getLatestLedger = vi.fn().mockResolvedValue({ sequence: 1000 });
  });

  return {
    ...actual,
    rpc: {
      ...((actual as any).rpc ?? {}),
      Server: MockServer,
      Api: (actual as any).rpc?.Api ?? {},
      assembleTransaction: (actual as any).rpc?.assembleTransaction ?? vi.fn(),
    },
  };
});

// ---------------------------------------------------------------------------
// Mock fetch for Horizon account calls
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ===========================================================================
// 1. stroopsToDisplay
// ===========================================================================
describe('stroopsToDisplay', () => {
  it('converts 10_000_000 stroops to "1" (1 XLM)', () => {
    expect(stroopsToDisplay(BigInt(10_000_000))).toBe('1');
  });

  it('converts 15_000_000 stroops to "1.5" (1.5 XLM)', () => {
    expect(stroopsToDisplay(BigInt(15_000_000))).toBe('1.5');
  });

  it('converts 0 stroops to "0"', () => {
    expect(stroopsToDisplay(BigInt(0))).toBe('0');
  });

  it('converts 100_000_000_000 stroops to "10000" (10,000 XLM)', () => {
    expect(stroopsToDisplay(BigInt(100_000_000_000))).toBe('10000');
  });

  it('trims trailing zeros: 1_000_000 stroops → "0.1"', () => {
    expect(stroopsToDisplay(BigInt(1_000_000))).toBe('0.1');
  });
});

// ===========================================================================
// 2. displayToStroops
// ===========================================================================
describe('displayToStroops', () => {
  it('converts "1" to 10_000_000 stroops', () => {
    expect(displayToStroops('1')).toBe(BigInt(10_000_000));
  });

  it('converts "1.5" to 15_000_000 stroops', () => {
    expect(displayToStroops('1.5')).toBe(BigInt(15_000_000));
  });

  it('converts "0" to 0 stroops', () => {
    expect(displayToStroops('0')).toBe(BigInt(0));
  });

  it('converts "0.1" to 1_000_000 stroops', () => {
    expect(displayToStroops('0.1')).toBe(BigInt(1_000_000));
  });
});

// ===========================================================================
// 3. Round-trip consistency
// ===========================================================================
describe('stroops ↔ display round-trip', () => {
  it('stroopsToDisplay → displayToStroops is an identity for whole numbers', () => {
    const original = BigInt(10_000_000);
    const str = stroopsToDisplay(original);
    const back = displayToStroops(str);
    expect(back).toBe(original);
  });

  it('stroopsToDisplay → displayToStroops is an identity for fractional amounts', () => {
    const original = BigInt(15_500_000); // 1.55 XLM
    const str = stroopsToDisplay(original);
    const back = displayToStroops(str);
    expect(back).toBe(original);
  });
});

// ===========================================================================
// 4. fetchContractEvents — graceful fallback on RPC error
// ===========================================================================
describe('fetchContractEvents', () => {
  it('returns an empty array when RPC server throws (graceful degradation)', async () => {
    const result = await fetchContractEvents(
      'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3',
      1000,
      10
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});

// ===========================================================================
// 5. loadAccountSequence — throws on HTTP error
// ===========================================================================
describe('loadAccountSequence', () => {
  it('throws a descriptive error when Horizon returns 404', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'not found' }),
    });

    await expect(
      loadAccountSequence('GDKRGVN3VY7BCBXGXVFJODSMBC4LE7HHQQTYV3EYJLLQKUKPWLIJJRKU')
    ).rejects.toThrow(/Failed to load account/);
  });

  it('returns the sequence string when Horizon responds with 200 OK', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ sequence: '12345678', balances: [] }),
    });

    const seq = await loadAccountSequence(
      'GDKRGVN3VY7BCBXGXVFJODSMBC4LE7HHQQTYV3EYJLLQKUKPWLIJJRKU'
    );
    expect(seq).toBe('12345678');
  });
});
