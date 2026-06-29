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

  // Filter vaults
  const displayVaults = vaults.filter(v => {
    // If filtering liquidatable, only show vaults in Liquidatable state
    // Skip vaults owned by the liquidator themselves to represent competitive market mechanics
    const isLiquidatable = v.health === 'Liquidatable';
    const isNotSelf = v.owner !== publicKey;
    
    if (filterLiquidatable) {
      return isLiquidatable && isNotSelf;
    }
    return isNotSelf;
  });

  const getCollateralPrice = (asset: 'XLM' | 'USDC') => asset === 'XLM' ? 0.12 : 1.00;

  // Liquidation math
  let seizedCollateral = 0;
  let estimatedProfitUSD = 0;
  if (selectedVault && selectedAsset) {
    const debtToCover = parseFloat(debtToCoverStr) || 0;
    const debtValUSD = debtToCover * selectedAsset.price;
    const bonusMultiplier = 1.10; // 10% bonus
    const collateralValueToGet = debtValUSD * bonusMultiplier;

    const collateralPrice = getCollateralPrice(selectedVault.collateralAsset);
    seizedCollateral = collateralValueToGet / collateralPrice;

    // Cap at vault's actual collateral
    if (seizedCollateral > selectedVault.collateralAmount) {
      seizedCollateral = selectedVault.collateralAmount;
    }

    const collateralSeizedUSD = seizedCollateral * collateralPrice;
    estimatedProfitUSD = Math.max(0, collateralSeizedUSD - debtValUSD);
  }

  const handleMaxCover = () => {
    if (selectedVault) {
      const maxCover = Math.min(selectedVault.mintedAmount, userSynthBalance);
      setDebtToCoverStr(maxCover.toString());
    }
  };

  const handleExecuteLiquidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVaultId) return;
    const coverAmount = parseFloat(debtToCoverStr);
    if (!coverAmount || coverAmount <= 0) return;

    const success = await liquidateVault(selectedVaultId, coverAmount);
    if (success) {
      setSelectedVaultId(null);
      setDebtToCoverStr('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center rounded-xl">
            <Flame className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100">Liquidation Dashboard</h2>
            <p className="text-xs text-gray-400 mt-1">Acquire collateral at a 10% discount by paying off unhealthy vault debt.</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex gap-2 p-1 bg-gray-950/60 border border-gray-900 rounded-xl">
          <button
            onClick={() => { setFilterLiquidatable(true); setSelectedVaultId(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              filterLiquidatable ? 'bg-gray-900 border border-gray-800 text-gray-100' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Liquidatable Only ({vaults.filter(v => v.health === 'Liquidatable' && v.owner !== publicKey).length})
          </button>
          <button
            onClick={() => { setFilterLiquidatable(false); setSelectedVaultId(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              !filterLiquidatable ? 'bg-gray-900 border border-gray-800 text-gray-100' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            All Vaults ({vaults.filter(v => v.owner !== publicKey).length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Vaults List */}
        <div className="lg:col-span-2 space-y-4">
          {displayVaults.length === 0 ? (
            <div className="glass-panel rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="p-4 bg-gray-900/60 rounded-full border border-gray-800 mb-4">
                <ShieldCheck className="h-8 w-8 text-emerald-400" />
              </div>
              <h4 className="font-semibold text-gray-200 text-base">All Vaults Healthy</h4>
              <p className="text-gray-500 text-xs mt-2 max-w-sm">
                No third-party vaults are currently below their safety threshold. The protocol is fully backed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayVaults.map(vault => {
                const asset = assets.find(a => a.symbol === vault.syntheticAsset);
                const minRatio = asset?.minCollateralRatio || 150;
                const isLiquidatable = vault.health === 'Liquidatable';

                return (
                  <div
                    key={vault.id}
                    className={`glass-panel p-5 rounded-2xl flex flex-col justify-between border-l-2 transition-all duration-300 ${
                      isLiquidatable 
                        ? 'border-l-rose-500 shadow-lg shadow-rose-950/5' 
                        : 'border-l-gray-700'
                    } ${selectedVaultId === vault.id ? 'ring-2 ring-rose-500/50 bg-rose-950/5' : ''}`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-[10px] font-mono text-gray-500">
                          OWNER: {vault.owner.substring(0, 8)}...
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isLiquidatable 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {vault.health}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-gray-100 mt-3">
                        {vault.syntheticAsset} Vault
                      </h4>

                      <div className="my-4 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="block text-gray-500 font-medium">Locked Collateral</span>
                          <span className="font-bold text-gray-300">{vault.collateralAmount.toLocaleString()} {vault.collateralAsset}</span>
                        </div>
                        <div>
                          <span className="block text-gray-500 font-medium">Debt to Cover</span>
                          <span className="font-bold text-gray-300">{vault.mintedAmount.toLocaleString()} {vault.syntheticAsset}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-900/60 pt-4 flex items-center justify-between">
                      <div>
                        <span className="block text-[10px] text-gray-500 font-medium">Collateral Ratio</span>
                        <span className={`text-sm font-bold ${isLiquidatable ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {vault.collateralRatio}%
                        </span>
                        <span className="text-[10px] text-gray-500 ml-1">(min {minRatio}%)</span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedVaultId(vault.id);
                          setDebtToCoverStr('');
                        }}
                        disabled={!isLiquidatable}
                        className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                          isLiquidatable
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/10 cursor-pointer'
                            : 'bg-gray-900 text-gray-500 border border-gray-800 cursor-not-allowed opacity-50'
                        }`}
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

        {/* Right Side: Action form / Rules Panel */}
        <div className="space-y-6">
          {selectedVault && selectedAsset ? (
            <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-950/5 space-y-4 animate-scale-up">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <Flame className="h-4.5 w-4.5" />
                <span>Liquidate Vault {selectedVault.id.toUpperCase()}</span>
              </h3>
              
              <form onSubmit={handleExecuteLiquidation} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-gray-400 font-semibold uppercase">Debt to Cover ({selectedVault.syntheticAsset})</label>
                    <span className="text-gray-500 font-medium">
                      My Wallet: <strong className="text-gray-300">{userSynthBalance.toLocaleString()} {selectedVault.syntheticAsset}</strong>
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
                      className="w-full bg-gray-950/60 border border-gray-800 rounded-xl py-2.5 px-3 text-white text-sm focus:border-rose-500 focus:outline-none transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleMaxCover}
                      className="absolute right-2 top-2 px-2 py-0.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-200 text-[10px] font-bold rounded-lg transition-all"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Calculation */}
                <div className="bg-gray-950/50 border border-gray-900 rounded-xl p-3.5 space-y-2.5 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Max Coverable Debt</span>
                    <span className="text-gray-300 font-mono">{selectedVault.mintedAmount} {selectedVault.syntheticAsset}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Collateral Seizure (10% Bonus)</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      +{seizedCollateral.toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedVault.collateralAsset}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Estimated Profit (USD)</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      +${estimatedProfitUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isLoading || !debtToCoverStr || parseFloat(debtToCoverStr) <= 0 || parseFloat(debtToCoverStr) > userSynthBalance}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isLoading ? 'Liquidating...' : 'Execute Liquidation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVaultId(null)}
                    className="px-3 bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <h4 className="text-sm font-bold text-gray-200 flex items-center gap-1.5">
                <ShieldAlert className="h-4.5 w-4.5 text-rose-400" />
                <span>Liquidation Guidelines</span>
              </h4>
              
              <div className="space-y-3 text-xs text-gray-400 leading-relaxed">
                <div className="flex gap-2">
                  <span className="font-bold text-rose-400">1.</span>
                  <span><strong>Threshold:</strong> Vaults can be liquidated when their collateralization ratio drops below the minimum safety threshold (e.g. 150%).</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-rose-400">2.</span>
                  <span><strong>Bonus Incentives:</strong> Liquidators buy the vault's outstanding debt (burning the synthetic asset) and receive an equivalent value of vault collateral + 10% bonus.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-rose-400">3.</span>
                  <span><strong>Health Reset:</strong> Liquidations can cover all or part of the debt, returning the remaining vault to a healthy collateralization ratio.</span>
                </div>
              </div>

              <div className="bg-gray-950/40 border border-gray-900 p-3 rounded-xl flex gap-2">
                <Info className="h-4 w-4 text-accent-cyan flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-500 leading-normal">
                  Want to test liquidations? Wait for oracle price ticks to fluctuate, or click the refresh ticker button to trigger price drops for equities and commodities!
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
