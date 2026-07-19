import React, { useState } from 'react';
import { useStellar } from '../context/StellarContext';
import { Wallet, LogOut, Coins, Menu, X } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const {
    walletConnected,
    publicKey,
    balanceXLM,
    balanceUSDC,
    connectWallet,
    disconnectWallet,
    claimFaucet,
    isLoading
  } = useStellar();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const truncateAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const navItems = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'whitebelt', name: 'Stellar Mastery' },
    { id: 'redemption', name: 'Redemptions' },
    { id: 'liquidation', name: 'Liquidations' },
    { id: 'transactions', name: 'History' },
  ];

  return (
    <nav className="bg-bg-dark/90 backdrop-blur-xl border-b border-border-subtle sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 py-2">
          {/* Mobile menu toggle button */}
          {walletConnected && (
            <div className="flex md:hidden mr-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-card-hover focus:outline-none transition-colors cursor-pointer"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          )}

          {/* Logo & Name */}
          <div className="flex items-center cursor-pointer flex-grow md:flex-grow-0" onClick={() => setActiveTab('landing')}>
            <img src="/mirrorasset-logo2.jpg" alt="MirrorAsset Logo" className="h-10 md:h-12 w-auto object-contain" />
          </div>

          {/* Navigation Links (Desktop) */}
          {walletConnected && (
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-accent-purple/10 text-accent-purple border border-accent-purple/20 shadow-sm shadow-accent-purple/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-hover border border-transparent'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}

          {/* Wallet / Network Integration */}
          <div className="flex items-center gap-3">
            {walletConnected ? (
              <>
                {/* Balance Display (Desktop only) */}
                <div className="hidden lg:flex items-center bg-bg-surface border border-border-subtle rounded-xl px-3 py-1.5 gap-3 text-xs text-text-secondary font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></span>
                    <span>{balanceXLM.toLocaleString(undefined, { maximumFractionDigits: 1 })} XLM</span>
                  </div>
                  <div className="w-[1px] h-3 bg-border-subtle"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse"></span>
                    <span>{balanceUSDC.toLocaleString(undefined, { maximumFractionDigits: 1 })} USDC</span>
                  </div>
                </div>

                {/* Claim Faucet */}
                <button
                  onClick={claimFaucet}
                  title="Claim test tokens from Stellar Faucet"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/30 text-accent-cyan hover:text-white rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
                >
                  <Coins className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Faucet</span>
                </button>

                {/* Testnet Badge */}
                <div
                  title="Connected to Stellar Testnet"
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-green/10 border border-accent-green/20 text-accent-green rounded-full text-[10px] font-bold uppercase tracking-wider"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse"></span>
                  <span>Testnet</span>
                </div>

                {/* Wallet Info */}
                <div className="flex items-center bg-bg-surface border border-border-subtle rounded-xl px-3.5 py-1.5 gap-2 text-sm text-text-primary">
                  <Wallet className="h-4 w-4 text-accent-purple" />
                  <span className="font-mono text-xs hidden sm:inline">{publicKey ? truncateAddress(publicKey) : ''}</span>
                  <span className="font-mono text-xs sm:hidden">{publicKey ? publicKey.substring(0, 4) + '...' + publicKey.substring(publicKey.length - 3) : ''}</span>
                  <button
                    onClick={disconnectWallet}
                    title="Disconnect Wallet"
                    className="ml-1 text-text-muted hover:text-accent-red transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-purple to-violet-600 hover:from-accent-purple hover:to-violet-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-accent-purple/25 transition-all duration-300 hover:shadow-xl hover:shadow-accent-purple/40 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Links */}
      {walletConnected && mobileMenuOpen && (
        <div data-testid="mobile-menu" className="md:hidden border-b border-border-subtle bg-bg-dark/95 backdrop-blur-xl px-4 pt-2 pb-3 space-y-1 animate-fade-in">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 cursor-pointer ${
                activeTab === item.id
                  ? 'bg-accent-purple/10 text-accent-purple border border-accent-purple/20 font-bold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-hover'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};
