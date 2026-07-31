import React, { useState } from 'react';
import { useStellar } from '../context/StellarContext';
import { ShieldAlert, Info, ShieldCheck, Flame } from 'lucide-react';

export const LiquidationPanel: React.FC = () => {
  const { vaults, assets, balanceSynths, liquidateVault, isLoading, publicKey } = useStellar();

  const [filterLiquidatable, setFilterLiquidatable] = useState<boolean>(true);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [debtToCoverStr, setDebtToCoverStr] = useState<string>('');

  const selectedVault = vaults.find(v => v.id === selectedVaultId);
  const selectedAsset = assets.find(a => a.symbol === selectedVault?.syntheticAsset);
  const userSynthBalance = selectedVault ? (balanceSynths[selectedVault.syntheticAsset] || 0) : 0;

  const displayVaults = vaults.filter(v => {
    const isLiquidatable = v.health === 'Liquidatable';
    const isNotSelf = v.owner !== publicKey;
    if (filterLiquidatable) return isLiquidatable && isNotSelf;
    return isNotSelf;
  });

  const getCollateralPrice = (asset: 'XLM' | 'USDC') => asset === 'XLM' ? 0.12 : 1.00;

  let seizedCollateral = 0;
  let estimatedProfitUSD = 0;
  if (selectedVault && selectedAsset) {
    const debtToCover = parseFloat(debtToCoverStr) || 0;
    const debtValUSD = debtToCover * selectedAsset.price;
    const collateralValueToGet = debtValUSD * 1.10;
    const collateralPrice = getCollateralPrice(selectedVault.collateralAsset);
    seizedCollateral = Math.min(collateralValueToGet / collateralPrice, selectedVault.collateralAmount);
    const collateralSeizedUSD = seizedCollateral * collateralPrice;
    estimatedProfitUSD = Math.max(0, collateralSeizedUSD - debtValUSD);
  }

  const handleMaxCover = () => {
    if (selectedVault) setDebtToCoverStr(Math.min(selectedVault.mintedAmount, userSynthBalance).toString());
  };

  const handleExecuteLiquidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVaultId) return;
    const coverAmount = parseFloat(debtToCoverStr);
    if (!coverAmount || coverAmount <= 0) return;
    const success = await liquidateVault(selectedVaultId, coverAmount);
    if (success) { setSelectedVaultId(null); setDebtToCoverStr(''); }
  };

  const liquidatableCount = vaults.filter(v => v.health === 'Liquidatable' && v.owner !== publicKey).length;
  const allOtherCount = vaults.filter(v => v.owner !== publicKey).length;

  return (
    <div className="relative min-h-screen px-4 sm:px-6 lg:px-8 py-10 overflow-hidden">
      {/* Ambient backlights */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-24 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 animate-fade-in space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div
              className="h-11 w-11 flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.10))', border: '1px solid rgba(239,68,68,0.30)', boxShadow: '0 0 18px rgba(239,68,68,0.18)' }}
            >
              <Flame className="h-5 w-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Liquidation Dashboard
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Acquire collateral at a 10% discount by paying off unhealthy vault debt.</p>
            </div>
          </div>

          {/* Filter pill toggle */}
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ background: 'rgba(13,18,29,0.80)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <button
              onClick={() => { setFilterLiquidatable(true); setSelectedVaultId(null); }}
              className="px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer"
              style={filterLiquidatable
                ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5' }
                : { color: 'rgba(100,116,139,1)', background: 'transparent', border: '1px solid transparent' }
              }
            >
              Liquidatable Only ({liquidatableCount})
            </button>
            <button
              onClick={() => { setFilterLiquidatable(false); setSelectedVaultId(null); }}
              className="px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer"
              style={!filterLiquidatable
                ? { background: 'rgba(15,20,35,0.80)', border: '1px solid rgba(255,255,255,0.15)', color: '#f1f5f9' }
                : { color: 'rgba(100,116,139,1)', background: 'transparent', border: '1px solid transparent' }
              }
            >
              All Vaults ({allOtherCount})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: Vault List ── */}
          <div className="lg:col-span-2 space-y-4">
            {displayVaults.length === 0 ? (
              <div
                className="rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]"
                style={{ background: 'rgba(13,18,29,0.70)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.20), rgba(6,182,212,0.15))', border: '1px solid rgba(16,185,129,0.30)', boxShadow: '0 0 20px rgba(16,185,129,0.20)' }}
                >
                  <ShieldCheck className="h-8 w-8 text-emerald-400" />
                </div>
                <h4 className="font-semibold text-slate-200 text-base">All Vaults Healthy</h4>
                <p className="text-slate-500 text-xs mt-2 max-w-sm">
                  No third-party vaults are currently below their safety threshold. The protocol is fully backed.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayVaults.map(vault => {
                  const asset = assets.find(a => a.symbol === vault.syntheticAsset);
                  const minRatio = asset?.minCollateralRatio || 150;
                  const isLiquidatable = vault.health === 'Liquidatable';
                  const isSelected = selectedVaultId === vault.id;

                  return (
                    <div
                      key={vault.id}
                      className="p-5 rounded-2xl flex flex-col justify-between transition-all duration-300"
                      style={{
                        background: isSelected
                          ? 'rgba(239,68,68,0.06)'
                          : 'rgba(13,18,29,0.70)',
                        backdropFilter: 'blur(24px)',
                        border: isSelected
                          ? '1px solid rgba(239,68,68,0.40)'
                          : isLiquidatable
                            ? '1px solid rgba(239,68,68,0.20)'
                            : '1px solid rgba(255,255,255,0.09)',
                        borderLeft: isLiquidatable ? '2px solid rgba(239,68,68,0.70)' : '2px solid rgba(100,116,139,0.40)',
                        boxShadow: isSelected ? '0 0 24px rgba(239,68,68,0.15)' : '0 8px 24px rgba(0,0,0,0.30)',
                      }}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded font-mono"
                            style={{ background: 'rgba(15,20,35,0.80)', border: '1px solid rgba(255,255,255,0.07)' }}
                          >
                            {vault.owner.substring(0, 8)}…
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isLiquidatable
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {vault.health}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-white mt-3">{vault.syntheticAsset} Vault</h4>

                        <div className="my-4 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="block text-slate-500 font-medium mb-0.5">Locked Collateral</span>
                            <span className="font-bold text-slate-300">{vault.collateralAmount.toLocaleString()} {vault.collateralAsset}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 font-medium mb-0.5">Debt to Cover</span>
                            <span className="font-bold text-slate-300">{vault.mintedAmount.toLocaleString()} {vault.syntheticAsset}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        <div>
                          <span className="block text-[10px] text-slate-500 font-medium">Collateral Ratio</span>
                          <span className={`text-sm font-bold ${isLiquidatable ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {vault.collateralRatio}%
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">(min {minRatio}%)</span>
                        </div>

                        <button
                          onClick={() => { setSelectedVaultId(vault.id); setDebtToCoverStr(''); }}
                          disabled={!isLiquidatable}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                            isLiquidatable ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed opacity-40'
                          }`}
                          style={isLiquidatable
                            ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.40)', color: '#fca5a5', boxShadow: '0 0 12px rgba(239,68,68,0.15)' }
                            : { background: 'rgba(15,20,35,0.80)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(100,116,139,1)' }
                          }
                          onMouseEnter={e => { if (isLiquidatable) (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.25)'; }}
                          onMouseLeave={e => { if (isLiquidatable) (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; }}
                        >
                          <Flame className="h-3.5 w-3.5" />
                          <span>Liquidate</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right: Action Form or Guidelines ── */}
          <div>
            {selectedVault && selectedAsset ? (
              <div
                className="rounded-2xl p-5 space-y-4 relative overflow-hidden"
                style={{ background: 'rgba(40,10,10,0.60)', backdropFilter: 'blur(24px)', border: '1px solid rgba(239,68,68,0.30)', boxShadow: '0 0 30px rgba(239,68,68,0.08)' }}
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-600 via-rose-500 to-orange-400" />

                <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  <span>Liquidate Vault {selectedVault.id.toUpperCase()}</span>
                </h3>

                <form onSubmit={handleExecuteLiquidation} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Debt to Cover ({selectedVault.syntheticAsset})
                      </label>
                      <span className="text-[11px] text-slate-500">
                        My Wallet: <strong className="text-slate-300">{userSynthBalance.toLocaleString()}</strong>
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        value={debtToCoverStr}
                        onChange={(e) => setDebtToCoverStr(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl py-3 px-4 pr-16 text-white text-sm focus:outline-none transition-all font-mono"
                        style={{ background: 'rgba(15,10,10,0.90)', border: '1px solid rgba(239,68,68,0.25)' }}
                        onFocus={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(239,68,68,0.60)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(239,68,68,0.10)'; }}
                        onBlur={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(239,68,68,0.25)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={handleMaxCover}
                        className="absolute right-3 top-2.5 px-2 py-1 text-rose-400 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)' }}
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  {/* Calculation */}
                  <div
                    className="rounded-xl p-3.5 space-y-2.5 text-xs font-semibold"
                    style={{ background: 'rgba(15,10,10,0.70)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="flex justify-between">
                      <span className="text-slate-500">Max Coverable Debt</span>
                      <span className="text-slate-300 font-mono">{selectedVault.mintedAmount} {selectedVault.syntheticAsset}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Collateral Seizure (10% bonus)</span>
                      <span className="text-emerald-400 font-bold font-mono">+{seizedCollateral.toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedVault.collateralAsset}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estimated Profit (USD)</span>
                      <span className="text-emerald-400 font-bold font-mono">+${estimatedProfitUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isLoading || !debtToCoverStr || parseFloat(debtToCoverStr) <= 0 || parseFloat(debtToCoverStr) > userSynthBalance}
                      className="flex-1 py-3.5 text-white font-bold rounded-xl text-xs tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-95"
                      style={{ background: 'linear-gradient(to right, #dc2626, #b91c1c)', boxShadow: '0 0 20px rgba(239,68,68,0.25)' }}
                    >
                      {isLoading ? 'Liquidating…' : 'Execute Liquidation'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVaultId(null)}
                      className="px-4 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer text-slate-400 hover:text-white"
                      style={{ background: 'rgba(15,20,35,0.80)', border: '1px solid rgba(255,255,255,0.09)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div
                className="rounded-2xl p-5 space-y-5"
                style={{ background: 'rgba(13,18,29,0.70)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  <span>Liquidation Guidelines</span>
                </h4>

                <div className="space-y-4 text-xs text-slate-400 leading-relaxed">
                  {[
                    { n: '1', title: 'Threshold:', body: 'Vaults can be liquidated when their collateralization ratio drops below the minimum safety threshold (e.g. 150%).' },
                    { n: '2', title: 'Bonus Incentives:', body: "Liquidators burn the vault's synthetic debt and receive an equivalent collateral value + 10% bonus." },
                    { n: '3', title: 'Health Reset:', body: 'Liquidations can cover all or part of the debt, returning the remaining vault to a healthy ratio.' },
                  ].map(item => (
                    <div key={item.n} className="flex gap-2.5">
                      <span
                        className="font-extrabold text-rose-400 flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-[10px]"
                        style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}
                      >
                        {item.n}
                      </span>
                      <span><strong className="text-slate-200">{item.title}</strong> {item.body}</span>
                    </div>
                  ))}
                </div>

                <div
                  className="flex gap-2.5 p-3 rounded-xl"
                  style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)' }}
                >
                  <Info className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Want to test liquidations? Wait for oracle price ticks or click the market refresh button to trigger price drops for equities and commodities!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
