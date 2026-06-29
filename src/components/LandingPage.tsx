import React from 'react';
import { useStellar } from '../context/StellarContext';
import { ArrowRight, ShieldCheck, Cpu, Repeat, Zap, Award, Coins } from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  const { walletConnected, connectWallet, assets } = useStellar();

  const handleStart = async () => {
    if (!walletConnected) {
      const connected = await connectWallet();
      if (connected) {
        onLaunch();
      }
    } else {
      onLaunch();
    }
  };

  const featureCards = [
    {
      icon: <ShieldCheck className="h-6 w-6 text-accent-purple" />,
      title: "Over-Collateralized Vaults",
      desc: "Mint digital tokens backed by solid assets like USDC and XLM. Smart contracts enforce safety ratios (130%-180%) to prevent default."
    },
    {
      icon: <Cpu className="h-6 w-6 text-accent-cyan" />,
      title: "Decentralized Oracles",
      desc: "Get real-time off-chain price feeds for stocks, commodities, and fiat, securely piped onto Stellar using oracle contract adapters."
    },
    {
      icon: <Repeat className="h-6 w-6 text-indigo-400" />,
      title: "Redemption Peg Mechanism",
      desc: "Buy synthetic assets below peg and redeem them directly for underlying collateral at oracle prices, creating a solid arbitrage anchor."
    },
    {
      icon: <Zap className="h-6 w-6 text-pink-400" />,
      title: "Fast, Low-Cost Settlement",
      desc: "Benefit from the Stellar ledger's sub-second finality and near-zero transaction fees, maximizing trading and arbitrage margins."
    }
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-between overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-grow flex flex-col justify-center items-center">
        {/* Banner */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-purple/10 border border-accent-purple/20 text-accent-purple rounded-full text-xs font-semibold mb-8 animate-fade-in">
          <Award className="h-4 w-4" />
          <span>Stellar Soroban Synthetic Asset Protocol</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-center text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight max-w-4xl">
          <span className="bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            Mint & Trade Real-World Assets on
          </span>
          <br />
          <span className="bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
            Stellar Blockchain
          </span>
        </h1>

        <p className="mt-6 text-center text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
          Gain instant price exposure to gold, silver, equities, and forex. Lock collateral, mint synthetic tokens, and trade on the world's fastest payment network.
        </p>

        {/* Call to Action buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center z-10">
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent-purple to-indigo-600 hover:from-accent-purple hover:to-indigo-700 text-white rounded-xl text-base font-bold shadow-2xl shadow-accent-purple/30 transition-all duration-300 hover:shadow-accent-purple/50 transform hover:-translate-y-1 active:translate-y-0 group cursor-pointer"
          >
            <span>{walletConnected ? 'Launch Dashboard' : 'Connect & Launch'}</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {!walletConnected && (
            <button
              onClick={connectWallet}
              className="flex items-center gap-2 px-6 py-4 bg-gray-900/80 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white rounded-xl text-base font-semibold transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 cursor-pointer"
            >
              <Coins className="h-5 w-5 text-accent-cyan" />
              <span>Simulated Demo Mode</span>
            </button>
          )}
        </div>

        {/* Protocol Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mt-20 border border-gray-800/60 rounded-2xl p-6 bg-gray-950/40 backdrop-blur-sm">
          <div className="text-center p-3">
            <span className="block text-2xl sm:text-3xl font-extrabold text-white">$14.2M</span>
            <span className="block text-xs sm:text-sm text-gray-500 mt-1 uppercase font-semibold tracking-wider">Total Value Locked</span>
          </div>
          <div className="text-center p-3 border-l border-gray-800/60">
            <span className="block text-2xl sm:text-3xl font-extrabold text-white">$8.6M</span>
            <span className="block text-xs sm:text-sm text-gray-500 mt-1 uppercase font-semibold tracking-wider">Synthetic Debt Minted</span>
          </div>
          <div className="text-center p-3 border-l border-gray-800/60">
            <span className="block text-2xl sm:text-3xl font-extrabold text-white">164.8%</span>
            <span className="block text-xs sm:text-sm text-gray-500 mt-1 uppercase font-semibold tracking-wider">Avg Collateral Ratio</span>
          </div>
          <div className="text-center p-3 border-l border-gray-800/60">
            <span className="block text-2xl sm:text-3xl font-extrabold text-white">5 Assets</span>
            <span className="block text-xs sm:text-sm text-gray-500 mt-1 uppercase font-semibold tracking-wider">Oracle Price Feeds</span>
          </div>
        </div>

        {/* Live Asset Ticker */}
        <div className="w-full max-w-4xl mt-12 bg-gray-950/20 rounded-xl border border-gray-900/50 p-4 overflow-hidden">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest text-center mb-3">Live Oracle Feeds</h3>
          <div className="flex flex-wrap justify-center gap-6">
            {assets.slice(0, 4).map(asset => (
              <div key={asset.symbol} className="flex items-center gap-3 bg-gray-900/40 px-4 py-2 rounded-xl border border-gray-800/40">
                <span className="text-sm font-bold text-gray-100">{asset.symbol}</span>
                <span className="text-sm font-semibold text-gray-300">${asset.price.toLocaleString()}</span>
                <span className={`text-xs font-bold ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature section */}
        <div className="mt-32 max-w-6xl w-full">
          <h2 className="text-center text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Built for Stability and Scalability
          </h2>
          <p className="text-center text-gray-400 mt-2 max-w-xl mx-auto text-sm">
            MirrorAsset relies on decentralized price feeds and protocol-enforced liquidations to ensure synthetic tokens always mirror real-world prices.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {featureCards.map((feat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl glass-panel glass-panel-hover flex gap-4 items-start"
              >
                <div className="p-3 bg-gray-900/80 rounded-xl border border-gray-800 flex-shrink-0">
                  {feat.icon}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-100">{feat.title}</h4>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-gray-900/60 py-8 bg-gray-950/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-500">
          <p>© 2026 MirrorAsset Protocol. Built on Stellar using Soroban Smart Contracts. For demonstration purposes only.</p>
        </div>
      </footer>
    </div>
  );
};
