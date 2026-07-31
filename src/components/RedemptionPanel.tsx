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

  const collateralPrice = activeAsset.collateralAsset === 'XLM' ? 0.12 : 1.00;
  const synthUSDValue = (parseFloat(redeemAmountStr) || 0) * activeAsset.price;
  const feePercent = 0.005;
  const protocolFeeUSD = synthUSDValue * feePercent;
  const netUSDValue = Math.max(0, synthUSDValue - protocolFeeUSD);
  const collateralOutput = netUSDValue / collateralPrice;

  const handleMaxClick = () => setRedeemAmountStr(synthBalance.toString());

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(redeemAmountStr);
    if (!amount || amount <= 0) return;
    const success = await redeemSynths(selectedSymbol, amount);
    if (success) setRedeemAmountStr('');
  };

  return (
    <div className="relative min-h-screen px-4 sm:px-6 lg:px-8 py-10 overflow-hidden">
      {/* Ambient backlights */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-24 w-80 h-80 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10 animate-fade-in space-y-8">

        {/* ── Page Header ── */}
        <div className="flex items-center gap-4">
          <div
            className="h-11 w-11 flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.20), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.35)', boxShadow: '0 0 18px rgba(99,102,241,0.20)' }}
          >
            <Repeat className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Direct Peg Redemptions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Swap synthetic assets directly with the collateral pool at standard oracle rates.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ── Left Form Panel ── */}
          <div className="md:col-span-2">
            <div
              className="rounded-2xl relative overflow-hidden"
              style={{ background: 'rgba(13,18,29,0.80)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 10px 40px rgba(0,0,0,0.55)' }}
            >
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400" />
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/4 via-transparent to-cyan-500/3 pointer-events-none" />

              <form onSubmit={handleRedeem} className="p-6 space-y-5">
                {/* Asset selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Synthetic Asset to Swap
                  </label>
                  <select
                    value={selectedSymbol}
                    onChange={(e) => { setSelectedSymbol(e.target.value); setRedeemAmountStr(''); }}
                    className="w-full rounded-xl py-3 px-4 text-white text-sm focus:outline-none transition-all cursor-pointer font-semibold"
                    style={{ background: 'rgba(15,20,35,0.90)', border: '1px solid rgba(255,255,255,0.09)' }}
                    onFocus={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(139,92,246,0.60)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
                    onBlur={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.09)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                  >
                    {assets.map(a => (
                      <option key={a.symbol} value={a.symbol} style={{ background: '#0c1017' }}>
                        {a.symbol} ({a.name}) — Balance: {balanceSynths[a.symbol] || 0}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Amount to Redeem</label>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Balance: <strong className="text-slate-300">{synthBalance.toLocaleString()} {selectedSymbol}</strong>
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
                      className="w-full rounded-xl py-3 px-4 pr-16 text-white text-base focus:outline-none transition-all font-mono"
                      style={{ background: 'rgba(15,20,35,0.90)', border: '1px solid rgba(255,255,255,0.09)' }}
                      onFocus={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(6,182,212,0.60)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(6,182,212,0.12)'; }}
                      onBlur={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.09)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                    />
                    <button
                      type="button"
                      onClick={handleMaxClick}
                      className="absolute right-3 top-2.5 px-2.5 py-1 text-cyan-400 text-xs font-bold rounded-lg transition-all cursor-pointer hover:text-white"
                      style={{ background: 'rgba(6,182,212,0.10)', border: '1px solid rgba(6,182,212,0.30)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.22)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.10)'}
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Calculation summary */}
                <div
                  className="rounded-xl p-4 space-y-3 text-xs font-medium"
                  style={{ background: 'rgba(15,20,35,0.70)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    Redemption Calculation
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Asset Oracle Price</span>
                    <span className="text-slate-300 font-mono">${activeAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Redeemable USD Value</span>
                    <span className="text-slate-300 font-mono">${synthUSDValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Protocol Fee (0.50%)</span>
                    <span className="text-rose-400 font-mono">−${protocolFeeUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between">
                    <span className="text-slate-200 font-bold text-sm">Estimated Output</span>
                    <span className="text-cyan-400 font-bold font-mono text-sm">
                      {collateralOutput.toLocaleString(undefined, { maximumFractionDigits: 4 })} {activeAsset.collateralAsset}
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || !redeemAmountStr || parseFloat(redeemAmountStr) <= 0 || parseFloat(redeemAmountStr) > synthBalance}
                  className="w-full py-4 rounded-xl text-sm font-bold text-white tracking-wide transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                  style={{ background: 'linear-gradient(to right, #4f46e5, #7c3aed, #06b6d4)', boxShadow: '0 0 25px rgba(124,58,237,0.35)' }}
                  onMouseEnter={e => { if (!(e.currentTarget as HTMLButtonElement).disabled) { (e.currentTarget as HTMLElement).style.opacity = '0.92'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 35px rgba(6,182,212,0.45)'; } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 25px rgba(124,58,237,0.35)'; }}
                >
                  {isLoading
                    ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <span>Submit Redemption Request</span>
                  }
                </button>
              </form>
            </div>
          </div>

          {/* ── Right Info Panel ── */}
          <div
            className="rounded-2xl p-5 space-y-5"
            style={{ background: 'rgba(13,18,29,0.70)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <h4 className="text-sm font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">How redemption works</h4>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div
                  className="p-1.5 rounded-lg flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)' }}
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-200">Price Anchoring:</strong> Direct redemption ensures the synthetic asset cannot trade below peg on secondary markets. Arbitrageurs can buy and redeem for full collateral value, driving the price back up.
                </p>
              </div>

              <div className="flex gap-3">
                <div
                  className="p-1.5 rounded-lg flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)' }}
                >
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-200">Front-Running Fee:</strong> A small 0.5% fee protects vault depositors from oracle latency exploitation, deterring high-frequency front-running.
                </p>
              </div>
            </div>

            {/* Testnet badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-emerald-400"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live on Stellar Testnet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
