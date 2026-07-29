/**
 * useSorobanEvents.ts — Real-time Soroban Contract Event Listener Hook
 *
 * Polls the Soroban RPC endpoint for on-chain contract events every N seconds
 * and exposes them for UI consumption. Triggers addToast notifications on
 * new events detected since the last poll.
 *
 * Usage:
 *   const { events, isListening, latestLedger, startListening, stopListening } =
 *     useSorobanEvents({ contractId, enabled: walletConnected });
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchContractEvents, getSorobanServer } from '../services/soroban';
import type { ContractEvent } from '../services/soroban';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseSorobanEventsOptions {
  /** The Soroban contract ID to listen on */
  contractId: string;
  /** Whether polling should be active (e.g. walletConnected) */
  enabled?: boolean;
  /** Poll interval in milliseconds. Default: 10_000 (10s) */
  pollIntervalMs?: number;
  /** Max events to keep in state */
  maxEvents?: number;
  /** Optional callback fired when new events arrive */
  onNewEvents?: (events: ContractEvent[]) => void;
}

export interface UseSorobanEventsReturn {
  events: ContractEvent[];
  isListening: boolean;
  latestLedger: number;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  clearEvents: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSorobanEvents({
  contractId,
  enabled = false,
  pollIntervalMs = 10_000,
  maxEvents = 50,
  onNewEvents,
}: UseSorobanEventsOptions): UseSorobanEventsReturn {
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [latestLedger, setLatestLedger] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Use refs to avoid stale closures in the interval
  const latestLedgerRef = useRef(latestLedger);
  const enabledRef = useRef(enabled);
  const onNewEventsRef = useRef(onNewEvents);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep refs in sync
  useEffect(() => { latestLedgerRef.current = latestLedger; }, [latestLedger]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { onNewEventsRef.current = onNewEvents; }, [onNewEvents]);

  // ---------------------------------------------------------------------------
  // Bootstrap: resolve the current ledger sequence from Soroban RPC
  // ---------------------------------------------------------------------------
  const resolveStartLedger = useCallback(async (): Promise<number> => {
    try {
      const server = getSorobanServer();
      const health = await server.getLatestLedger();
      // Start from slightly behind to pick up very recent events
      const startLedger = Math.max(1, (health.sequence ?? 0) - 5);
      setLatestLedger(startLedger);
      latestLedgerRef.current = startLedger;
      return startLedger;
    } catch (err: any) {
      setError(`Could not resolve latest ledger: ${err?.message ?? 'unknown'}`);
      return 1;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Poll for new events
  // ---------------------------------------------------------------------------
  const poll = useCallback(async () => {
    if (!contractId || !enabledRef.current) return;

    try {
      const newEvents = await fetchContractEvents(
        contractId,
        latestLedgerRef.current,
        20
      );

      if (newEvents.length > 0) {
        // Update latest ledger watermark to avoid duplicate fetches
        const maxLedger = newEvents.reduce(
          (max, ev) => Math.max(max, ev.ledger),
          latestLedgerRef.current
        );
        setLatestLedger(maxLedger + 1);

        // Prepend new events, cap at maxEvents
        setEvents(prev => [...newEvents, ...prev].slice(0, maxEvents));

        // Notify parent via callback
        if (onNewEventsRef.current) {
          onNewEventsRef.current(newEvents);
        }
      }

      setError(null);
    } catch (err: any) {
      setError(`Event polling error: ${err?.message ?? 'unknown'}`);
    }
  }, [contractId, maxEvents]);

  // ---------------------------------------------------------------------------
  // Start / stop listening controls
  // ---------------------------------------------------------------------------
  const startListening = useCallback(async () => {
    if (intervalRef.current) return; // already running

    // Resolve ledger once before first poll
    if (latestLedgerRef.current === 0) {
      await resolveStartLedger();
    }

    setIsListening(true);
    await poll(); // immediate first fetch

    intervalRef.current = setInterval(poll, pollIntervalMs);
  }, [poll, pollIntervalMs, resolveStartLedger]);

  const stopListening = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsListening(false);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // ---------------------------------------------------------------------------
  // Auto-start / auto-stop based on `enabled` prop
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (enabled && contractId) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, contractId]);

  return {
    events,
    isListening,
    latestLedger,
    error,
    startListening,
    stopListening,
    clearEvents,
  };
}

export default useSorobanEvents;
