import React, { useState } from 'react';
import { useStellar } from '../context/StellarContext';
import { Repeat, ShieldCheck, AlertTriangle } from 'lucide-react';

export const RedemptionPanel: React.FC = () => {
  const { assets, balanceSynths, redeemSynths, isLoading } = useStellar();
  const [selectedSymbol, setSelectedSymbol] = useState<string>(assets[0]?.symbol || 'sXAU');
  const [redeemAmountStr, setRedeemAmountStr] = useState<string>('');

  const activeAsset = assets.find(a => a.symbol === selectedSymbol);
  const synthBalance = balanceSynths[selectedSymbol] || 0;

  if (!activeAsset) return null;

  // Pricing
  const collateralPrice = activeAsset.collateralAsset === 'XLM' ? 0.12 : 1.00;
  const synthUSDValue = (parseFloat(redeemAmountStr) || 0) * activeAsset.price;
  const feePercent = 0.005; // 0.5% fee
  const protocolFeeUSD = synthUSDValue * feePercent;
  const netUSDValue = Math.max(0, synthUSDValue - protocolFeeUSD);
  const collateralOutput = netUSDValue / collateralPrice;

  const handleMaxClick = () => {
    setRedeemAmountStr(synthBalance.toString());
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(redeemAmountStr);
    if (!amount || amount <= 0) return;

    const success = await redeemSynths(selectedSymbol, amount);
    if (success) {
      setRedeemAmountStr('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center rounded-xl">
          <Repeat className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-100">Direct Peg Redemptions</h2>
          <p className="text-xs text-gray-400 mt-1">Swap synthetic assets directly with the collateral pool at standard oracle rates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Form Panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <form onSubmit={handleRedeem} className="space-y-5">
              {/* Asset Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Synthetic Asset to Swap</label>
                <select
                  value={selectedSymbol}
                  onChange={(e) => { setSelectedSymbol(e.target.value); setRedeemAmountStr(''); }}
                  className="w-full bg-gray-950/60 border border-gray-800 rounded-xl py-3 px-4 text-white text-sm focus:border-accent-purple focus:outline-none transition-all cursor-pointer font-semibold"
                >
                  {assets.map(a => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol} ({a.name}) - Balance: {balanceSynths[a.symbol] || 0}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-gray-400 font-semibold uppercase">Amount to Redeem</label>
                  <span className="text-gray-500 font-medium">
                    Wallet Balance: <strong className="text-gray-300">{synthBalance.toLocaleString()} {selectedSymbol}</strong>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={redeemAmountStr}
                    onChange={(e) => setRedeemAmountStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-950/60 border border-gray-800 rounded-xl py-3 px-4 text-white text-base focus:border-accent-purple focus:outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className="absolute right-3 top-2.5 px-2.5 py-1 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-200 text-xs font-bold rounded-lg transition-all"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Calculation Summary */}
              <div className="bg-gray-950/40 border border-gray-900 rounded-xl p-4.5 space-y-3.5 text-xs font-medium">
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-900/60 pb-2">Redemption Calculation</h4>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Asset Oracle Price</span>
                  <span className="text-gray-300 font-mono">${activeAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Redeemable USD Value</span>
                  <span className="text-gray-300 font-mono">${synthUSDValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Protocol Fee (0.50%)</span>
                  <span className="text-gray-400 font-mono">-${protocolFeeUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="w-full h-[1px] bg-gray-900"></div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-200 font-bold">Estimated Output</span>
                  <span className="text-accent-cyan font-bold font-mono">
                    {collateralOutput.toLocaleString(undefined, { maximumFractionDigits: 4 })} {activeAsset.collateralAsset}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !redeemAmountStr || parseFloat(redeemAmountStr) <= 0 || parseFloat(redeemAmountStr) > synthBalance}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-accent-purple hover:from-indigo-700 hover:to-accent-purple/90 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>Submit Redemption Request</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold text-gray-200">How redemption works</h4>
            
            <div className="flex gap-3">
              <div className="p-1.5 bg-gray-900 border border-gray-800 rounded-lg flex-shrink-0 mt-0.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong>Price Anchoring:</strong> Direct redemption ensures the synthetic asset cannot trade below peg on secondary markets. If it does, anyone can buy it and redeem it here for full collateral value, making an instant profit and driving the price back up.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="p-1.5 bg-gray-900 border border-gray-800 rounded-lg flex-shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong>Front-Running Fee:</strong> A small 0.5% fee is applied to protect vault depositors from oracle latency exploitation. This ensures arbitrageurs pay for the service and deters high-frequency front-running.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
