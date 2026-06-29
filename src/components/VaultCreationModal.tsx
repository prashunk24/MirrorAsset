import React, { useState } from 'react';
import { useStellar } from '../context/StellarContext';
import { X, Layers, AlertCircle } from 'lucide-react';

interface VaultCreationModalProps {
  onClose: () => void;
  onSuccess: (vaultId: string) => void;
}

export const VaultCreationModal: React.FC<VaultCreationModalProps> = ({ onClose, onSuccess }) => {
  const { assets, createVault, isLoading } = useStellar();
  
  const [collateralAsset, setCollateralAsset] = useState<'XLM' | 'USDC'>('USDC');
  const [syntheticAsset, setSyntheticAsset] = useState<string>(assets[0]?.symbol || 'sXAU');

  const activeAsset = assets.find(a => a.symbol === syntheticAsset);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vaultId = await createVault(collateralAsset, syntheticAsset);
    if (vaultId) {
      onSuccess(vaultId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-dark/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-bg-card shadow-2xl relative overflow-hidden flex flex-col">
        {/* Glow Top */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-accent-purple to-accent-cyan"></div>

        {/* Modal Header */}
        <div className="p-6 border-b border-gray-900 flex justify-between items-center">
          <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-accent-purple" />
            <span>Create Synthetic Vault</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-900/60 border border-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Collateral Option */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">1. Select Collateral Asset</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCollateralAsset('USDC')}
                className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  collateralAsset === 'USDC'
                    ? 'border-accent-purple bg-accent-purple/5 text-white'
                    : 'border-gray-800 bg-gray-950/20 text-gray-400 hover:border-gray-700'
                }`}
              >
                <span className="text-base">USDC</span>
                <span className="text-[10px] text-gray-500 font-medium">USD Stablecoin</span>
              </button>
              <button
                type="button"
                onClick={() => setCollateralAsset('XLM')}
                className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  collateralAsset === 'XLM'
                    ? 'border-accent-purple bg-accent-purple/5 text-white'
                    : 'border-gray-800 bg-gray-950/20 text-gray-400 hover:border-gray-700'
                }`}
              >
                <span className="text-base">XLM</span>
                <span className="text-[10px] text-gray-500 font-medium">Stellar Native Lumens</span>
              </button>
            </div>
          </div>

          {/* Synthetic Asset Option */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">2. Select Synthetic Asset to Mint</label>
            <select
              value={syntheticAsset}
              onChange={(e) => setSyntheticAsset(e.target.value)}
              className="w-full bg-gray-950/60 border border-gray-800 rounded-xl py-3 px-4 text-white text-sm focus:border-accent-purple focus:outline-none transition-all cursor-pointer font-semibold"
            >
              {assets.map(a => (
                <option key={a.symbol} value={a.symbol}>
                  {a.symbol} ({a.name}) - Price: ${a.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Safety specifications summary */}
          {activeAsset && (
            <div className="bg-gray-950/40 border border-gray-900 rounded-xl p-4.5 space-y-2.5 text-xs font-medium">
              <div className="flex justify-between">
                <span className="text-gray-500">Minimum Collateral Ratio</span>
                <span className="text-gray-300 font-bold">{activeAsset.minCollateralRatio}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Liquidation Penalty</span>
                <span className="text-rose-400 font-bold">10% Discount</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Price Feed Feed Oracle</span>
                <span className="text-accent-cyan font-bold">Stellar Oracle Aggregator</span>
              </div>
            </div>
          )}

          {/* Advice alert */}
          <div className="flex items-start gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl p-3 text-[11px] leading-relaxed">
            <AlertCircle className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
            <span>
              Each vault isolates collateral and synthetic debt. You can create one vault per synthetic asset backed by each collateral type.
            </span>
          </div>

          {/* Execute button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-accent-purple to-violet-600 hover:from-accent-purple hover:to-violet-700 shadow-lg shadow-accent-purple/10 hover:shadow-accent-purple/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span>Initialize & Open Vault</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
