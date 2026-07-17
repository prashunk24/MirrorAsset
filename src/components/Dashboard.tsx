import React, { useState } from 'react';
import { useStellar } from '../context/StellarContext';

import { Plus, Settings2, Sparkles, TrendingUp, TrendingDown, RefreshCw, Layers } from 'lucide-react';

interface DashboardProps {
  onManageVault: (vaultId: string) => void;
  onCreateVaultClick: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onManageVault, onCreateVaultClick }) => {
  const { assets, vaults, publicKey, triggerPriceTick } = useStellar();
  const [tickerLoading, setTickerLoading] = useState(false);

  // Trigger manual price tick
  const handlePriceRefresh = () => {
    setTickerLoading(true);
    triggerPriceTick();
    setTimeout(() => setTickerLoading(false), 500);
  };

  // Calculations for global overview
  const userVaults = vaults.filter(v => v.owner === publicKey);
  
  // Base collateral values: XLM = $0.12, USDC = $1.00
  const getCollateralPrice = (asset: 'XLM' | 'USDC') => asset === 'XLM' ? 0.12 : 1.00;

  const totalCollateralUSD = userVaults.reduce((acc, vault) => {
    return acc + (vault.collateralAmount * getCollateralPrice(vault.collateralAsset));
  }, 0);

  const totalDebtUSD = userVaults.reduce((acc, vault) => {
    const asset = assets.find(a => a.symbol === vault.syntheticAsset);
    return acc + (vault.mintedAmount * (asset?.price || 0));
  }, 0);

  const globalRatio = totalDebtUSD > 0 
    ? Math.round((totalCollateralUSD / totalDebtUSD) * 100)
    : 0;

  const getRatioColor = (ratio: number, minRatio: number) => {
    if (ratio === 0) return 'text-text-muted';
    if (ratio < minRatio) return 'text-accent-red';
    if (ratio < minRatio + 15) return 'text-accent-amber';
    if (ratio < minRatio + 40) return 'text-yellow-400';
    return 'text-accent-green';
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'Safe':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-green/10 text-accent-green border border-accent-green/20">Safe</span>;
      case 'Warning':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Warning</span>;
      case 'Danger':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-amber/10 text-accent-amber border border-accent-amber/20">Danger</span>;
      case 'Liquidatable':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-red/10 text-accent-red border border-accent-red/20 animate-pulse">Liquidatable</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-bg-surface text-text-muted border border-border-subtle">Empty</span>;
    }
  };

  // Draw sparkline using SVG
  const renderSparkline = (data: number[]) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const width = 100;
    const height = 30;
    const padding = 2;

    const points = data
      .map((val, index) => {
        const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
        const y =
          height -
          ((val - min) / (max - min || 1)) * (height - padding * 2) -
          padding;
        return `${x},${y}`;
      })
      .join(' ');

    const isUp = data[data.length - 1] >= data[0];

    return (
      <svg className="w-24 h-8" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={isUp ? '#22c55e' : '#ef4444'}
          strokeWidth="1.5"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Upper overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Collateral Card */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-cyan/5 rounded-full blur-2xl"></div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">Deposited Collateral</span>
          <h2 className="text-3xl font-extrabold text-text-primary mt-2">
            ${totalCollateralUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-text-muted mt-2">Combined value of XLM and USDC locked in vaults</p>
        </div>

        {/* Total Minted Debt Card */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-purple/5 rounded-full blur-2xl"></div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">Minted Synthetic Debt</span>
          <h2 className="text-3xl font-extrabold text-text-primary mt-2">
            ${totalDebtUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-text-muted mt-2">Total outstanding debt in sAssets</p>
        </div>

        {/* Global Collateral Ratio Card */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl"></div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">Health Ratio</span>
          <h2 className={`text-3xl font-extrabold mt-2 ${globalRatio > 0 ? getRatioColor(globalRatio, 150) : 'text-text-secondary'}`}>
            {globalRatio > 0 ? `${globalRatio}%` : 'N/A'}
          </h2>
          <p className="text-xs text-text-muted mt-2">Average backing multiplier of active debt</p>
        </div>
      </div>

      {/* Main sections: Vaults and Markets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Vaults Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-accent-purple" />
              <h3 className="text-lg font-bold text-text-primary">My Synthetic Vaults</h3>
            </div>
            <button
              onClick={onCreateVaultClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Vault</span>
            </button>
          </div>

          {userVaults.length === 0 ? (
            <div className="glass-panel rounded-2xl p-10 text-center border-dashed border-border-subtle flex flex-col items-center">
              <div className="p-4 bg-bg-surface rounded-full border border-border-subtle mb-4">
                <Settings2 className="h-8 w-8 text-text-muted" />
              </div>
              <h4 className="font-semibold text-text-secondary text-base">No Vaults Found</h4>
              <p className="text-text-muted text-xs mt-2 max-w-sm">
                Create a vault, deposit collateral, and mint synthetic assets tracking real-world values.
              </p>
              <button
                onClick={onCreateVaultClick}
                className="mt-5 px-4.5 py-2.5 bg-bg-surface hover:bg-bg-card-hover border border-border-subtle hover:border-border-default text-text-secondary hover:text-text-primary rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
              >
                Create Your First Vault
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userVaults.map(vault => {
                const asset = assets.find(a => a.symbol === vault.syntheticAsset);
                const minRatio = asset?.minCollateralRatio || 150;
                
                return (
                  <div key={vault.id} className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-l-2 border-l-accent-purple">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-bg-surface border border-border-subtle text-[10px] font-bold text-text-muted">
                          ID: {vault.id.toUpperCase()}
                        </span>
                        <h4 className="text-base font-bold text-text-primary mt-2 flex items-center gap-1.5">
                          {vault.syntheticAsset} Vault
                          <span className="text-xs font-medium text-text-muted">({asset?.name})</span>
                        </h4>
                      </div>
                      {getHealthBadge(vault.health)}
                    </div>

                    <div className="my-5 grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-text-muted tracking-wider">Collateral Locked</span>
                        <span className="block text-sm font-bold text-text-secondary mt-1">
                          {vault.collateralAmount.toLocaleString()} {vault.collateralAsset}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-text-muted tracking-wider">Minted Debt</span>
                        <span className="block text-sm font-bold text-text-secondary mt-1">
                          {vault.mintedAmount.toLocaleString()} {vault.syntheticAsset}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-border-subtle pt-4 flex items-center justify-between">
                      <div>
                        <span className="block text-[10px] text-text-muted font-medium">Collateral Ratio</span>
                        <span className={`text-sm font-bold ${getRatioColor(vault.collateralRatio, minRatio)}`}>
                          {vault.collateralRatio === Infinity ? '∞' : `${vault.collateralRatio}%`}
                        </span>
                        <span className="text-[10px] text-text-muted ml-1">(min {minRatio}%)</span>
                      </div>

                      <button
                        onClick={() => onManageVault(vault.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-bg-surface hover:bg-bg-card-hover border border-border-subtle hover:border-border-default text-text-secondary hover:text-text-primary rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        <span>Manage</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Markets panel */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent-cyan" />
              <h3 className="text-lg font-bold text-text-primary">Synth Asset Markets</h3>
            </div>
            
            {/* Oracle Ticker Manual Tick */}
            <button
              onClick={handlePriceRefresh}
              className="p-1.5 bg-bg-surface hover:bg-bg-card-hover border border-border-subtle hover:border-border-default rounded-xl text-text-muted hover:text-text-secondary transition-all duration-200 cursor-pointer"
              title="Force oracle price update"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${tickerLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden divide-y divide-border-subtle">
            {assets.map((asset) => {
              const isUp = asset.change24h >= 0;

              return (
                <div key={asset.symbol} className="p-4 flex items-center justify-between hover:bg-bg-card-hover/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary">{asset.symbol}</span>
                      <span className="px-1.5 py-0.5 rounded bg-bg-surface border border-border-subtle text-[9px] text-text-muted font-semibold uppercase">
                        {asset.type}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted mt-1 block">{asset.name}</span>
                  </div>

                  {/* Sparkline chart */}
                  <div className="hidden sm:block">
                    {renderSparkline(asset.sparklineData)}
                  </div>

                  <div className="text-right">
                    <span className="block text-sm font-bold text-text-secondary">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                    
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {isUp ? (
                        <TrendingUp className="h-3 w-3 text-accent-green" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-accent-red" />
                      )}
                      <span className={`text-[10px] font-bold ${isUp ? 'text-accent-green' : 'text-accent-red'}`}>
                        {isUp ? '+' : ''}{asset.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
