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

  const truncateAddress = (addr: string) =>
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  const navItems = [
    { id: 'dashboard',    name: 'Dashboard'      },
    { id: 'whitebelt',   name: 'Stellar Mastery' },
    { id: 'redemption',  name: 'Redemptions'     },
    { id: 'liquidation', name: 'Liquidations'    },
    { id: 'transactions',name: 'History'         },
  ];

  return (
    /* ── Floating wrapper — no full-bleed border, just positioned pill ── */
    <header className="sticky top-4 z-50 px-4 max-w-7xl mx-auto w-full transition-all duration-300">
      {/* ── Floating pill nav ── */}
      <nav
        className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 rounded-full w-full overflow-hidden"
        style={{
          background: 'rgba(13,18,29,0.80)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.60)',
        }}
      >
        {/* ── LEFT: mobile hamburger + logo ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Hamburger — renders first in DOM so getAllByRole('button')[0] still finds it */}
          {walletConnected && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden inline-flex items-center justify-center p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          )}

          {/* Logo */}
          <div
            className="flex items-center flex-shrink-0 cursor-pointer group"
            onClick={() => setActiveTab('landing')}
          >
            <img
              src="/mirrorasset-logo2.jpg"
              alt="MirrorAsset Logo"
              className="h-7 sm:h-9 w-auto object-contain flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
              style={{ filter: 'drop-shadow(0 0 10px rgba(139,92,246,0.50))' }}
            />
          </div>
        </div>

        {/* ── CENTER: frosted pill nav capsule (desktop only, connected only) ── */}
        {walletConnected && (
          <div
            className="hidden lg:flex items-center gap-0.5 p-1 rounded-full"
            style={{
              background: 'rgba(15,20,35,0.65)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === item.id
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                style={
                  activeTab === item.id
                    ? {
                        background: 'linear-gradient(to right, rgba(109,40,217,0.45), rgba(6,182,212,0.35))',
                        border: '1px solid rgba(139,92,246,0.45)',
                        boxShadow: '0 0 12px rgba(139,92,246,0.30)',
                      }
                    : {}
                }
              >
                {item.name}
              </button>
            ))}
          </div>
        )}

        {/* ── RIGHT: balances, faucet, wallet ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {walletConnected ? (
            <>
              {/* Balance pill — md+ only */}
              <div
                className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300"
                style={{
                  background: 'rgba(15,20,35,0.85)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span className="text-cyan-400 font-bold">
                  {balanceXLM.toLocaleString(undefined, { maximumFractionDigits: 1 })} XLM
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-violet-400 font-bold">
                  {balanceUSDC.toLocaleString(undefined, { maximumFractionDigits: 1 })} USDC
                </span>
              </div>

              {/* Faucet — hidden until md to avoid mobile crush */}
              <button
                onClick={claimFaucet}
                title="Claim test tokens from Stellar Faucet"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-cyan-400 text-xs font-semibold transition-all duration-200 cursor-pointer hover:text-white"
                style={{
                  background: 'rgba(6,182,212,0.10)',
                  border: '1px solid rgba(6,182,212,0.30)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.20)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.10)';
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <Coins className="h-3 w-3" />
                <span>Faucet</span>
              </button>

              {/* Testnet badge */}
              <div
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-400"
                style={{
                  background: 'rgba(16,185,129,0.10)',
                  border: '1px solid rgba(16,185,129,0.20)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Testnet</span>
              </div>

              {/* Wallet address + disconnect — compact on mobile */}
              <div
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3.5 py-1.5 rounded-full text-xs text-slate-200"
                style={{
                  background: 'rgba(15,20,35,0.85)',
                  border: '1px solid rgba(255,255,255,0.09)',
                }}
              >
                <Wallet className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
                {/* sm+: 6-char truncation; mobile: 4-char ultra-compact */}
                <span className="font-mono hidden sm:inline">
                  {publicKey ? truncateAddress(publicKey) : ''}
                </span>
                <span className="font-mono sm:hidden text-[10px]">
                  {publicKey
                    ? `${publicKey.substring(0, 4)}...${publicKey.substring(publicKey.length - 3)}`
                    : ''}
                </span>
                <button
                  onClick={disconnectWallet}
                  title="Disconnect Wallet"
                  className="ml-0.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            /* Connect Wallet button — shorter label on mobile */
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-full text-white text-[11px] sm:text-xs font-semibold transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:pointer-events-none whitespace-nowrap"
              style={{
                background: 'linear-gradient(to right, #4f46e5, #7c3aed, #06b6d4)',
                boxShadow: '0 0 15px rgba(124,58,237,0.35)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.opacity = '0.90';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 22px rgba(124,58,237,0.55)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.opacity = '1';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 15px rgba(124,58,237,0.35)';
              }}
            >
              {isLoading
                ? <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Wallet className="h-3.5 w-3.5" />
              }
              {/* Full label sm+, short on xs */}
              <span className="hidden sm:inline">Connect Wallet</span>
              <span className="sm:hidden">Connect</span>
            </button>
          )}
        </div>
      </nav>

      {/* ── Mobile drawer — slides below the pill ── */}
      {walletConnected && mobileMenuOpen && (
        <div
          data-testid="mobile-menu"
          className="lg:hidden mt-2 rounded-2xl px-4 pt-3 pb-4 space-y-1 animate-fade-in"
          style={{
            background: 'rgba(13,18,29,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === item.id
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={
                activeTab === item.id
                  ? {
                      background: 'linear-gradient(to right, rgba(109,40,217,0.30), rgba(6,182,212,0.20))',
                      border: '1px solid rgba(139,92,246,0.30)',
                    }
                  : {}
              }
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
