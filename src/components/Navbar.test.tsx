import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Navbar } from './Navbar';
import { useStellar } from '../context/StellarContext';

// Mock the useStellar hook
vi.mock('../context/StellarContext', () => ({
  useStellar: vi.fn(),
}));

describe('Navbar Component', () => {
  const mockSetActiveTab = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Connect Wallet button when disconnected', () => {
    (useStellar as any).mockReturnValue({
      walletConnected: false,
      publicKey: null,
      balanceXLM: 0,
      balanceUSDC: 0,
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      claimFaucet: vi.fn(),
      fetchBalance: vi.fn(),
      isLoading: false,
    });

    render(<Navbar activeTab="dashboard" setActiveTab={mockSetActiveTab} />);

    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    expect(screen.queryByText('Faucet')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('renders balances, truncated address, navigation links, and faucet when connected', () => {
    (useStellar as any).mockReturnValue({
      walletConnected: true,
      publicKey: 'GD6ZH3G5WBLPFLV74PDK7JOH3B2W5JHLV637Q6NNSL2SPN5G737V4WEX',
      balanceXLM: 1250.5,
      balanceUSDC: 5000.25,
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      claimFaucet: vi.fn(),
      fetchBalance: vi.fn(),
      isLoading: false,
    });

    render(<Navbar activeTab="dashboard" setActiveTab={mockSetActiveTab} />);

    // Verify desktop balance elements are rendered
    expect(screen.getByText('1,250.5 XLM')).toBeInTheDocument();
    expect(screen.getByText('5,000.3 USDC')).toBeInTheDocument();

    // Verify faucet action button exists
    expect(screen.getByText('Faucet')).toBeInTheDocument();

    // Verify truncated public key display
    expect(screen.getByText('GD6ZH3...4WEX')).toBeInTheDocument();

    // Verify navigation tabs are visible
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Stellar Mastery')).toBeInTheDocument();
  });

  it('triggers setActiveTab callback when navigation links are clicked', () => {
    (useStellar as any).mockReturnValue({
      walletConnected: true,
      publicKey: 'GD6ZH3G5WBLPFLV74PDK7JOH3B2W5JHLV637Q6NNSL2SPN5G737V4WEX',
      balanceXLM: 1250.5,
      balanceUSDC: 5000.25,
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      claimFaucet: vi.fn(),
      fetchBalance: vi.fn(),
      isLoading: false,
    });

    render(<Navbar activeTab="dashboard" setActiveTab={mockSetActiveTab} />);

    const masteryTab = screen.getByText('Stellar Mastery');
    fireEvent.click(masteryTab);

    expect(mockSetActiveTab).toHaveBeenCalledWith('whitebelt');
  });

  it('opens and closes mobile hamburger menu drawer when toggled', () => {
    (useStellar as any).mockReturnValue({
      walletConnected: true,
      publicKey: 'GD6ZH3G5WBLPFLV74PDK7JOH3B2W5JHLV637Q6NNSL2SPN5G737V4WEX',
      balanceXLM: 1250.5,
      balanceUSDC: 5000.25,
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      claimFaucet: vi.fn(),
      fetchBalance: vi.fn(),
      isLoading: false,
    });

    render(<Navbar activeTab="dashboard" setActiveTab={mockSetActiveTab} />);

    // Mobile menu starts closed
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();

    // Find hamburger toggle button (it wraps the Menu/X icon)
    const toggleButton = screen.getAllByRole('button')[0]; // The first button when connected is the menu toggle icon
    
    // Open menu
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();

    // Close menu
    fireEvent.click(toggleButton);
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });
});
