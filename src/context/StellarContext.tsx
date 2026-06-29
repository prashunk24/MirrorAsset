import React, { createContext, useContext, useState, useEffect } from 'react';
import { isConnected, getAddress } from '@stellar/freighter-api';
import type { Asset, Vault, Transaction, ToastMessage, VaultHealth, TransactionType } from '../types';

interface StellarContextType {
  walletConnected: boolean;
  publicKey: string | null;
  balanceXLM: number;
  balanceUSDC: number;
  balanceSynths: { [symbol: string]: number };
  assets: Asset[];
  vaults: Vault[];
  transactions: Transaction[];
  toasts: ToastMessage[];
  isLoading: boolean;
  simulationMode: boolean;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  claimFaucet: () => void;
  depositCollateral: (vaultId: string, amount: number) => Promise<boolean>;
  withdrawCollateral: (vaultId: string, amount: number) => Promise<boolean>;
  mintSynths: (vaultId: string, amount: number) => Promise<boolean>;
  burnSynths: (vaultId: string, amount: number) => Promise<boolean>;
  redeemSynths: (symbol: string, amount: number) => Promise<boolean>;
  liquidateVault: (vaultId: string, amount: number) => Promise<boolean>;
  addToast: (type: 'success' | 'error' | 'info', title: string, description: string) => void;
  removeToast: (id: string) => void;
  createVault: (collateralAsset: 'XLM' | 'USDC', syntheticAsset: string) => Promise<string | null>;
  triggerPriceTick: () => void;
}

const StellarContext = createContext<StellarContextType | undefined>(undefined);

// Initial mock assets
const INITIAL_ASSETS: Asset[] = [
  {
    symbol: 'sXAU',
    name: 'Synthetic Gold',
    price: 2342.65,
    change24h: 0.85,
    type: 'Commodity',
    collateralAsset: 'USDC',
    minCollateralRatio: 150,
    sparklineData: [2320, 2325, 2318, 2330, 2335, 2339, 2342.65],
  },
  {
    symbol: 'sAAPL',
    name: 'Synthetic Apple Inc.',
    price: 181.45,
    change24h: -1.24,
    type: 'Equity',
    collateralAsset: 'USDC',
    minCollateralRatio: 160,
    sparklineData: [184, 183.5, 182, 180.8, 181.1, 180.2, 181.45],
  },
  {
    symbol: 'sEUR',
    name: 'Synthetic Euro',
    price: 1.0854,
    change24h: 0.12,
    type: 'Forex',
    collateralAsset: 'XLM',
    minCollateralRatio: 130,
    sparklineData: [1.083, 1.084, 1.0835, 1.0842, 1.0848, 1.0851, 1.0854],
  },
  {
    symbol: 'sTSLA',
    name: 'Synthetic Tesla Inc.',
    price: 177.80,
    change24h: 4.62,
    type: 'Equity',
    collateralAsset: 'USDC',
    minCollateralRatio: 180,
    sparklineData: [168, 170, 172.5, 171, 174.2, 176, 177.8],
  },
  {
    symbol: 'sSLV',
    name: 'Synthetic Silver',
    price: 29.35,
    change24h: -0.45,
    type: 'Commodity',
    collateralAsset: 'XLM',
    minCollateralRatio: 150,
    sparklineData: [29.6, 29.5, 29.3, 29.42, 29.25, 29.5, 29.35],
  }
];

