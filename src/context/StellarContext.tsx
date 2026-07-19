import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { isConnected, isAllowed, setAllowed, getPublicKey, signTransaction, getAddress } from '@stellar/freighter-api';
import { Horizon, TransactionBuilder, Networks, BASE_FEE, Operation, Asset } from '@stellar/stellar-sdk';
import type { Asset as AppAsset, Vault, Transaction, ToastMessage, VaultHealth, TransactionType } from '../types';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

interface StellarContextType {
  walletConnected: boolean;
  publicKey: string | null;
  balanceXLM: number;
  balanceUSDC: number;
  balanceSynths: { [symbol: string]: number };
  assets: AppAsset[];
  vaults: Vault[];
  transactions: Transaction[];
  toasts: ToastMessage[];
  isLoading: boolean;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  claimFaucet: () => Promise<void>;
  fetchBalance: () => Promise<void>;
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

// ---------------------------------------------------------------------------
// Horizon server (testnet)
// ---------------------------------------------------------------------------

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const horizonServer = new Horizon.Server(HORIZON_URL);

// ---------------------------------------------------------------------------
// Initial mock assets
// ---------------------------------------------------------------------------

const INITIAL_ASSETS: AppAsset[] = [
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const generateSimHash = (): string =>
  'sim_' + Array.from({ length: 56 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const StellarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balanceXLM, setBalanceXLM] = useState<number>(0);
  const [balanceUSDC, setBalanceUSDC] = useState<number>(0);
  const [balanceSynths, setBalanceSynths] = useState<{ [symbol: string]: number }>({
    sXAU: 0,
    sAAPL: 0,
    sEUR: 0,
    sTSLA: 0,
    sSLV: 0,
  });

  const [assets, setAssets] = useState<AppAsset[]>(() => {
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

  const publicKeyRef = useRef<string | null>(null);
  useEffect(() => {
    publicKeyRef.current = publicKey;
  }, [publicKey]);

  useEffect(() => {
    localStorage.setItem('mirror_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('mirror_vaults', JSON.stringify(vaults));
  }, [vaults]);

  useEffect(() => {
    localStorage.setItem('mirror_txs', JSON.stringify(transactions));
  }, [transactions]);

  const triggerPriceTick = useCallback(() => {
    setAssets(prevAssets => {
      return prevAssets.map(asset => {
        const changePercent = (Math.random() * 3 - 1.5) / 100;
        const newPrice = Math.max(0.0001, asset.price * (1 + changePercent));
        const updatedSparkline = [...asset.sparklineData.slice(1), newPrice];
        const change24h = asset.change24h + (changePercent * 100);
        return {
          ...asset,
          price: Number(newPrice.toFixed(4)),
          change24h: Number(change24h.toFixed(2)),
          sparklineData: updatedSparkline,
        };
      });
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      triggerPriceTick();
    }, 12000);
    return () => clearInterval(interval);
  }, [triggerPriceTick]);

  useEffect(() => {
    setVaults(prevVaults => {
      let changed = false;
      const updated = prevVaults.map(vault => {
        const asset = assets.find(a => a.symbol === vault.syntheticAsset);
        if (!asset) return vault;

        const collateralPrice = vault.collateralAsset === 'XLM' ? 0.12 : 1.00;
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

  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, description: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, description }]);
    setTimeout(() => removeToast(id), 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addTransaction = useCallback((type: TransactionType, details: string, status: 'success' | 'failed' | 'loading' = 'success') => {
    const hash = generateSimHash();
    const newTx: Transaction = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      timestamp: Date.now(),
      status,
      details,
      hash,
    };
    setTransactions(prev => [newTx, ...prev]);
    return newTx.id;
  }, []);

  const updateTransactionStatus = useCallback((id: string, status: 'success' | 'failed') => {
    setTransactions(prev => prev.map(tx => (tx.id === id ? { ...tx, status } : tx)));
  }, []);

  const fetchBalance = useCallback(async (): Promise<void> => {
    const pk = publicKeyRef.current;
    if (!pk) return;

    try {
      const account = await horizonServer.loadAccount(pk);
      const nativeBalance = account.balances.find(
        (b: any) => b.asset_type === 'native'
      );
      if (nativeBalance) {
        setBalanceXLM(parseFloat(nativeBalance.balance));
      }
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.message?.includes('404')) {
        setBalanceXLM(0);
      } else {
        console.error('Failed to fetch balance from Horizon:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (!walletConnected || !publicKey) return;
    fetchBalance();
    const interval = setInterval(() => {
      fetchBalance();
    }, 30000);
    return () => clearInterval(interval);
  }, [walletConnected, publicKey, fetchBalance]);

  // Asynchronous Loading check helper for Freighter scripts injection
  const waitForFreighter = async (timeoutMs = 1500): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }
      if ((window as any).stellar || (window as any).freighter || (window as any).stellarWallet) {
        resolve(true);
        return;
      }

      const interval = setInterval(() => {
        if ((window as any).stellar || (window as any).freighter || (window as any).stellarWallet) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        resolve(!!((window as any).stellar || (window as any).freighter || (window as any).stellarWallet));
      }, timeoutMs);
    });
  };



  // Helper to trigger Freighter signTransaction prompt for validation
  const signWithWallet = async (details: string): Promise<boolean> => {
    const pk = publicKeyRef.current;
    if (!pk) {
      addToast('error', 'No Wallet', 'Please connect your wallet first.');
      return false;
    }

    try {
      const account = await horizonServer.loadAccount(pk);
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: pk,
            asset: Asset.native(),
            amount: '0.0000000',
          })
        )
        .setTimeout(30)
        .build();

      const unsignedXdr = tx.toXDR();
      addToast('info', 'Signature Request', `Please approve wallet transaction for: ${details}`);
      const signResponse = await signTransaction(unsignedXdr, {
        networkPassphrase: Networks.TESTNET,
      });

      if (!signResponse || !signResponse.signedTxXdr) {
        throw new Error('Transaction confirmation rejected by user.');
      }
      return true;
    } catch (err: any) {
      console.error('Wallet signing rejected/failed:', err);
      addToast('error', 'Signature Rejected', err.message || 'The signature request was declined.');
      return false;
    }
  };

  const connectWallet = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // 1. Wait for Freighter extension scripts to inject asynchronously
      const freighterLoaded = await waitForFreighter();
      if (!freighterLoaded) {
        addToast(
          'error',
          'Freighter Not Detected',
          'Freighter wallet extension was not found. Please install it from freighter.app.'
        );
        setIsLoading(false);
        return false;
      }

      // 2. Enforce live execution check
      const connectionStatus = await isConnected();
      if (!connectionStatus || !connectionStatus.isConnected) {
        addToast(
          'error',
          'Freighter Disconnected',
          'Freighter wallet is locked or extension was not detected. Please unlock freighter.'
        );
        setIsLoading(false);
        return false;
      }

      // 3. Request permissions / authorization popup window
      const allowed = await isAllowed();
      if (!allowed || !allowed.isAllowed) {
        const setAllowedStatus = await setAllowed();
        if (!setAllowedStatus || !setAllowedStatus.isAllowed) {
          addToast(
            'error',
            'Access Rejected',
            'Wallet connection rejected. Enable permissions in the Freighter popup.'
          );
          setIsLoading(false);
          return false;
        }
      }

      // 4. Retrieve the real active public key
      let pubKey = '';
      try {
        pubKey = await getPublicKey();
      } catch (err) {
        // Fallback to getAddress if getPublicKey type wrapper fails
        const addrInfo = await getAddress();
        pubKey = addrInfo.address;
      }

      if (!pubKey) {
        addToast('error', 'Address Error', 'Could not retrieve public key address from Freighter.');
        setIsLoading(false);
        return false;
      }

      setPublicKey(pubKey);
      setWalletConnected(true);
      addToast(
        'success',
        'Wallet Connected',
        `Freighter active — ${pubKey.substring(0, 6)}…${pubKey.substring(pubKey.length - 4)}`
      );

      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      addToast('error', 'Connection Failed', error.message || 'Unknown error connecting to Freighter.');
      setIsLoading(false);
      return false;
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setPublicKey(null);
    setBalanceXLM(0);
    setBalanceUSDC(0);
    addToast('info', 'Wallet Disconnected', 'Logged out of Stellar network session.');
  };

  const claimFaucet = async (): Promise<void> => {
    const pk = publicKeyRef.current;
    if (!pk) {
      addToast('error', 'No Wallet', 'Connect your wallet before claiming the faucet.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`https://friendbot.stellar.org/?addr=${pk}`);
      if (!response.ok) {
        const body = await response.text();
        if (response.status === 400 && body.includes('createAccountAlreadyExist')) {
          addToast('info', 'Already Funded', 'This account has already been funded by Friendbot. Refreshing balance…');
        } else {
          throw new Error(`Friendbot error (${response.status}): ${body.substring(0, 120)}`);
        }
      } else {
        addTransaction('Faucet', `Received 10,000 XLM from Stellar Testnet Friendbot`);
        addToast('success', 'Faucet Claimed', 'Friendbot funded your account with 10,000 testnet XLM.');
      }
      await fetchBalance();
    } catch (err: any) {
      console.error('Faucet claim error:', err);
      addToast('error', 'Faucet Failed', err.message || 'Could not reach Friendbot. Try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const createVault = async (collateralAsset: 'XLM' | 'USDC', syntheticAsset: string): Promise<string | null> => {
    if (!walletConnected) {
      addToast('error', 'Auth Error', 'Connect wallet to create a vault.');
      return null;
    }

    // Require real wallet transaction signature prompt
    const signed = await signWithWallet(`Initialize ${syntheticAsset} Vault`);
    if (!signed) return null;

    setIsLoading(true);
    const txId = addTransaction('Deposit', `Creating new ${syntheticAsset} Vault with ${collateralAsset} collateral`, 'loading');

    const existing = vaults.find(v => v.collateralAsset === collateralAsset && v.syntheticAsset === syntheticAsset && v.owner === publicKey);
    if (existing) {
      updateTransactionStatus(txId, 'failed');
      addToast('error', 'Vault Exists', `You already have a vault for ${syntheticAsset} backed by ${collateralAsset}.`);
      setIsLoading(false);
      return null;
    }

    const newVault: Vault = {
      id: Math.random().toString(36).substring(2, 9),
      owner: publicKey || '',
      collateralAsset,
      collateralAmount: 0,
      syntheticAsset,
      mintedAmount: 0,
      collateralRatio: 0,
      health: 'Empty',
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

    // Enforce Freighter transaction signing popup
    const signed = await signWithWallet(`Deposit ${amount} ${vault.collateralAsset}`);
    if (!signed) {
      setIsLoading(false);
      return false;
    }

    const txId = addTransaction('Deposit', `Deposited ${amount} ${vault.collateralAsset} collateral`, 'loading');

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

    // Enforce Freighter transaction signing popup
    const signed = await signWithWallet(`Withdraw ${amount} ${vault.collateralAsset}`);
    if (!signed) {
      setIsLoading(false);
      return false;
    }

    const txId = addTransaction('Withdraw', `Withdrew ${amount} ${vault.collateralAsset} collateral`, 'loading');

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

    // Enforce Freighter transaction signing popup
    const signed = await signWithWallet(`Mint ${amount} ${vault.syntheticAsset}`);
    if (!signed) {
      setIsLoading(false);
      return false;
    }

    const txId = addTransaction('Mint', `Minted ${amount} ${vault.syntheticAsset}`, 'loading');

    setBalanceSynths(prev => ({
      ...prev,
      [vault.syntheticAsset]: (prev[vault.syntheticAsset] || 0) + amount,
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

    // Enforce Freighter transaction signing popup
    const signed = await signWithWallet(`Burn ${amount} ${vault.syntheticAsset}`);
    if (!signed) {
      setIsLoading(false);
      return false;
    }

    const txId = addTransaction('Burn', `Burned ${amount} ${vault.syntheticAsset}`, 'loading');

    setBalanceSynths(prev => ({
      ...prev,
      [vault.syntheticAsset]: Math.max(0, prev[vault.syntheticAsset] - amount),
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

    // Enforce Freighter transaction signing popup
    const signed = await signWithWallet(`Redeem ${amount} ${symbol}`);
    if (!signed) {
      setIsLoading(false);
      return false;
    }

    const txId = addTransaction('Redeem', `Redeemed ${amount} ${symbol} for ${asset.collateralAsset}`, 'loading');

    const synthUSDVal = amount * asset.price;
    const feePercent = 0.005;
    const feeVal = synthUSDVal * feePercent;
    const redeemableUSD = synthUSDVal - feeVal;

    const collateralPrice = asset.collateralAsset === 'XLM' ? 0.12 : 1.00;
    const collateralOut = Number((redeemableUSD / collateralPrice).toFixed(4));

    setBalanceSynths(prev => ({
      ...prev,
      [symbol]: prev[symbol] - amount,
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

    // Enforce Freighter transaction signing popup
    const signed = await signWithWallet(`Liquidate vault ${vaultId.substring(0, 4)}…`);
    if (!signed) {
      setIsLoading(false);
      return false;
    }

    const limitDebtCover = Math.min(debtToCover, vault.mintedAmount);
    const txId = addTransaction('Liquidate', `Liquidating ${limitDebtCover} debt from vault ${vaultId.substring(0, 4)}…`, 'loading');

    const debtValUSD = limitDebtCover * asset.price;
    const bonusMultiplier = 1.10;
    const collateralValueToGet = debtValUSD * bonusMultiplier;

    const collateralPrice = vault.collateralAsset === 'XLM' ? 0.12 : 1.00;
    let collateralToGet = collateralValueToGet / collateralPrice;

    if (collateralToGet > vault.collateralAmount) {
      collateralToGet = vault.collateralAmount;
    }

    collateralToGet = Number(collateralToGet.toFixed(4));

    setBalanceSynths(prev => ({
      ...prev,
      [vault.syntheticAsset]: prev[vault.syntheticAsset] - limitDebtCover,
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
          mintedAmount: Math.max(0, v.mintedAmount - limitDebtCover),
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
      connectWallet,
      disconnectWallet,
      claimFaucet,
      fetchBalance,
      depositCollateral,
      withdrawCollateral,
      mintSynths,
      burnSynths,
      redeemSynths,
      liquidateVault,
      addToast,
      removeToast,
      createVault,
      triggerPriceTick,
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
