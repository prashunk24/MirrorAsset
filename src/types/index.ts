export type AssetType = 'Commodity' | 'Equity' | 'Forex';

export interface Asset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  type: AssetType;
  collateralAsset: 'XLM' | 'USDC';
  minCollateralRatio: number; // e.g. 150 for 150%
  sparklineData: number[];
}

export type VaultHealth = 'Safe' | 'Warning' | 'Danger' | 'Liquidatable' | 'Empty';

export interface Vault {
  id: string;
  owner: string;
  collateralAsset: 'XLM' | 'USDC';
  collateralAmount: number;
  syntheticAsset: string;
  mintedAmount: number;
  collateralRatio: number; // percentage
  health: VaultHealth;
}

export type TransactionType = 
  | 'Deposit' 
  | 'Withdraw' 
  | 'Mint' 
  | 'Burn' 
  | 'Redeem' 
  | 'Liquidate'
  | 'Faucet';

export interface Transaction {
  id: string;
  type: TransactionType;
  timestamp: number;
  status: 'success' | 'loading' | 'failed';
  details: string;
  hash: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description: string;
}
