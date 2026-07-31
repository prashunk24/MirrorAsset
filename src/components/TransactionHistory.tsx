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
    const cls = 'h-4 w-4';
    switch (type) {
      case 'Deposit':    return <div className="p-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.22)' }}><ArrowDown className={`${cls} text-emerald-400`} /></div>;
      case 'Withdraw':   return <div className="p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)' }}><ArrowUp className={`${cls} text-rose-400`} /></div>;
      case 'Mint':       return <div className="p-2 rounded-lg" style={{ background: 'rgba(6,182,212,0.10)', border: '1px solid rgba(6,182,212,0.22)' }}><Coins className={`${cls} text-cyan-400`} /></div>;
      case 'Burn':       return <div className="p-2 rounded-lg" style={{ background: 'rgba(100,116,139,0.10)', border: '1px solid rgba(100,116,139,0.20)' }}><Coins className={`${cls} text-slate-400`} /></div>;
      case 'Redeem':     return <div className="p-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.22)' }}><Repeat className={`${cls} text-indigo-400`} /></div>;
      case 'Liquidate':  return <div className="p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)' }}><Flame className={`${cls} text-rose-400`} /></div>;
      case 'Faucet':     return <div className="p-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.22)' }}><Award className={`${cls} text-amber-400`} /></div>;
      default:           return <div className="p-2 rounded-lg" style={{ background: 'rgba(100,116,139,0.10)', border: '1px solid rgba(100,116,139,0.18)' }}><Clock className={`${cls} text-slate-500`} /></div>;
    }
  };

  const getStatusBadge = (status: 'success' | 'loading' | 'failed') => {
    switch (status) {
      case 'success': return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Success</span>
      );
      case 'loading': return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">Pending</span>
      );
      case 'failed': return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Failed</span>
      );
    }
  };

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="relative min-h-screen px-4 sm:px-6 lg:px-8 py-10 overflow-hidden">
      {/* Ambient backlights */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-24 -left-24 w-80 h-80 bg-indigo-600/6 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 animate-fade-in space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Transaction History
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Stellar network ledger entries representing vault activity.</p>
          </div>

          {/* Filter pills — horizontally scrollable on mobile */}
          <div
            className="flex gap-1 p-1 rounded-xl overflow-x-auto scrollbar-none max-w-full flex-shrink-0"
            style={{ background: 'rgba(13,18,29,0.80)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            {filterOptions.map(option => (
              <button
                key={option}
                onClick={() => setFilterType(option)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 whitespace-nowrap cursor-pointer"
                style={filterType === option
                  ? { background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.38)', color: '#c4b5fd' }
                  : { color: 'rgba(100,116,139,1)', background: 'transparent', border: '1px solid transparent' }
                }
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* ── Empty state ── */}
        {filteredTransactions.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]"
            style={{ background: 'rgba(13,18,29,0.70)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)', borderStyle: 'dashed' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(6,182,212,0.15))', border: '1px solid rgba(139,92,246,0.28)', boxShadow: '0 0 20px rgba(139,92,246,0.18)' }}
            >
              <Clock className="h-8 w-8 text-violet-400" />
            </div>
            <h4 className="font-semibold text-slate-200 text-base">No Transactions Found</h4>
            <p className="text-slate-500 text-xs mt-2 max-w-sm">
              Make deposits, mint assets, or perform redemptions to generate transaction records on the ledger.
            </p>
          </div>
        ) : (
          /* ── Table ── */
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{ background: 'rgba(13,18,29,0.75)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 10px 40px rgba(0,0,0,0.50)' }}
          >
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-400" />

            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className="text-[10px] text-slate-500 font-bold uppercase tracking-wider"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,20,35,0.50)' }}
                  >
                    <th className="py-3.5 px-4 w-12">Action</th>
                    <th className="py-3.5 px-4">Details</th>
                    <th className="py-3.5 px-4 w-32">Tx Hash</th>
                    <th className="py-3.5 px-4 w-24">Time</th>
                    <th className="py-3.5 px-4 w-20 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx, i) => (
                    <tr
                      key={tx.id}
                      className="text-xs transition-colors duration-150 cursor-default"
                      style={{
                        borderBottom: i < filteredTransactions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(30,40,60,0.50)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <td className="py-3.5 px-4">{getTxIcon(tx.type)}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">{tx.details}</td>
                      <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 transition-colors hover:text-cyan-400"
                        >
                          <span>{tx.hash.substring(0, 8)}…</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{formatTime(tx.timestamp)}</td>
                      <td className="py-3.5 px-4 text-right">{getStatusBadge(tx.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
