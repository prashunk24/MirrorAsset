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

  const collateralOptions: { id: 'USDC' | 'XLM'; label: string; sub: string }[] = [
    { id: 'USDC', label: 'USDC', sub: 'USD Stablecoin' },
    { id: 'XLM',  label: 'XLM',  sub: 'Stellar Lumens' },
  ];

  return (
    /* ── Overlay ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)' }}
    >
      {/* ── Modal body ── */}
      <div
        className="w-full max-w-lg rounded-2xl relative overflow-hidden flex flex-col"
        style={{
          background: '#0f1522',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 0 50px rgba(124,58,237,0.20), 0 24px 64px rgba(0,0,0,0.70)',
        }}
      >
        {/* ── Gradient accent top bar ── */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500" />

        {/* ── Header ── */}
        <div
          className="px-6 pt-7 pb-5 flex justify-between items-center"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h3 className="text-base font-bold text-white flex items-center gap-2.5">
            <div
              className="p-1.5 rounded-lg"
              style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.30)' }}
            >
              <Layers className="h-4 w-4 text-violet-400" />
            </div>
            Create Synthetic Vault
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* 1. Collateral selection */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
              1. Select Collateral Asset
            </label>
            <div className="grid grid-cols-2 gap-3">
              {collateralOptions.map(opt => {
                const active = collateralAsset === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCollateralAsset(opt.id)}
                    className="py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex flex-col items-center gap-1 cursor-pointer"
                    style={
                      active
                        ? {
                            background: 'rgba(6,182,212,0.10)',
                            border: '1px solid rgba(6,182,212,0.55)',
                            boxShadow: '0 0 12px rgba(6,182,212,0.20)',
                            color: '#fff',
                          }
                        : {
                            background: 'rgba(15,20,35,0.80)',
                            border: '1px solid rgba(255,255,255,0.09)',
                            color: 'rgba(148,163,184,1)',
                          }
                    }
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.border = '1px solid rgba(139,92,246,0.45)';
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.09)';
                    }}
                  >
                    <span className="text-base">{opt.label}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{opt.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Synthetic asset selection */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
              2. Select Synthetic Asset to Mint
            </label>
            <select
              value={syntheticAsset}
              onChange={e => setSyntheticAsset(e.target.value)}
              className="w-full rounded-xl py-3 px-4 text-white text-sm focus:outline-none transition-all cursor-pointer font-semibold"
              style={{
                background: 'rgba(15,20,35,0.90)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
              onFocus={e => {
                (e.currentTarget as HTMLElement).style.border = '1px solid rgba(139,92,246,0.60)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)';
              }}
              onBlur={e => {
                (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.09)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              {assets.map(a => (
                <option key={a.symbol} value={a.symbol} style={{ background: '#0f1522' }}>
                  {a.symbol} ({a.name}) — ${a.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Safety specs summary */}
          {activeAsset && (
            <div
              className="rounded-xl p-4 space-y-2.5 text-xs font-medium"
              style={{ background: 'rgba(15,20,35,0.70)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex justify-between">
                <span className="text-slate-500">Minimum Collateral Ratio</span>
                <span className="text-slate-200 font-bold">{activeAsset.minCollateralRatio}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Liquidation Penalty</span>
                <span className="text-rose-400 font-bold">10% Discount</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Price Feed Oracle</span>
                <span className="text-cyan-400 font-bold">Stellar Oracle Aggregator</span>
              </div>
            </div>
          )}

          {/* Info alert */}
          <div
            className="flex items-start gap-2.5 rounded-xl p-3 text-[11px] leading-relaxed text-indigo-300"
            style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.20)' }}
          >
            <AlertCircle className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-px" />
            <span>
              Each vault isolates collateral and synthetic debt. You can create one vault per synthetic
              asset backed by each collateral type.
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(to right, #4f46e5, #7c3aed, #06b6d4)',
              boxShadow: '0 0 20px rgba(124,58,237,0.35)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.opacity = '0.90';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.opacity = '1';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            {isLoading
              ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span>Initialize &amp; Open Vault</span>
            }
          </button>
        </form>
      </div>
    </div>
  );
};
