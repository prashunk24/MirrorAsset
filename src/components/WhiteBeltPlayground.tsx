import React, { useState, useEffect } from 'react';
import { useStellar } from '../context/StellarContext';
import { Keypair, Horizon, Networks, TransactionBuilder, Operation, Asset, BASE_FEE } from '@stellar/stellar-sdk';
import { 
  Send, 
  Eye, 
  EyeOff, 
  Copy, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  BookOpen, 
  Terminal, 
  Loader2, 
  ShieldCheck, 
  Zap, 
  Info 
} from 'lucide-react';

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error';
  message: string;
}

export const WhiteBeltPlayground: React.FC = () => {
  const { addToast } = useStellar();

  // Task 1: Wallet Creation State
  const [wallet, setWallet] = useState<{ publicKey: string; secretKey: string } | null>(() => {
    const saved = localStorage.getItem('stellar_whitebelt_wallet');
    return saved ? JSON.parse(saved) : null;
  });
  const [showSecret, setShowSecret] = useState(false);

  // Task 2: Balance Retrieval State
  const [balance, setBalance] = useState<string | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  // Task 3: Transaction State
  const [txDestination, setTxDestination] = useState<string>('');
  const [txAmount, setTxAmount] = useState<string>('10');
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Logs Terminal State
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Progress Tracker
  const [task1Done, setTask1Done] = useState(false);
  const [task2Done, setTask2Done] = useState(false);
  const [task3Done, setTask3Done] = useState(false);

  // Initialize status on mount
  useEffect(() => {
    if (wallet) {
      setTask1Done(true);
      setTxDestination(wallet.publicKey); // default destination is self-payment
      addLog('info', `Found existing local playground wallet: ${wallet.publicKey.substring(0, 8)}...`);
    } else {
      addLog('info', 'Playground initialized. Start by creating a Stellar wallet (Task 1).');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (wallet) {
      localStorage.setItem('stellar_whitebelt_wallet', JSON.stringify(wallet));
      setTask1Done(true);
    } else {
      localStorage.removeItem('stellar_whitebelt_wallet');
      setTask1Done(false);
    }
  }, [wallet]);

  const addLog = (type: 'info' | 'success' | 'error', message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{ timestamp, type, message }, ...prev].slice(0, 50));
  };

  const clearPlayground = () => {
    if (window.confirm('Are you sure you want to reset your playground wallet and logs?')) {
      setWallet(null);
      setBalance(null);
      setTxHash(null);
      setLogs([]);
      setTask1Done(false);
      setTask2Done(false);
      setTask3Done(false);
      setShowSecret(false);
      addToast('info', 'Playground Reset', 'Wallet and progress have been cleared.');
      addLog('info', 'Playground reset. Ready for wallet creation.');
    }
  };

  // Task 1: Generate Wallet
  const generateWallet = () => {
    try {
      addLog('info', 'Generating new cryptographically secure keypair...');
      const pair = Keypair.random();
      const newWallet = {
        publicKey: pair.publicKey(),
        secretKey: pair.secret()
      };
      setWallet(newWallet);
      setTxDestination(newWallet.publicKey);
      setBalance(null);
      setTxHash(null);
      setTask2Done(false);
      setTask3Done(false);
      
      addLog('success', `Wallet created! Public Key: ${newWallet.publicKey}`);
      addLog('error', 'Secret Key generated. KEEP IT SECURE! Do not share it or commit it to GitHub.');
      addToast('success', 'Wallet Generated', 'A new Stellar keypair has been generated.');
    } catch (error: any) {
      addLog('error', `Failed to generate wallet: ${error.message}`);
      addToast('error', 'Generation Failed', error.message);
    }
  };

  // Download Keypair Backup
  const downloadBackup = () => {
    if (!wallet) return;
    const fileData = JSON.stringify({
      network: 'Stellar Testnet',
      publicKey: wallet.publicKey,
      secretKey: wallet.secretKey,
      note: 'Stellar White Belt Challenge Wallet Backup. Keep this file private and out of version control.'
    }, null, 2);
    
    const blob = new Blob([fileData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stellar-whitebelt-backup-${wallet.publicKey.substring(0, 8)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addLog('success', 'Backup JSON file downloaded.');
    addToast('success', 'Backup Downloaded', 'Secure JSON credentials downloaded.');
  };

  // Task 2: Check Balance
  const checkBalance = async () => {
    if (!wallet) return;
    setIsCheckingBalance(true);
    addLog('info', 'Connecting to Stellar Testnet Horizon server...');
    
    try {
      const server = new Horizon.Server('https://horizon-testnet.stellar.org');
      addLog('info', `Loading account info for: ${wallet.publicKey}`);
      
      const accountInfo = await server.loadAccount(wallet.publicKey);
      const nativeBalance = accountInfo.balances.find(b => b.asset_type === 'native');
      const balanceAmount = nativeBalance ? nativeBalance.balance : '0';
      
      setBalance(balanceAmount);
      const balanceNum = parseFloat(balanceAmount);
      
      if (balanceNum > 0) {
        setTask2Done(true);
        addLog('success', `Account Balance: ${balanceAmount} XLM`);
      } else {
        setTask2Done(false);
        addLog('info', `Account exists but has 0 XLM balance.`);
      }
      
      addToast('success', 'Balance Updated', `${balanceAmount} XLM`);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        setBalance('0 (Unfunded / Not Found)');
        setTask2Done(false);
        addLog('error', 'Account not found on the Stellar Testnet ledger. It needs to be funded to exist.');
        addLog('info', 'Click the "Fund with Friendbot" button to claim testnet XLM.');
        addToast('info', 'Wallet Not Funded', 'Account does not exist on testnet yet.');
      } else {
        addLog('error', `Failed to retrieve balance: ${error.message}`);
        addToast('error', 'Retrieval Error', error.message);
      }
    } finally {
      setIsCheckingBalance(false);
    }
  };

  // Task 2 Faucet: Friendbot Funding
  const fundWithFriendbot = async () => {
    if (!wallet) return;
    setIsFunding(true);
    addLog('info', 'Requesting 10,000 testnet XLM from Stellar Friendbot...');
    
    try {
      const response = await fetch(`https://friendbot.stellar.org/?addr=${wallet.publicKey}`);
      
      if (response.ok) {
        const data = await response.json();
        addLog('success', 'Friendbot response received. Account successfully funded!');
        addLog('info', `Transaction Hash: ${data.hash}`);
        addToast('success', 'Account Funded', '10,000 XLM credited from Friendbot.');
        // Auto check balance
        await checkBalance();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Friendbot request failed');
      }
    } catch (error: any) {
      addLog('error', `Friendbot Funding failed: ${error.message}`);
      addToast('error', 'Funding Failed', error.message);
    } finally {
      setIsFunding(false);
    }
  };

  // Task 3: Sign & Broadcast Transaction
  const sendTransaction = async () => {
    if (!wallet) return;
    
    // Check if account has enough balance
    if (!balance || parseFloat(balance) < (parseFloat(txAmount) + 0.0001)) {
      addLog('error', 'Cannot send transaction: Insufficient funds.');
      addToast('error', 'Insufficient Funds', 'Fund your account before sending payments.');
      return;
    }

    setIsSubmittingTx(true);
    setTxHash(null);
    setTask3Done(false);
    
    addLog('info', 'Initializing Stellar Transaction Builder...');
    
    try {
      const server = new Horizon.Server('https://horizon-testnet.stellar.org');
      
      // Load source account details
      addLog('info', `Loading sequence number for source: ${wallet.publicKey}`);
      const sourceAccount = await server.loadAccount(wallet.publicKey);
      
      // Build transaction
      addLog('info', `Constructing Payment operation: ${txAmount} XLM to ${txDestination}`);
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: txDestination,
            asset: Asset.native(),
            amount: parseFloat(txAmount).toFixed(7), // Stellar requires string decimal representation
          })
        )
        .setTimeout(30) // Transaction expires in 30 seconds
        .build();

      // Sign transaction
      addLog('info', 'Signing transaction locally using Secret Key...');
      const sourceKeypair = Keypair.fromSecret(wallet.secretKey);
      transaction.sign(sourceKeypair);
      
      // Submit transaction
      addLog('info', 'Submitting signed transaction XDR to Stellar Horizon network...');
      const response = await server.submitTransaction(transaction);
      
      if (response.successful) {
        setTxHash(response.hash);
        setTask3Done(true);
        addLog('success', `Transaction success! Ledger: ${response.ledger}`);
        addLog('success', `Transaction Hash: ${response.hash}`);
        addToast('success', 'Transaction Successful', 'Payment sent on Stellar Testnet!');
        
        // Re-check balance
        setTimeout(() => checkBalance(), 1000);
      } else {
        throw new Error('Transaction submission returned failure');
      }
    } catch (error: any) {
      console.error(error);
      const extraDetails = error.response?.data?.extras?.result_codes;
      const detailsStr = extraDetails ? JSON.stringify(extraDetails) : '';
      addLog('error', `Transaction execution failed: ${error.message} ${detailsStr}`);
      addToast('error', 'Transaction Failed', error.message);
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const copyToClipboard = (text: string, isSecret = false) => {
    navigator.clipboard.writeText(text);
    if (isSecret) {
      addToast('info', 'Copied Secret Key', 'Keep this secure! Never share it.');
    } else {
      addToast('success', 'Address Copied', 'Address copied to clipboard.');
    }
  };

  // Calculate overall progress percentage
  const progressPercent = (task1Done ? 33 : 0) + (task2Done ? 33 : 0) + (task3Done ? 34 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in space-y-6">
      {/* Upper header with challenge status */}
      <div className="glass-card relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 max-w-2xl">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-violet-400"
            style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Journey to Mastery</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Stellar White Belt Challenge
          </h2>
          <p className="text-sm text-slate-400">
            Learn the basics of Stellar development: wallet creation, balance checks, and submitting transaction signatures directly on the Testnet network.
          </p>
        </div>

        {/* Progress Tracker */}
        <div
          className="flex-shrink-0 rounded-xl p-4 min-w-[220px] sm:min-w-[240px] space-y-3"
          style={{ background: 'rgba(15,20,35,0.80)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-500">Completion Status</span>
            <span className={`font-bold ${progressPercent === 100 ? 'text-emerald-400' : 'text-violet-400'}`}>
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(15,20,35,1)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%`, background: 'linear-gradient(to right, #8b5cf6, #06b6d4)' }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-600 font-medium">
            <span className={task1Done ? 'text-emerald-400 font-bold' : ''}>Wallet Create</span>
            <span className={task2Done ? 'text-emerald-400 font-bold' : ''}>Balance Check</span>
            <span className={task3Done ? 'text-emerald-400 font-bold' : ''}>Tx Sent</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Challenge cards & Info panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left column (2 cols span): Tasks implementation */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          
          {/* TASK 1: WALLET CREATION */}
          <div className={`glass-panel p-6 rounded-2xl border-l-4 transition-all duration-300 ${
            task1Done ? 'border-l-accent-green bg-accent-green/[0.01]' : 'border-l-accent-purple'
          }`}>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-accent-purple uppercase tracking-wider">Task 1</span>
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  Stellar Wallet Creation
                  {task1Done && <CheckCircle2 className="h-4.5 w-4.5 text-accent-green fill-emerald-950" />}
                </h3>
              </div>
              {!wallet && (
                <button
                  onClick={generateWallet}
                  className="px-4 py-2 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Generate Wallet
                </button>
              )}
            </div>

            {wallet ? (
              <div className="mt-4 space-y-4">
                {/* Public Key Display */}
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                    Public Address (G...)
                  </label>
                  <div className="flex items-center gap-2 bg-bg-dark border border-border-subtle rounded-xl px-3 py-2">
                    <span className="font-mono text-xs text-text-secondary break-all select-all flex-grow">
                      {wallet.publicKey}
                    </span>
                    <button
                      onClick={() => copyToClipboard(wallet.publicKey)}
                      className="p-1.5 hover:bg-bg-card-hover text-text-muted hover:text-text-secondary rounded-lg transition-colors cursor-pointer"
                      title="Copy Address"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Secret Key Display */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 text-accent-red">
                    <AlertTriangle className="h-3.5 w-3.5 text-accent-red" />
                    Secret Key (S...) - DO NOT SHARE
                  </label>
                  <div className="flex items-center gap-2 bg-bg-dark border border-accent-red/20 rounded-xl px-3 py-2">
                    <span className="font-mono text-xs text-accent-red break-all flex-grow select-all">
                      {showSecret ? wallet.secretKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                    </span>
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className="p-1.5 hover:bg-bg-card-hover text-text-muted hover:text-text-secondary rounded-lg transition-colors cursor-pointer"
                      title={showSecret ? "Hide Secret Key" : "Reveal Secret Key"}
                    >
                      {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(wallet.secretKey, true)}
                      className="p-1.5 hover:bg-bg-card-hover text-text-muted hover:text-text-secondary rounded-lg transition-colors cursor-pointer"
                      title="Copy Secret Key"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-text-muted mt-1">
                    Your secret key is held entirely in transient local memory. It will never be committed to Git.
                  </p>
                </div>

                {/* Wallet Action Buttons */}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    onClick={downloadBackup}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-surface hover:bg-bg-card-hover border border-border-subtle text-text-secondary hover:text-text-primary rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Backup JSON</span>
                  </button>
                  <button
                    onClick={generateWallet}
                    className="px-3 py-1.5 bg-bg-surface hover:bg-bg-card-hover border border-border-subtle text-text-muted hover:text-accent-red rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    Regenerate Wallet
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-xl bg-bg-surface/40 border border-border-subtle text-center">
                <p className="text-xs text-text-muted">
                  No active playground wallet. Click "Generate Wallet" to create a new Stellar account.
                </p>
              </div>
            )}
          </div>

          {/* TASK 2: BALANCE RETRIEVAL */}
          <div className={`glass-panel p-6 rounded-2xl border-l-4 transition-all duration-300 ${
            task2Done ? 'border-l-accent-green bg-accent-green/[0.01]' : 'border-l-accent-cyan'
          }`}>
            <div className="space-y-1 mb-4">
              <span className="text-[10px] font-bold text-accent-cyan uppercase tracking-wider">Task 2</span>
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                Stellar Balance Retrieval
                {task2Done && <CheckCircle2 className="h-4.5 w-4.5 text-accent-green fill-emerald-950" />}
              </h3>
            </div>

            <div className="space-y-4">
              {/* Balance Result Board */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Horizon Testnet Balance</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-text-primary">
                      {balance !== null ? balance : '—'}
                    </span>
                    {balance !== null && !balance.includes('Unfunded') && (
                      <span className="text-xs font-bold text-accent-cyan">XLM</span>
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted mt-2 block">
                    Stellar Testnet Horizon Network API
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle flex flex-col justify-between gap-3">
                  <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Horizon Account Status</span>
                  <div className="text-xs">
                    {balance === null ? (
                      <span className="text-text-muted font-medium">Verify wallet to fetch ledger state.</span>
                    ) : balance.includes('Unfunded') ? (
                      <div className="space-y-1">
                        <span className="text-accent-amber font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Unfunded (Doesn't Exist)
                        </span>
                        <p className="text-[10px] text-text-muted">
                          A Stellar wallet must hold a minimum reserve of 1 XLM to exist on-chain.
                        </p>
                      </div>
                    ) : (
                      <span className="text-accent-green font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Active on Stellar Testnet
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={checkBalance}
                      disabled={!wallet || isCheckingBalance}
                      className="flex-grow flex items-center justify-center gap-1.5 px-3 py-2 bg-bg-card hover:bg-bg-card-hover border border-border-subtle disabled:opacity-50 text-text-primary rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      {isCheckingBalance ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        <span>Check Balance</span>
                      )}
                    </button>

                    {wallet && balance?.includes('Unfunded') && (
                      <button
                        onClick={fundWithFriendbot}
                        disabled={isFunding}
                        className="flex-grow flex items-center justify-center gap-1.5 px-3 py-2 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/30 text-accent-cyan hover:text-text-primary rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        {isFunding ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Funding...</span>
                          </>
                        ) : (
                          <span>Friendbot Faucet</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TASK 3: FIRST ON-CHAIN TRANSACTION */}
          <div className={`glass-panel p-6 rounded-2xl border-l-4 transition-all duration-300 ${
            task3Done ? 'border-l-accent-green bg-accent-green/[0.01]' : 'border-l-indigo-500'
          }`}>
            <div className="space-y-1 mb-4">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Task 3</span>
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                Stellar First Transaction
                {task3Done && <CheckCircle2 className="h-4.5 w-4.5 text-accent-green fill-emerald-950" />}
              </h3>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-text-secondary">
                Submit an on-chain transaction. By default, this builds a **self-payment** transaction (sending XLM back to yourself), which is the safest and most direct way to test transaction signing and broadcast without requiring a third-party account.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Destination Input */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                    Destination Address (G...)
                  </label>
                  <input
                    type="text"
                    value={txDestination}
                    onChange={(e) => setTxDestination(e.target.value)}
                    placeholder="Enter Stellar public key"
                    className="w-full bg-bg-dark border border-border-subtle rounded-xl px-3.5 py-2 text-xs font-mono text-text-secondary focus:outline-none focus:border-accent-purple transition-colors"
                    disabled={!wallet || isSubmittingTx}
                  />
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                    Amount (XLM)
                  </label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="10"
                    className="w-full bg-bg-dark border border-border-subtle rounded-xl px-3.5 py-2 text-xs font-bold text-text-secondary focus:outline-none focus:border-accent-purple transition-colors"
                    disabled={!wallet || isSubmittingTx}
                  />
                </div>
              </div>

              {/* Submit Button & Transaction hash display */}
              <div className="pt-2 space-y-4">
                <button
                  onClick={sendTransaction}
                  disabled={!wallet || !task2Done || isSubmittingTx}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-accent-purple hover:from-indigo-600 hover:to-accent-purple/90 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold interactive-action shadow-lg cursor-pointer"
                >
                  {isSubmittingTx ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing & Broadcasting Transaction...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Sign & Broadcast First Transaction</span>
                    </>
                  )}
                </button>

                {txHash && (
                  <div className="p-4 rounded-xl bg-accent-green/5 border border-accent-green/20 space-y-2">
                    <span className="text-[10px] font-bold text-accent-green uppercase tracking-wider block">
                      Transaction Submitted Successfully!
                    </span>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-xs text-text-secondary break-all select-all flex-grow">
                        {txHash}
                      </span>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-surface hover:bg-bg-card-hover border border-border-subtle text-text-secondary hover:text-text-primary rounded-lg text-[10px] font-bold transition-all"
                      >
                        <span>Stellar Expert</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

          {/* Right column: Stellar White Belt Info & Realtime Terminal */}
          <div className="space-y-4 sm:space-y-6">

            {/* Challenge Reference Panel */}
            <div className="glass-card">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <div className="icon-glow-box flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-violet-400" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.6))' }} />
                </div>
                White Belt Quick Study
              </h3>

              <div className="text-xs text-slate-400 space-y-4">
                <div>
                  <h4 className="font-bold text-white flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    What is a Stellar Wallet?
                  </h4>
                  <p className="leading-relaxed">
                    A Stellar wallet is a cryptographic keypair consisting of a <strong className="text-slate-200">Public Key</strong> (starts with 'G', acts as your address) and a <strong className="text-slate-200">Secret Key</strong> (starts with 'S', authorizes operations).
                  </p>
                </div>

                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

                <div>
                  <h4 className="font-bold text-white flex items-center gap-1.5 mb-1">
                    <Info className="h-3.5 w-3.5 text-cyan-400" />
                    Public vs Secret Key
                  </h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-slate-200">Public Key:</strong> Shared freely. Used to send funds or lookup account balances.</li>
                    <li><strong className="text-slate-200">Secret Key:</strong> Strictly private. Used to sign transactions.</li>
                  </ul>
                </div>

                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

                <div>
                  <h4 className="font-bold text-white flex items-center gap-1.5 mb-1">
                    <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                    Understanding Friendbot & Horizon
                  </h4>
                  <p className="leading-relaxed">
                    <strong className="text-slate-200">Horizon</strong> is Stellar's REST API. <strong className="text-slate-200">Friendbot</strong> is a free testnet faucet that funds new accounts with 10,000 testnet XLM.
                  </p>
                </div>
              </div>
            </div>

            {/* Real-time Ledger Logs Console */}
            <div
              className="rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col"
              style={{ background: '#06060a', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.50)', minHeight: '300px' }}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-emerald-400" style={{ filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.5))' }} />
                  Horizon Ledger Console
                </h3>
                <button
                  onClick={clearPlayground}
                  className="text-[10px] text-slate-600 hover:text-rose-400 font-bold transition-all cursor-pointer"
                >
                  Clear Wallet & Logs
                </button>
              </div>

              <div
                className="flex-grow rounded-xl p-3 font-mono text-[10px] overflow-y-auto overflow-x-auto space-y-2"
                style={{ background: 'rgba(0,0,0,0.60)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                {logs.length === 0 ? (
                  <span className="text-slate-600 block italic">System idle. Actions will log here…</span>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed whitespace-pre-wrap break-all">
                      <span className="text-slate-600">[{log.timestamp}]</span>{' '}
                      <span className={
                        log.type === 'success' ? 'text-emerald-400 font-bold' :
                        log.type === 'error'   ? 'text-rose-400 font-bold' :
                        'text-slate-300'
                      }>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

      </div>
    </div>
  );
};
