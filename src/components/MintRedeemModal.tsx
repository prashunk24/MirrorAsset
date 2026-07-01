import React, { useState } from 'react';
import { useStellar } from '../context/StellarContext';
import { X, ArrowDown, ArrowUp, AlertTriangle, ShieldCheck, Coins } from 'lucide-react';

interface MintRedeemModalProps {
  vaultId: string;
  onClose: () => void;
}

export const MintRedeemModal: React.FC<MintRedeemModalProps> = ({ vaultId, onClose }) => {
  const {
    vaults,
    assets,
    balanceXLM,
    balanceUSDC,
    balanceSynths,
    depositCollateral,
    withdrawCollateral,
    mintSynths,
    burnSynths,
    isLoading
  } = useStellar();

  const vault = vaults.find(v => v.id === vaultId);
  const asset = assets.find(a => a.symbol === vault?.syntheticAsset);

  // Tabs: 'collateral' or 'debt'
  const [activeTab, setActiveTab] = useState<'collateral' | 'debt'>('collateral');
  // Operations: 'deposit' | 'withdraw' OR 'mint' | 'burn'
  const [actionType, setActionType] = useState<'deposit' | 'withdraw' | 'mint' | 'burn'>('deposit');
  const [inputVal, setInputVal] = useState<string>('');

  if (!vault || !asset) return null;

  const collateralBalance = vault.collateralAsset === 'XLM' ? balanceXLM : balanceUSDC;
  const synthBalance = balanceSynths[vault.syntheticAsset] || 0;

  // Collateral calculations
  const collateralPrice = vault.collateralAsset === 'XLM' ? 0.12 : 1.00;
  const currentCollateralVal = vault.collateralAmount * collateralPrice;
  const currentDebtVal = vault.mintedAmount * asset.price;

  // Parse action amount
  const actionAmount = parseFloat(inputVal) || 0;

  // Predict future vault parameters
  let futureCollateralAmount = vault.collateralAmount;
  let futureMintedAmount = vault.mintedAmount;

  if (activeTab === 'collateral') {
    if (actionType === 'deposit') {
      futureCollateralAmount += actionAmount;
    } else if (actionType === 'withdraw') {
      futureCollateralAmount = Math.max(0, futureCollateralAmount - actionAmount);
    }
  } else {
    if (actionType === 'mint') {
      futureMintedAmount += actionAmount;
    } else if (actionType === 'burn') {
      futureMintedAmount = Math.max(0, futureMintedAmount - actionAmount);
    }
  }

  const futureCollVal = futureCollateralAmount * collateralPrice;
  const futureDebtVal = futureMintedAmount * asset.price;

  let futureRatio = 0;
  if (futureCollateralAmount === 0 && futureMintedAmount === 0) {
    futureRatio = 0;
  } else if (futureMintedAmount === 0) {
    futureRatio = Infinity;
  } else {
    futureRatio = Math.round((futureCollVal / futureDebtVal) * 100);
  }

  // Set action configurations
  const handleTabChange = (tab: 'collateral' | 'debt') => {
    setActiveTab(tab);
    setActionType(tab === 'collateral' ? 'deposit' : 'mint');
    setInputVal('');
  };

  const handleMaxClick = () => {
    if (activeTab === 'collateral') {
      if (actionType === 'deposit') {
        setInputVal(collateralBalance.toString());
      } else {
        // Leave enough to back the debt, or withdraw everything if debt is zero
        if (vault.mintedAmount === 0) {
          setInputVal(vault.collateralAmount.toString());
        } else {
          // Max withdraw = currentCollateral - (mintedValue * minRatio / 100) / collateralPrice
          const reqCollVal = (currentDebtVal * asset.minCollateralRatio) / 100;
          const maxWithdrawVal = currentCollateralVal - reqCollVal;
          const maxWithdraw = Math.max(0, maxWithdrawVal / collateralPrice);
          setInputVal(Number(maxWithdraw.toFixed(4)).toString());
        }
      }
    } else {
      if (actionType === 'mint') {
        // Max mint based on collateral ratio
        if (vault.collateralAmount === 0) {
          setInputVal('0');
        } else {
          // Max debt value = collateralVal / (minRatio / 100)
          const maxDebtVal = currentCollateralVal / (asset.minCollateralRatio / 100);
          const remainingDebtVal = Math.max(0, maxDebtVal - currentDebtVal);
          const maxMint = remainingDebtVal / asset.price;
          setInputVal(Number(maxMint.toFixed(4)).toString());
        }
      } else {
        // Max burn = minimum of vault debt and user wallet balance
        const maxBurn = Math.min(vault.mintedAmount, synthBalance);
        setInputVal(maxBurn.toString());
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actionAmount <= 0) return;

    let success = false;
    if (actionType === 'deposit') {
      success = await depositCollateral(vault.id, actionAmount);
    } else if (actionType === 'withdraw') {
      success = await withdrawCollateral(vault.id, actionAmount);
    } else if (actionType === 'mint') {
      success = await mintSynths(vault.id, actionAmount);
    } else if (actionType === 'burn') {
      success = await burnSynths(vault.id, actionAmount);
    }

    if (success) {
      setInputVal('');
      // Keep modal open or close? Let user see success update first, then they can close
    }
  };

  // Health bar helper
  const getRatioStatus = (ratio: number, minRatio: number) => {
    if (ratio === 0 || ratio === Infinity) return { text: 'N/A', color: 'text-gray-500', barColor: 'bg-gray-800' };
    if (ratio < minRatio) return { text: 'Liquidatable', color: 'text-rose-500', barColor: 'bg-rose-500' };
    if (ratio < minRatio + 15) return { text: 'High Risk (Danger)', color: 'text-amber-500', barColor: 'bg-amber-500' };
    if (ratio < minRatio + 40) return { text: 'Moderate Risk', color: 'text-yellow-400', barColor: 'bg-yellow-400' };
    return { text: 'Healthy (Safe)', color: 'text-emerald-400', barColor: 'bg-emerald-500' };
  };

  const currentStatus = getRatioStatus(vault.collateralRatio, asset.minCollateralRatio);
  const futureStatus = getRatioStatus(futureRatio, asset.minCollateralRatio);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-dark/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-bg-card shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow header */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-accent-purple to-accent-cyan"></div>

        {/* Modal Header */}
        <div className="p-6 border-b border-gray-900 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <span>Manage {vault.syntheticAsset} Vault</span>
              <span className="text-xs px-2 py-0.5 bg-gray-900 border border-gray-800 rounded-md text-gray-500 font-normal">
                {vault.collateralAsset} collateral
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">Oracle Price: ${asset.price.toLocaleString()} per sAsset</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-900/60 border border-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-900/60">
          <button
            onClick={() => handleTabChange('collateral')}
            className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'collateral'
                ? 'border-accent-purple text-accent-purple bg-accent-purple/5'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-900/20'
            }`}
          >
            Collateral
          </button>
          <button
            onClick={() => handleTabChange('debt')}
            className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'debt'
                ? 'border-accent-cyan text-accent-cyan bg-accent-cyan/5'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-900/20'
            }`}
          >
            Synthetic Debt
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 flex-grow overflow-y-auto space-y-5">
          {/* Sub-tab Deposit / Withdraw selectors */}
          <div className="flex gap-2 p-1 bg-gray-950/60 rounded-xl border border-gray-900">
            {activeTab === 'collateral' ? (
              <>
                <button
                  type="button"
                  onClick={() => { setActionType('deposit'); setInputVal(''); }}
                  className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg transition-colors ${
                    actionType === 'deposit' ? 'bg-gray-900 border border-gray-800 text-gray-100' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Deposit</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActionType('withdraw'); setInputVal(''); }}
                  className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg transition-colors ${
                    actionType === 'withdraw' ? 'bg-gray-900 border border-gray-800 text-gray-100' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <ArrowUp className="h-3.5 w-3.5 text-rose-400" />
                  <span>Withdraw</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setActionType('mint'); setInputVal(''); }}
                  className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg transition-colors ${
                    actionType === 'mint' ? 'bg-gray-900 border border-gray-800 text-gray-100' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Coins className="h-3.5 w-3.5 text-accent-cyan" />
                  <span>Mint Debt</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActionType('burn'); setInputVal(''); }}
                  className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg transition-colors ${
                    actionType === 'burn' ? 'bg-gray-900 border border-gray-800 text-gray-100' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <X className="h-3.5 w-3.5 text-gray-400" />
                  <span>Burn Debt</span>
                </button>
              </>
            )}
          </div>

          {/* Form Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-gray-400 font-semibold uppercase">Amount to {actionType}</label>
              <span className="text-gray-500 flex items-center gap-1 font-medium">
                Wallet Balance:{' '}
                <strong className="text-gray-300">
                  {actionType === 'deposit'
                    ? `${collateralBalance.toLocaleString()} ${vault.collateralAsset}`
                    : actionType === 'withdraw'
                    ? `${vault.collateralAmount.toLocaleString()} ${vault.collateralAsset}`
                    : actionType === 'mint'
                    ? 'N/A' // Mint limit depends on collateral ratio
                    : `${synthBalance.toLocaleString()} ${vault.syntheticAsset}`}
                </strong>
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                required
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-950/60 border border-gray-800/80 rounded-xl py-3 px-4 text-white text-base focus:border-accent-purple focus:outline-none transition-all font-mono"
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

          {/* Collateral health visualizer slider */}
          <div className="bg-gray-950/40 border border-gray-900 rounded-xl p-4.5 space-y-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Position Health Visualizer</h4>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 text-xs font-medium border-b border-gray-900/60 pb-3">
              <div>
                <span className="text-gray-500">Current Health Ratio</span>
                <span className={`block font-bold text-sm mt-0.5 ${currentStatus.color}`}>
                  {vault.collateralRatio === Infinity ? '∞ (No Debt)' : `${vault.collateralRatio}%`}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Projected Health Ratio</span>
                <span className={`block font-bold text-sm mt-0.5 ${futureStatus.color}`}>
                  {futureRatio === Infinity ? '∞ (No Debt)' : `${futureRatio}%`}
                </span>
              </div>
            </div>

            {/* Health Bar Slide */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-gray-500 font-semibold uppercase">
                <span>Liquidation ({asset.minCollateralRatio}%)</span>
                <span>Target Safe (&gt; 200%)</span>
              </div>
              <div className="h-3.5 bg-gray-900 rounded-full overflow-hidden flex relative border border-gray-800">
                {/* Liquidation range marker */}
                <div
                  className="h-full bg-rose-500/20 border-r border-rose-500/40 absolute top-0 left-0"
                  style={{ width: `${(asset.minCollateralRatio / 300) * 100}%` }}
                ></div>

                {/* Progress bar representing future ratio */}
                {futureRatio > 0 && futureRatio !== Infinity && (
                  <div
                    className={`h-full transition-all duration-300 ${futureStatus.barColor}`}
                    style={{ width: `${Math.min(100, (futureRatio / 300) * 100)}%` }}
                  ></div>
                )}
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                <span>0%</span>
                <span>150%</span>
                <span>300%+</span>
              </div>
            </div>

            {/* Danger alerts */}
            {futureRatio > 0 && futureRatio < asset.minCollateralRatio && (
              <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 text-xs leading-relaxed animate-pulse">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Liquidation Warning:</strong> This operation drops your collateral ratio below the minimum {asset.minCollateralRatio}%. The vault will immediately become liquidatable.
                </span>
              </div>
            )}

            {futureRatio >= asset.minCollateralRatio && futureRatio < asset.minCollateralRatio + 20 && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl p-3 text-xs leading-relaxed">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Risky position:</strong> Collateral ratio is very close to the liquidation threshold. A slight drop in collateral price or rise in synthetic price could trigger liquidation.
                </span>
              </div>
            )}

            {futureRatio >= asset.minCollateralRatio + 40 && (
              <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl p-3 text-xs leading-relaxed">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  Your vault remains in the safe zone. This is a secure configuration.
                </span>
              </div>
            )}
          </div>

          {/* Form Action */}
          <button
            type="submit"
            disabled={isLoading || actionAmount <= 0 || (actionType === 'withdraw' && futureRatio < asset.minCollateralRatio && vault.mintedAmount > 0) || (actionType === 'mint' && futureRatio < asset.minCollateralRatio)}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-accent-purple to-violet-600 hover:from-accent-purple hover:to-violet-700 shadow-lg shadow-accent-purple/10 hover:shadow-accent-purple/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span>Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