export const StellarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balanceXLM, setBalanceXLM] = useState<number>(1000);
  const [balanceUSDC, setBalanceUSDC] = useState<number>(5000);
  const [balanceSynths, setBalanceSynths] = useState<{ [symbol: string]: number }>({
    sXAU: 0,
    sAAPL: 0,
    sEUR: 0,
    sTSLA: 0,
    sSLV: 0,
  });
  
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('mirror_assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });

  const [vaults, setVaults] = useState<Vault[]>(() => {
    const saved = localStorage.getItem('mirror_vaults');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('mirror_txs');
    return saved ? JSON.parse(saved) : [];
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [simulationMode, setSimulationMode] = useState<boolean>(true);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('mirror_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('mirror_vaults', JSON.stringify(vaults));
  }, [vaults]);

  useEffect(() => {
    localStorage.setItem('mirror_txs', JSON.stringify(transactions));
  }, [transactions]);

  // Simulate real-time price updates (oracle ticks)
  useEffect(() => {
    const interval = setInterval(() => {
      triggerPriceTick();
    }, 12000); // every 12 seconds

    return () => clearInterval(interval);
  }, []);

  const triggerPriceTick = () => {
    setAssets(prevAssets => {
      const updated = prevAssets.map(asset => {
        // -1.5% to +1.5% random change
        const changePercent = (Math.random() * 3 - 1.5) / 100;
        const newPrice = Math.max(0.0001, asset.price * (1 + changePercent));
        const updatedSparkline = [...asset.sparklineData.slice(1), newPrice];
        const change24h = asset.change24h + (changePercent * 100);
        return {
          ...asset,
          price: Number(newPrice.toFixed(4)),
          change24h: Number(change24h.toFixed(2)),
          sparklineData: updatedSparkline
        };
      });
      return updated;
    });
  };

  // Recalculate vault ratios and healths when asset prices change
  useEffect(() => {
    setVaults(prevVaults => {
      let changed = false;
      const updated = prevVaults.map(vault => {
        const asset = assets.find(a => a.symbol === vault.syntheticAsset);
        if (!asset) return vault;

        const collateralPrice = vault.collateralAsset === 'XLM' ? 0.12 : 1.00; // Mock base collateral prices: XLM = $0.12, USDC = $1.00
        const collVal = vault.collateralAmount * collateralPrice;
        const debtVal = vault.mintedAmount * asset.price;

        let ratio = 0;
        let health: VaultHealth = 'Empty';

        if (vault.collateralAmount === 0 && vault.mintedAmount === 0) {
          ratio = 0;
          health = 'Empty';
        } else if (vault.mintedAmount === 0) {
          ratio = Infinity;
          health = 'Safe';
        } else {
          ratio = Math.round((collVal / debtVal) * 100);
          
          if (ratio < asset.minCollateralRatio) {
            health = 'Liquidatable';
          } else if (ratio < asset.minCollateralRatio + 15) {
            health = 'Danger';
          } else if (ratio < asset.minCollateralRatio + 40) {
            health = 'Warning';
          } else {
            health = 'Safe';
          }
        }

        if (vault.collateralRatio !== ratio || vault.health !== health) {
          changed = true;
          return { ...vault, collateralRatio: ratio, health };
        }
        return vault;
      });

      return changed ? updated : prevVaults;
    });
  }, [assets]);

  // Toast utilities
  const addToast = (type: 'success' | 'error' | 'info', title: string, description: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, description }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Add transaction to history
  const addTransaction = (type: TransactionType, details: string, status: 'success' | 'failed' | 'loading' = 'success') => {
    const hash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newTx: Transaction = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      timestamp: Date.now(),
      status,
      details,
      hash
    };
    setTransactions(prev => [newTx, ...prev]);
    return newTx.id;
  };

  const updateTransactionStatus = (id: string, status: 'success' | 'failed') => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, status } : tx));
  };

  // Wallet Actions
  const connectWallet = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // 1. Check if Freighter is installed and connected
      const freighterInstalled = await isConnected();
      
      if (freighterInstalled && freighterInstalled.isConnected) {
        const addressInfo = await getAddress();
        const pk = addressInfo.address;
        if (pk) {
          setPublicKey(pk);
          setWalletConnected(true);
          setSimulationMode(false);
          addToast('success', 'Wallet Connected', `Freighter active with address ${pk.substring(0, 6)}...${pk.substring(pk.length - 4)}`);
          setIsLoading(false);
          return true;
        }
      }
      
      // Fallback: Connection in simulated mode
      const mockAddress = 'GBMIRROR...ASSET';
      setPublicKey(mockAddress);
      setWalletConnected(true);
      setSimulationMode(true);
      addToast('info', 'Simulated Wallet Connected', 'Freighter extension not found. Running in Simulated Ledger mode.');
      setIsLoading(false);
      return true;

    } catch (error: any) {
      console.error("Wallet connection error:", error);
      addToast('error', 'Connection Failed', error.message || 'Unknown error');
      setIsLoading(false);
      return false;
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setPublicKey(null);
    addToast('info', 'Wallet Disconnected', 'Logged out of Stellar network session.');
  };

  const claimFaucet = () => {
    setBalanceXLM(prev => prev + 500);
    setBalanceUSDC(prev => prev + 1000);
    addTransaction('Faucet', 'Received 500 XLM and 1,000 USDC from Testnet Faucet');
    addToast('success', 'Faucet Claimed', 'Credited 500 XLM and 1,000 USDC to your account.');
  };

  // Vault Actions
  const createVault = async (collateralAsset: 'XLM' | 'USDC', syntheticAsset: string): Promise<string | null> => {
    if (!walletConnected) {
      addToast('error', 'Auth Error', 'Connect wallet to create a vault.');
      return null;
    }

    setIsLoading(true);
    const txId = addTransaction('Deposit', `Creating new ${syntheticAsset} Vault with ${collateralAsset} collateral`, 'loading');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const existing = vaults.find(v => v.collateralAsset === collateralAsset && v.syntheticAsset === syntheticAsset && v.owner === publicKey);
    if (existing) {
      updateTransactionStatus(txId, 'failed');
      addToast('error', 'Vault Exists', `You already have a vault for ${syntheticAsset} backed by ${collateralAsset}.`);
      setIsLoading(false);
      return null;
    }

    const newVault: Vault = {
      id: Math.random().toString(36).substring(2, 9),
      owner: publicKey || 'SimulatedUser',
      collateralAsset,
      collateralAmount: 0,
      syntheticAsset,
      mintedAmount: 0,
      collateralRatio: 0,
      health: 'Empty'
    };

    setVaults(prev => [...prev, newVault]);
    updateTransactionStatus(txId, 'success');
    addToast('success', 'Vault Created', `Successfully initialized a vault for ${syntheticAsset}.`);
    setIsLoading(false);
    return newVault.id;
  };

  const depositCollateral = async (vaultId: string, amount: number): Promise<boolean> => {
    if (amount <= 0) return false;
    setIsLoading(true);
    const vault = vaults.find(v => v.id === vaultId);
    if (!vault) {
      addToast('error', 'Vault Not Found', 'The requested vault does not exist.');
      setIsLoading(false);
      return false;
    }

    const isXLM = vault.collateralAsset === 'XLM';
    const currentBalance = isXLM ? balanceXLM : balanceUSDC;

    if (currentBalance < amount) {
      addToast('error', 'Insufficient Funds', `You need at least ${amount} ${vault.collateralAsset} to complete this deposit.`);
      setIsLoading(false);
      return false;
    }

    const txId = addTransaction('Deposit', `Deposited ${amount} ${vault.collateralAsset} collateral`, 'loading');
    await new Promise(resolve => setTimeout(resolve, 1200));

    if (isXLM) {
      setBalanceXLM(prev => prev - amount);
    } else {
      setBalanceUSDC(prev => prev - amount);
    }

    setVaults(prev => prev.map(v => {
      if (v.id === vaultId) {
        return { ...v, collateralAmount: v.collateralAmount + amount };
      }
      return v;
    }));

    updateTransactionStatus(txId, 'success');
    addToast('success', 'Collateral Deposited', `Successfully deposited ${amount} ${vault.collateralAsset}.`);
    setIsLoading(false);
    return true;
  };

  const withdrawCollateral = async (vaultId: string, amount: number): Promise<boolean> => {
    if (amount <= 0) return false;
    setIsLoading(true);
    const vault = vaults.find(v => v.id === vaultId);
    if (!vault) {
      addToast('error', 'Vault Not Found', 'The requested vault does not exist.');
      setIsLoading(false);
      return false;
    }

    if (vault.collateralAmount < amount) {
      addToast('error', 'Insufficient Collateral', `This vault only holds ${vault.collateralAmount} ${vault.collateralAsset}.`);
      setIsLoading(false);
      return false;
    }

    // Verify collateralization health after withdrawal
    const asset = assets.find(a => a.symbol === vault.syntheticAsset);
    if (!asset) {
      setIsLoading(false);
      return false;
    }

    const collateralPrice = vault.collateralAsset === 'XLM' ? 0.12 : 1.00;
    const remainingCollateralVal = (vault.collateralAmount - amount) * collateralPrice;
    const debtVal = vault.mintedAmount * asset.price;

    if (vault.mintedAmount > 0) {
      const futureRatio = (remainingCollateralVal / debtVal) * 100;
      if (futureRatio < asset.minCollateralRatio) {
        addToast('error', 'Liquidation Risk', `Withdrawing this much would drop your ratio to ${futureRatio.toFixed(0)}%, which is below the minimum ${asset.minCollateralRatio}%.`);
        setIsLoading(false);
        return false;
      }
    }

    const txId = addTransaction('Withdraw', `Withdrew ${amount} ${vault.collateralAsset} collateral`, 'loading');
    await new Promise(resolve => setTimeout(resolve, 1200));

    if (vault.collateralAsset === 'XLM') {
      setBalanceXLM(prev => prev + amount);
    } else {
      setBalanceUSDC(prev => prev + amount);
    }

    setVaults(prev => prev.map(v => {
      if (v.id === vaultId) {
        return { ...v, collateralAmount: v.collateralAmount - amount };
      }
      return v;
    }));

    updateTransactionStatus(txId, 'success');
    addToast('success', 'Collateral Withdrawn', `Successfully withdrew ${amount} ${vault.collateralAsset}.`);
    setIsLoading(false);
    return true;
  };

  const mintSynths = async (vaultId: string, amount: number): Promise<boolean> => {
    if (amount <= 0) return false;
    setIsLoading(true);
    const vault = vaults.find(v => v.id === vaultId);
    const asset = assets.find(a => a.symbol === vault?.syntheticAsset);
    if (!vault || !asset) {
      addToast('error', 'Vault/Asset Not Found', 'State retrieval failed.');
      setIsLoading(false);
      return false;
    }

    // Check if collateralization ratio holds after minting
    const collateralPrice = vault.collateralAsset === 'XLM' ? 0.12 : 1.00;
    const collVal = vault.collateralAmount * collateralPrice;
    const futureDebtVal = (vault.mintedAmount + amount) * asset.price;

    if (futureDebtVal > 0) {
      const futureRatio = (collVal / futureDebtVal) * 100;
      if (futureRatio < asset.minCollateralRatio) {
        addToast('error', 'Collateral Shortage', `Cannot mint. Collateral ratio would fall to ${futureRatio.toFixed(0)}% (minimum is ${asset.minCollateralRatio}%). Deposit more collateral first.`);
        setIsLoading(false);
        return false;
      }
    }

    const txId = addTransaction('Mint', `Minted ${amount} ${vault.syntheticAsset}`, 'loading');
    await new Promise(resolve => setTimeout(resolve, 1500));

    setBalanceSynths(prev => ({
      ...prev,
      [vault.syntheticAsset]: (prev[vault.syntheticAsset] || 0) + amount
    }));

    setVaults(prev => prev.map(v => {
      if (v.id === vaultId) {
        return { ...v, mintedAmount: v.mintedAmount + amount };
      }
      return v;
    }));

    updateTransactionStatus(txId, 'success');
    addToast('success', 'Tokens Minted', `Successfully minted ${amount} ${vault.syntheticAsset}.`);
    setIsLoading(false);
    return true;
  };

  const burnSynths = async (vaultId: string, amount: number): Promise<boolean> => {
    if (amount <= 0) return false;
    setIsLoading(true);
    const vault = vaults.find(v => v.id === vaultId);
    if (!vault) {
      addToast('error', 'Vault Not Found', 'Internal reference error.');
      setIsLoading(false);
      return false;
    }

    const userSynthBalance = balanceSynths[vault.syntheticAsset] || 0;
    if (userSynthBalance < amount) {
      addToast('error', 'Insufficient Synthetic Tokens', `You only hold ${userSynthBalance} ${vault.syntheticAsset} in your wallet.`);
      setIsLoading(false);
      return false;
    }

    if (vault.mintedAmount < amount) {
      addToast('error', 'Excess Burn Amount', `You are attempting to burn more tokens (${amount}) than this vault owes (${vault.mintedAmount}).`);
      setIsLoading(false);
      return false;
    }

    const txId = addTransaction('Burn', `Burned ${amount} ${vault.syntheticAsset}`, 'loading');
    await new Promise(resolve => setTimeout(resolve, 1200));

    setBalanceSynths(prev => ({
      ...prev,
      [vault.syntheticAsset]: Math.max(0, prev[vault.syntheticAsset] - amount)
    }));

    setVaults(prev => prev.map(v => {
      if (v.id === vaultId) {
        return { ...v, mintedAmount: v.mintedAmount - amount };
      }
      return v;
    }));

    updateTransactionStatus(txId, 'success');
    addToast('success', 'Tokens Burned', `Successfully burned ${amount} ${vault.syntheticAsset} to lower your debt.`);
    setIsLoading(false);
    return true;
  };

  // Direct Redemption: Swap synthetic asset directly for collateral at current oracle price
  const redeemSynths = async (symbol: string, amount: number): Promise<boolean> => {
    if (amount <= 0) return false;
    setIsLoading(true);
    const asset = assets.find(a => a.symbol === symbol);
    if (!asset) {
      addToast('error', 'Asset Not Found', 'Reference error.');
      setIsLoading(false);
      return false;
    }

    const userBalance = balanceSynths[symbol] || 0;
    if (userBalance < amount) {
      addToast('error', 'Insufficient Funds', `You only have ${userBalance} ${symbol} in your wallet.`);
      setIsLoading(false);
      return false;
    }

    const txId = addTransaction('Redeem', `Redeemed ${amount} ${symbol} for ${asset.collateralAsset}`, 'loading');
    await new Promise(resolve => setTimeout(resolve, 1600));

    // Calculations
    const synthUSDVal = amount * asset.price;
    const feePercent = 0.005; // 0.5% fee
    const feeVal = synthUSDVal * feePercent;
    const redeemableUSD = synthUSDVal - feeVal;

    const collateralPrice = asset.collateralAsset === 'XLM' ? 0.12 : 1.00;
    const collateralOut = Number((redeemableUSD / collateralPrice).toFixed(4));

    // Update balances
    setBalanceSynths(prev => ({
      ...prev,
      [symbol]: prev[symbol] - amount
    }));

    if (asset.collateralAsset === 'XLM') {
      setBalanceXLM(prev => prev + collateralOut);
    } else {
      setBalanceUSDC(prev => prev + collateralOut);
    }

    updateTransactionStatus(txId, 'success');
    addToast('success', 'Redemption Success', `Swapped ${amount} ${symbol} for ${collateralOut} ${asset.collateralAsset} (includes 0.5% protocol fee).`);
    setIsLoading(false);
    return true;
  };

  // Liquidation: Liquidate a vault that fell below minimum collateral ratio
  const liquidateVault = async (vaultId: string, debtToCover: number): Promise<boolean> => {
    if (debtToCover <= 0) return false;
    setIsLoading(true);
    const vault = vaults.find(v => v.id === vaultId);
    const asset = assets.find(a => a.symbol === vault?.syntheticAsset);
    if (!vault || !asset) {
      addToast('error', 'Vault/Asset Not Found', 'Reference error.');
      setIsLoading(false);
      return false;
    }

    if (vault.health !== 'Liquidatable') {
      addToast('error', 'Vault Healthy', 'Cannot liquidate a vault that is above the minimum collateralization threshold.');
      setIsLoading(false);
      return false;
    }

    const userSynthBalance = balanceSynths[vault.syntheticAsset] || 0;
    if (userSynthBalance < debtToCover) {
      addToast('error', 'Insufficient Tokens', `You need ${debtToCover} ${vault.syntheticAsset} to perform this liquidation, but you only hold ${userSynthBalance}.`);
      setIsLoading(false);
      return false;
    }

    const limitDebtCover = Math.min(debtToCover, vault.mintedAmount);
    const txId = addTransaction('Liquidate', `Liquidating ${limitDebtCover} debt from vault ${vaultId.substring(0, 4)}...`, 'loading');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Calculate value: liquidator covers debt, gets equivalent collateral + 10% bonus
    const debtValUSD = limitDebtCover * asset.price;
    const bonusMultiplier = 1.10; // 10% bonus
    const collateralValueToGet = debtValUSD * bonusMultiplier;

    const collateralPrice = vault.collateralAsset === 'XLM' ? 0.12 : 1.00;
    let collateralToGet = collateralValueToGet / collateralPrice;

    // Cap at vault's actual collateral
    if (collateralToGet > vault.collateralAmount) {
      collateralToGet = vault.collateralAmount;
    }

    collateralToGet = Number(collateralToGet.toFixed(4));

    // Execute state changes
    setBalanceSynths(prev => ({
      ...prev,
      [vault.syntheticAsset]: prev[vault.syntheticAsset] - limitDebtCover
    }));

    if (vault.collateralAsset === 'XLM') {
      setBalanceXLM(prev => prev + collateralToGet);
    } else {
      setBalanceUSDC(prev => prev + collateralToGet);
    }

    setVaults(prev => prev.map(v => {
      if (v.id === vaultId) {
        return {
          ...v,
          collateralAmount: Math.max(0, v.collateralAmount - collateralToGet),
          mintedAmount: Math.max(0, v.mintedAmount - limitDebtCover)
        };
      }
      return v;
    }));

    updateTransactionStatus(txId, 'success');
    addToast('success', 'Liquidation Successful', `Seized ${collateralToGet} ${vault.collateralAsset} by burning ${limitDebtCover} ${vault.syntheticAsset} (10% bonus applied).`);
    setIsLoading(false);
    return true;
  };

  return (
    <StellarContext.Provider value={{
      walletConnected,
      publicKey,
      balanceXLM,
      balanceUSDC,
      balanceSynths,
      assets,
      vaults,
      transactions,
      toasts,
      isLoading,
      simulationMode,
      connectWallet,
      disconnectWallet,
      claimFaucet,
      depositCollateral,
      withdrawCollateral,
      mintSynths,
      burnSynths,
      redeemSynths,
      liquidateVault,
      addToast,
      removeToast,
      createVault,
      triggerPriceTick
    }}>
      {children}
    </StellarContext.Provider>
  );
};

export const useStellar = () => {
  const context = useContext(StellarContext);
  if (context === undefined) {
    throw new Error('useStellar must be used within a StellarProvider');
  }
  return context;
};
