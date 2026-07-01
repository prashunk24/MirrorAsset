import React from 'react';
import { useStellar } from '../context/StellarContext';
import { Wallet, LogOut, Coins, Activity, ShieldAlert } from 'lucide-react';

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
    simulationMode,
    connectWallet,
    disconnectWallet,
    claimFaucet,
    isLoading
  } = useStellar();

  const truncateAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const navItems = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'whitebelt', name: 'White Belt' },
    { id: 'redemption', name: 'Redemptions' },
    { id: 'liquidation', name: 'Liquidations' },
    { id: 'transactions', name: 'History' },
  ];

  return (
    <nav className="border-b border-gray-800/80 bg-bg-dark/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Name */}
          <div className="flex items-center cursor-pointer" onClick={() => setActiveTab('landing')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-accent-purple to-accent-cyan flex items-center justify-center shadow-lg shadow-accent-purple/20">
              <Activity className="h-6 w-6 text-white stroke-[2.5]" />
            </div>
            <span className="ml-3 text-xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-tight">
              Mirror<span className="text-accent-purple">Asset</span>
            </span>
          </div>

          {/* Navigation Links */}
          {walletConnected && (
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-accent-purple/10 text-accent-purple border border-accent-purple/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border border-transparent'
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
                {/* Balance Display */}
                <div className="hidden lg:flex items-center bg-gray-900/60 border border-gray-800/60 rounded-xl px-3 py-1.5 gap-3 text-xs text-gray-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></span>
                    <span>{balanceXLM.toLocaleString(undefined, { maximumFractionDigits: 1 })} XLM</span>
                  </div>
                  <div className="w-[1px] h-3 bg-gray-800"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse"></span>
                    <span>{balanceUSDC.toLocaleString(undefined, { maximumFractionDigits: 1 })} USDC</span>
                  </div>
                </div>

                {/* Claim Faucet */}
                <button
                  onClick={claimFaucet}
                  title="Claim test tokens from Stellar Faucet"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/30 text-accent-cyan hover:text-white rounded-xl text-xs font-semibold transition-all duration-200"
                >
                  <Coins className="h-3.5 w-3.5" />
                  <span>Faucet</span>
                </button>

                {/* Simulation Mode indicator */}
                {simulationMode && (
                  <div
                    title="Running on simulated network layer"
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                  >
                    <ShieldAlert className="h-3 w-3" />
                    <span>Simulated</span>
                  </div>
                )}

                {/* Wallet Info Dropdown / Button */}
                <div className="flex items-center bg-gray-900/80 border border-gray-800 rounded-xl px-3.5 py-1.5 gap-2 text-sm text-gray-200">
                  <Wallet className="h-4 w-4 text-accent-purple" />
                  <span className="font-mono text-xs">{publicKey ? truncateAddress(publicKey) : ''}</span>
                  <button
                    onClick={disconnectWallet}
                    title="Disconnect Wallet"
                    className="ml-1 text-gray-500 hover:text-rose-400 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-purple to-violet-600 hover:from-accent-purple hover:to-violet-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-accent-purple/20 transition-all duration-300 hover:shadow-accent-purple/35 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none"
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
    </nav>
  );
};
