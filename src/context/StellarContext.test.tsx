import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StellarProvider, useStellar } from './StellarContext';
import { isConnected, getAddress, isAllowed, setAllowed, getPublicKey } from '@stellar/freighter-api';

// Bulletproof localStorage mock
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Freighter API
vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn(),
  getAddress: vi.fn(),
  isAllowed: vi.fn(),
  setAllowed: vi.fn(),
  getPublicKey: vi.fn(),
}));

// Mock fetch for Friendbot and Horizon calls
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

const TestConsumer = () => {
  const { 
    walletConnected, 
    publicKey, 
    balanceXLM, 
    balanceUSDC,
    connectWallet, 
    disconnectWallet, 
    claimFaucet 
  } = useStellar();

  return (
    <div>
      <div data-testid="connected">{walletConnected ? 'Yes' : 'No'}</div>
      <div data-testid="publicKey">{publicKey || 'None'}</div>
      <div data-testid="balanceXLM">{balanceXLM}</div>
      <div data-testid="balanceUSDC">{balanceUSDC}</div>
      <button data-testid="connect-btn" onClick={connectWallet}>Connect</button>
      <button data-testid="disconnect-btn" onClick={disconnectWallet}>Disconnect</button>
      <button data-testid="faucet-btn" onClick={claimFaucet}>Faucet</button>
    </div>
  );
};

describe('StellarContext Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockFetch.mockReset();
    
    // Define mock window.stellar to make waitForFreighter resolve immediately
    (window as any).stellar = {};

    // Setup Freighter mock defaults
    (isConnected as any).mockResolvedValue({ isConnected: true });
    (isAllowed as any).mockResolvedValue({ isAllowed: true });
    (setAllowed as any).mockResolvedValue({ isAllowed: true });
    (getPublicKey as any).mockResolvedValue('GDKRGVN3VY7BCBXGXVFJODSMBC4LE7HHQQTYV3EYJLLQKUKPWLIJJRKU');
    (getAddress as any).mockResolvedValue({ address: 'GDKRGVN3VY7BCBXGXVFJODSMBC4LE7HHQQTYV3EYJLLQKUKPWLIJJRKU' });
  });

  it('renders with correct default configuration states (zero balances, disconnected)', () => {
    render(
      <StellarProvider>
        <TestConsumer />
      </StellarProvider>
    );

    expect(screen.getByTestId('connected')).toHaveTextContent('No');
    expect(screen.getByTestId('publicKey')).toHaveTextContent('None');
    expect(screen.getByTestId('balanceXLM')).toHaveTextContent('0');
    expect(screen.getByTestId('balanceUSDC')).toHaveTextContent('0');
  });

  it('connects successfully to Freighter and sets publicKey', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        balances: [{ asset_type: 'native', balance: '10000.0000000' }]
      })
    });

    render(
      <StellarProvider>
        <TestConsumer />
      </StellarProvider>
    );

    const connectButton = screen.getByTestId('connect-btn');
    
    await act(async () => {
      fireEvent.click(connectButton);
    });

    expect(isConnected).toHaveBeenCalled();
    expect(screen.getByTestId('connected')).toHaveTextContent('Yes');
    expect(screen.getByTestId('publicKey')).toHaveTextContent('GDKRGVN3VY7BCBXGXVFJODSMBC4LE7HHQQTYV3EYJLLQKUKPWLIJJRKU');
  });

  it('handles faucet request as an async network call', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        balances: [{ asset_type: 'native', balance: '10000.0000000' }]
      })
    });

    render(
      <StellarProvider>
        <TestConsumer />
      </StellarProvider>
    );

    // First connect
    await act(async () => {
      fireEvent.click(screen.getByTestId('connect-btn'));
    });

    // Mock Friendbot success response, then balance refresh
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hash: 'abc123' }) }) // Friendbot
      .mockResolvedValueOnce({ ok: true, json: async () => ({ balances: [{ asset_type: 'native', balance: '20000.0000000' }] }) }); // Balance refresh

    // Click faucet
    await act(async () => {
      fireEvent.click(screen.getByTestId('faucet-btn'));
    });

    expect(screen.getByTestId('connected')).toHaveTextContent('Yes');
  });

  it('disconnects and resets active session variables', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        balances: [{ asset_type: 'native', balance: '10000.0000000' }]
      })
    });

    render(
      <StellarProvider>
        <TestConsumer />
      </StellarProvider>
    );

    const connectButton = screen.getByTestId('connect-btn');
    const disconnectButton = screen.getByTestId('disconnect-btn');

    await act(async () => {
      fireEvent.click(connectButton);
    });

    expect(screen.getByTestId('connected')).toHaveTextContent('Yes');

    act(() => {
      fireEvent.click(disconnectButton);
    });

    expect(screen.getByTestId('connected')).toHaveTextContent('No');
    expect(screen.getByTestId('publicKey')).toHaveTextContent('None');
  });
});
