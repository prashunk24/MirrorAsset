import React, { useState } from 'react';
import { useStellar } from '../context/StellarContext';
import type { TransactionType } from '../types';
import { ArrowDown, ArrowUp, Coins, Flame, Repeat, ExternalLink, Award, Clock } from 'lucide-react';

export const TransactionHistory: React.FC = () => {
  const { transactions } = useStellar();
  const [filterType, setFilterType] = useState<string>('All');

  const filterOptions = ['All', 'Deposit', 'Withdraw', 'Mint', 'Burn', 'Redeem', 'Liquidate', 'Faucet'];

  const filteredTransactions = transactions.filter(tx => {
    if (filterType === 'All') return true;
    return tx.type === filterType;
  });

  const getTxIcon = (type: TransactionType) => {
    const baseStyle = "h-4 w-4";
    switch (type) {
      case 'Deposit':
        return <div className="p-2 bg-accent-green/10 border border-accent-green/20 text-accent-green rounded-lg"><ArrowDown className={baseStyle} /></div>;
      case 'Withdraw':
        return <div className="p-2 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg"><ArrowUp className={baseStyle} /></div>;
      case 'Mint':
        return <div className="p-2 bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan rounded-lg"><Coins className={baseStyle} /></div>;
      case 'Burn':
        return <div className="p-2 bg-bg-surface border border-border-subtle text-text-muted rounded-lg"><Coins className={baseStyle} /></div>;
      case 'Redeem':
        return <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg"><Repeat className={baseStyle} /></div>;
      case 'Liquidate':
        return <div className="p-2 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg"><Flame className={baseStyle} /></div>;
      case 'Faucet':
        return <div className="p-2 bg-accent-amber/10 border border-accent-amber/20 text-accent-amber rounded-lg"><Award className={baseStyle} /></div>;
      default:
        return <div className="p-2 bg-bg-surface border border-border-subtle text-text-muted rounded-lg"><Clock className={baseStyle} /></div>;
    }
  };

  const getStatusBadge = (status: 'success' | 'loading' | 'failed') => {
    switch (status) {
      case 'success':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-accent-green/10 text-accent-green border border-accent-green/20">Success</span>;
      case 'loading':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-accent-amber/10 text-accent-amber border border-accent-amber/20 animate-pulse">Pending</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-accent-red/10 text-accent-red border border-accent-red/20">Failed</span>;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Transaction History</h2>
          <p className="text-xs text-text-muted mt-1">Stellar network transaction ledger entries representing vault activity.</p>
        </div>

        {/* Filter Scrollable */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-bg-surface border border-border-subtle rounded-xl max-w-full overflow-x-auto">
          {filterOptions.map(option => (
            <button
              key={option}
              onClick={() => setFilterType(option)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterType === option ? 'bg-bg-card border border-border-subtle text-text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="p-4 bg-bg-surface rounded-full border border-border-subtle mb-4">
            <Clock className="h-8 w-8 text-text-muted" />
          </div>
          <h4 className="font-semibold text-text-secondary text-base">No Transactions Found</h4>
          <p className="text-text-muted text-xs mt-2 max-w-sm">
            Make deposits, mint assets, or perform redemptions to generate transaction records on the ledger.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-border-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-surface/40 text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12">Action</th>
                  <th className="py-3.5 px-4">Details</th>
                  <th className="py-3.5 px-4 w-32">Tx Hash</th>
                  <th className="py-3.5 px-4 w-24">Time</th>
                  <th className="py-3.5 px-4 w-20 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs text-text-secondary font-medium">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-bg-card-hover/30 transition-colors">
                    <td className="py-3 px-4">
                      {getTxIcon(tx.type)}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {tx.details}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-text-muted">
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-accent-cyan transition-colors flex items-center gap-1"
                      >
                        <span>{tx.hash.substring(0, 8)}...</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      {formatTime(tx.timestamp)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {getStatusBadge(tx.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
