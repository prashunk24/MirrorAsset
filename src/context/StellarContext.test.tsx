import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StellarProvider, useStellar } from './StellarContext';
import { isConnected, getAddress } from '@stellar/freighter-api';

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
}));

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
  });

  it('renders with correct default configuration states', () => {
    render(
      <StellarProvider>
        <TestConsumer />
      </StellarProvider>
    );

    expect(screen.getByTestId('connected')).toHaveTextContent('No');
    expect(screen.getByTestId('publicKey')).toHaveTextContent('None');
    expect(screen.getByTestId('balanceXLM')).toHaveTextContent('1000');
    expect(screen.getByTestId('balanceUSDC')).toHaveTextContent('5000');
  });

  it('connects successfully to Freighter and sets publicKey', async () => {
    (isConnected as any).mockResolvedValue({ isConnected: true });
    (getAddress as any).mockResolvedValue({ address: 'GDKRGVN3VY7BCBXGXVFJODSMBC4LE7HHQQTYV3EYJLLQKUKPWLIJJRKU' });

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
    expect(getAddress).toHaveBeenCalled();
    expect(screen.getByTestId('connected')).toHaveTextContent('Yes');
    expect(screen.getByTestId('publicKey')).toHaveTextContent('GDKRGVN3VY7BCBXGXVFJODSMBC4LE7HHQQTYV3EYJLLQKUKPWLIJJRKU');
  });

  it('claims faucet testnet tokens correctly and increments balance values', () => {
    render(
      <StellarProvider>
        <TestConsumer />
      </StellarProvider>
    );

    const faucetButton = screen.getByTestId('faucet-btn');
    
    act(() => {
      fireEvent.click(faucetButton);
    });

    // Initial balances are 1000 XLM and 5000 USDC. Faucet adds 500 XLM and 1000 USDC.
    expect(screen.getByTestId('balanceXLM')).toHaveTextContent('1500');
    expect(screen.getByTestId('balanceUSDC')).toHaveTextContent('6000');
  });

  it('disconnects and resets active session variables', async () => {
    (isConnected as any).mockResolvedValue({ isConnected: true });
    (getAddress as any).mockResolvedValue({ address: 'GDKRGVN3VY7BCBXGXVFJODSMBC4LE7HHQQTYV3EYJLLQKUKPWLIJJRKU' });

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
