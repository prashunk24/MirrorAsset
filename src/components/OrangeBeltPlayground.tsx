import React, { useState, useEffect } from 'react';
import { useStellar } from '../context/StellarContext';
import { 
  Horizon, 
  Networks, 
  TransactionBuilder, 
  Contract, 
  Address, 
  rpc, 
  scValToNative, 
  xdr 
} from '@stellar/stellar-sdk';
import { 
  StellarWalletsKit, 
  Networks as WalletKitNetworks,
  selectedNetwork
} from '@creit.tech/stellar-wallets-kit';
import { 
  Wallet, 
  Send, 
  Terminal, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

const CONTRACT_ID = (import.meta.env.VITE_VAULT_CONTRACT_ID as string) || 'CACI5JARB6WERDJZUTXPN357Q5PDSADLJ6XICJJE3XSKCOB62EMYXQ2D';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

interface ContractEvent {
  id: string;
  ledger: number;
  topics: string[];
  value: any;
}

export const OrangeBeltPlayground: React.FC = () => {
  const { addToast } = useStellar();

  // Wallet Connection States
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Contract Read State
  const [vaultData, setVaultData] = useState<{ collateral: number; debt: number } | null>(null);
  const [isReadingContract, setIsReadingContract] = useState(false);

  // Contract Write State
  const [depositAmount, setDepositAmount] = useState('10');
  const [writeStatus, setWriteStatus] = useState<'Idle' | 'Pending' | 'Success' | 'Failed'>('Idle');
  const [writeTxHash, setWriteTxHash] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);

  // Event Listener State
  const [contractEvents, setContractEvents] = useState<ContractEvent[]>([]);
  const [isListeningEvents, setIsListeningEvents] = useState(false);

  // Logs terminal
  const [logs, setLogs] = useState<{ timestamp: string; type: 'info' | 'success' | 'error'; message: string }[]>([]);

  const addLog = (type: 'info' | 'success' | 'error', message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{ timestamp, type, message }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    addLog('info', 'Orange Belt Playground initialized.');
    addLog('info', `Target contract deployed on Testnet: ${CONTRACT_ID}`);
  }, []);

  // Poll for balance and vault data once connected
  useEffect(() => {
    if (publicKey) {
      fetchWalletState();
      // Start event polling
      setIsListeningEvents(true);
    } else {
      setIsListeningEvents(false);
      setBalance(null);
      setVaultData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  // Periodic Event Polling (simulating event listener)
  useEffect(() => {
    if (!isListeningEvents) return;

    const interval = setInterval(() => {
      pollContractEvents();
    }, 10000); // Poll events every 10s

    pollContractEvents(); // Immediate call

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListeningEvents]);

  const fetchWalletState = async () => {
    if (!publicKey) return;
    await checkBalance();
    await readContractVault();
  };

  // Wallet Connection via Wallets Kit (Static UI Modal)
  const connectWallet = async () => {
    setIsConnecting(true);
    addLog('info', 'Opening multi-wallet authentication modal...');

    try {
      // Set network passphrase
      selectedNetwork.value = WalletKitNetworks.TESTNET;
      
      // Call static authModal
      const result = await StellarWalletsKit.authModal();
      const address = result.address;
      
      setPublicKey(address);
      setWalletConnected(true);
      addLog('success', `Wallet connected! Active address: ${address}`);
      addToast('success', 'Wallet Connected', `Connected successfully.`);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message || 'Closed by user';
      addLog('error', `Connection failed: ${errorMsg}`);
      addToast('error', 'Connection Failed', errorMsg);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await StellarWalletsKit.disconnect();
      setWalletConnected(false);
      setPublicKey(null);
      setBalance(null);
      setVaultData(null);
      addLog('info', 'Wallet disconnected.');
      addToast('info', 'Disconnected', 'Wallet session closed.');
    } catch (error: any) {
      console.error(error);
    }
  };

  // Fetch XLM Balance from Horizon
  const checkBalance = async () => {
    if (!publicKey) return;
    try {
      const server = new Horizon.Server(HORIZON_URL);
      const accountInfo = await server.loadAccount(publicKey);
      const nativeBalance = accountInfo.balances.find(b => b.asset_type === 'native');
      setBalance(nativeBalance ? nativeBalance.balance : '0');
      addLog('info', `Fetched wallet XLM balance: ${nativeBalance?.balance} XLM`);
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        setBalance('0 (Unfunded)');
        addLog('error', 'Account is unfunded. Fund it via the White Belt tab faucet.');
      } else {
        addLog('error', `Failed to retrieve balance: ${err.message}`);
      }
    }
  };

  // Soroban Read: get_vault(user)
  const readContractVault = async () => {
    if (!publicKey) return;
    setIsReadingContract(true);
    addLog('info', 'Reading vault data from Soroban smart contract...');

    try {
      const rpcServer = new rpc.Server(RPC_URL);
      const server = new Horizon.Server(HORIZON_URL);
      const account = await server.loadAccount(publicKey);
      const contract = new Contract(CONTRACT_ID);
      const userAddress = new Address(publicKey);

      // Construct a dummy transaction to simulate calling `get_vault`
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE
      })
        .addOperation(contract.call('get_vault', userAddress.toScVal()))
        .setTimeout(30)
        .build();

      const simResponse = await rpcServer.simulateTransaction(tx);
      
      if (rpc.Api.isSimulationSuccess(simResponse) && simResponse.result) {
        const resultVal = simResponse.result.retval;
        const parsedVault = scValToNative(resultVal);
        
        // Contract stores collateral and debt. Let's normalize it from stroops (7 decimals)
        const collateral = Number(parsedVault.collateral_amount) / 10_000_000;
        const debt = Number(parsedVault.minted_amount) / 10_000_000;
        
        setVaultData({ collateral, debt });
        addLog('success', `Read contract success: Collateral: ${collateral} XLM, Minted Debt: ${debt}`);
      } else {
        throw new Error('Simulation failed. Target contract might not be initialized or incorrect method.');
      }
    } catch (err: any) {
      console.error(err);
      addLog('error', `Failed to read contract data: ${err.message}`);
    } finally {
      setIsReadingContract(false);
    }
  };

  // Soroban Write: deposit_collateral(user, amount)
  const writeDepositContract = async () => {
    if (!publicKey) return;
    setWriteStatus('Pending');
    setWriteTxHash(null);
    setWriteError(null);
    addLog('info', `Building deposit_collateral transaction for ${depositAmount} XLM...`);

    try {
      const server = new Horizon.Server(HORIZON_URL);
      const rpcServer = new rpc.Server(RPC_URL);
      const account = await server.loadAccount(publicKey);
      const contract = new Contract(CONTRACT_ID);
      const userAddress = new Address(publicKey);

      // Amount formatted in i128 stroops (7 decimals)
      const amountStroops = BigInt(Math.floor(parseFloat(depositAmount) * 10_000_000));
      const amountScVal = xdr.ScVal.scvI128(new xdr.Int128Parts({
        hi: new xdr.Int64(0n),
        lo: new xdr.Uint64(amountStroops)
      }));

      // Build contract call transaction
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE
      })
        .addOperation(contract.call('deposit_collateral', userAddress.toScVal(), amountScVal))
        .setTimeout(30)
        .build();

      addLog('info', 'Simulating write transaction...');
      const simResponse = await rpcServer.simulateTransaction(tx);
      
      if (!rpc.Api.isSimulationSuccess(simResponse)) {
        throw new Error(`Simulation failed. Check if wallet has enough funds.`);
      }

      addLog('info', 'Assembling transaction parameters (setting footprints and fee)...');
      const assembledTx = rpc.assembleTransaction(tx, simResponse).build();

      addLog('info', 'Requesting signature from connected wallet...');
      const unsignedXdr = assembledTx.toXDR();
      
      // Call static signTransaction
      const signResponse = await StellarWalletsKit.signTransaction(unsignedXdr, {
        networkPassphrase: WalletKitNetworks.TESTNET
      });
      
      const signedTx = TransactionBuilder.fromXDR(signResponse.signedTxXdr, NETWORK_PASSPHRASE);
      
      addLog('info', 'Broadcasting signed transaction to Soroban network...');
      const sendResponse = await rpcServer.sendTransaction(signedTx);
      
      if (sendResponse.status === 'ERROR') {
        throw new Error(`Failed to submit transaction: ${JSON.stringify(sendResponse.errorResult)}`);
      }

      setWriteTxHash(sendResponse.hash);
      addLog('info', `Transaction submitted. Hash: ${sendResponse.hash}. Awaiting ledger confirmation...`);

      // Poll transaction status
      let pollCount = 0;
      let succeeded = false;
      while (pollCount < 15) {
        const getTxResponse = await rpcServer.getTransaction(sendResponse.hash);
        if (getTxResponse.status === 'SUCCESS') {
          succeeded = true;
          break;
        } else if (getTxResponse.status === 'FAILED') {
          throw new Error('On-chain execution failed.');
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        pollCount++;
      }

      if (succeeded) {
        setWriteStatus('Success');
        addLog('success', 'On-chain deposit succeeded!');
        addToast('success', 'Deposit Succeeded', `Deposited ${depositAmount} XLM to vault.`);
        
        // Fetch updated state
        fetchWalletState();
      } else {
        throw new Error('Transaction confirmation timed out.');
      }
    } catch (err: any) {
      console.error(err);
      setWriteStatus('Failed');
      setWriteError(err.message || 'Unknown write error');
      addLog('error', `Write transaction failed: ${err.message || 'Unknown error'}`);
    }
  };

  // Poll Soroban events to fulfill event listening requirement
  const pollContractEvents = async () => {
    try {
      const rpcServer = new rpc.Server(RPC_URL);
      const latestLedgerResponse = await rpcServer.getLatestLedger();
      const latestLedger = latestLedgerResponse.sequence;

      // Query events from past 100 ledgers
      const eventsResponse = await rpcServer.getEvents({
        startLedger: Math.max(1, latestLedger - 100),
        filters: [{
          type: 'contract',
          contractIds: [CONTRACT_ID]
        }],
        limit: 10
      });

      if (eventsResponse.events && eventsResponse.events.length > 0) {
        const parsedEvents: ContractEvent[] = eventsResponse.events.map(ev => {
          // Parse topics and value
          const topics = ev.topic.map(t => {
            try { return scValToNative(t).toString(); } catch { return 'unknown'; }
          });
          let value = 'unknown';
          try {
            value = JSON.stringify(scValToNative(ev.value));
          } catch {}

          return {
            id: ev.id,
            ledger: ev.ledger,
            topics,
            value
          };
        });

        // Check if there are new events to trigger auto UI refresh
        const existingIds = new Set(contractEvents.map(e => e.id));
        const newEvents = parsedEvents.filter(e => !existingIds.has(e.id));
        
        if (newEvents.length > 0) {
          setContractEvents(parsedEvents);
          addLog('info', `Detected ${newEvents.length} new contract events. Auto-refreshing UI state...`);
          // Trigger automatic UI state refresh
          fetchWalletState();
        }
      }
    } catch (err) {
      console.error('Failed to poll contract events:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Upper header */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan rounded-full text-xs font-semibold">
            <Cpu className="h-3.5 w-3.5 animate-spin" />
            <span>Stellar Orange Belt Challenge</span>
          </div>
          <h2 className="text-3xl font-extrabold text-text-primary">Soroban Smart Contract Playground</h2>
          <p className="text-sm text-text-secondary">
            Interact with our deployed contract on Testnet using **StellarWalletsKit** to support multiple wallet extensions, perform read/write contract calls, and listen for live network events.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 cols): Multi-wallet connect and Write Contract */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* MULTI-WALLET CONNECT */}
          <div className={`glass-panel p-6 rounded-2xl border-l-4 ${walletConnected ? 'border-l-accent-green' : 'border-l-accent-purple'}`}>
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center justify-between">
              <span>Multi-Wallet Connection</span>
              {walletConnected && (
                <span className="px-2 py-0.5 rounded bg-accent-green/10 text-accent-green border border-accent-green/20 text-xs font-medium">Connected</span>
              )}
            </h3>

            {walletConnected && publicKey ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-2">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-semibold block">Connected Wallet Address</span>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-xs text-text-secondary break-all select-all">{publicKey}</span>
                    <button
                      onClick={disconnectWallet}
                      className="px-3 py-1.5 bg-accent-red/10 hover:bg-accent-red/20 text-accent-red rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-bg-surface/60 border border-border-subtle">
                    <span className="text-[10px] text-text-muted uppercase tracking-widest font-semibold block">Connected Status</span>
                    <span className="text-sm font-bold text-text-primary mt-1 block capitalize">Wallet Connected</span>
                  </div>
                  <div className="p-4 rounded-xl bg-bg-surface/60 border border-border-subtle">
                    <span className="text-[10px] text-text-muted uppercase tracking-widest font-semibold block">Horizon Wallet Balance</span>
                    <span className="text-sm font-bold text-text-primary mt-1 block">{balance ? `${balance} XLM` : 'Loading...'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-text-secondary">
                  Select your preferred browser wallet extension to connect. The kit supports multiple providers out-of-the-box.
                </p>
                
                <div className="flex justify-start">
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-accent-purple to-indigo-600 hover:from-accent-purple hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4" />
                        <span>Connect via StellarWalletsKit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* READ CONTRACT DATA */}
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-accent-cyan space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Layers className="h-5 w-5 text-accent-cyan" />
                Read Contract: Vault Health
              </h3>
              <button
                onClick={readContractVault}
                disabled={!walletConnected || isReadingContract}
                className="p-1.5 bg-bg-surface hover:bg-bg-card-hover border border-border-subtle rounded-lg text-text-muted hover:text-text-primary transition-all cursor-pointer"
                title="Refresh contract state"
              >
                <RefreshCw className={`h-4 w-4 ${isReadingContract ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {!walletConnected ? (
              <div className="p-4 bg-bg-surface/40 border border-border-subtle rounded-xl text-center text-xs text-text-muted">
                Connect your wallet to fetch your live on-chain vault data.
              </div>
            ) : vaultData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase tracking-widest font-semibold block">On-Chain Collateral</span>
                    <span className="text-xl font-black text-text-primary mt-1 block">{vaultData.collateral.toLocaleString()} XLM</span>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-accent-green" />
                </div>

                <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase tracking-widest font-semibold block">On-Chain Minted Debt</span>
                    <span className="text-xl font-black text-text-primary mt-1 block">{vaultData.debt.toLocaleString()} sXAU</span>
                  </div>
                  <Sparkles className="h-5 w-5 text-accent-cyan" />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-bg-surface/40 border border-border-subtle rounded-xl text-center text-xs text-text-muted">
                Loading vault data from Soroban ledger...
              </div>
            )}
          </div>

          {/* WRITE CONTRACT TRANSACTION */}
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-indigo-500 space-y-4">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-400" />
              Write Contract: Deposit Collateral
            </h3>

            <div className="space-y-4">
              <p className="text-xs text-text-secondary">
                Lock XLM collateral directly inside our deployed Testnet Soroban contract. This builds a Soroban contract invocation transaction, simulates footprint assembly, requests user wallet signature, and broadcasts it to the ledger.
              </p>

              <div>
                <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Amount to Deposit (XLM)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="10"
                    disabled={!walletConnected || writeStatus === 'Pending'}
                    className="flex-grow bg-bg-dark border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-bold text-text-secondary focus:outline-none focus:border-accent-purple transition-colors"
                  />
                  <button
                    onClick={writeDepositContract}
                    disabled={!walletConnected || writeStatus === 'Pending' || parseFloat(depositAmount) <= 0}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-accent-purple hover:from-indigo-600 hover:to-accent-purple/90 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    {writeStatus === 'Pending' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Deposit Collateral</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Board */}
              {writeStatus !== 'Idle' && (
                <div className={`p-4 rounded-xl border ${
                  writeStatus === 'Pending' ? 'bg-accent-amber/5 border-accent-amber/20 text-accent-amber' :
                  writeStatus === 'Success' ? 'bg-accent-green/5 border-accent-green/20 text-accent-green' :
                  'bg-accent-red/5 border-accent-red/20 text-accent-red'
                } space-y-2`}>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    {writeStatus === 'Pending' && <Loader2 className="h-4 w-4 animate-spin" />}
                    {writeStatus === 'Success' && <CheckCircle2 className="h-4 w-4" />}
                    {writeStatus === 'Failed' && <XCircle className="h-4 w-4" />}
                    <span>Transaction Status: {writeStatus}</span>
                  </div>
                  
                  {writeTxHash && (
                    <div className="flex items-center justify-between gap-4 text-xs font-mono pt-1 text-text-secondary">
                      <span className="break-all select-all flex-grow">{writeTxHash}</span>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${writeTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-surface hover:bg-bg-card-hover border border-border-subtle text-text-secondary hover:text-text-primary rounded-lg text-[10px] font-bold transition-all"
                      >
                        <span>View</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {writeError && (
                    <p className="text-[10px] text-accent-red leading-relaxed font-mono">
                      Error: {writeError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Event list & Logs terminal */}
        <div className="space-y-6">
          
          {/* Smart Contract Info */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-accent-cyan" />
              Contract Parameters
            </h3>
            <div className="text-xs text-text-secondary space-y-3">
              <div>
                <span className="text-text-muted block">Deployed Contract ID</span>
                <span className="font-mono text-text-secondary break-all text-[10px]">{CONTRACT_ID}</span>
              </div>
              <div className="w-full h-[1px] bg-border-subtle"></div>
              <div>
                <span className="text-text-muted block">Network</span>
                <span className="text-text-secondary font-bold">Stellar Testnet</span>
              </div>
              <div className="w-full h-[1px] bg-border-subtle"></div>
              <div>
                <span className="text-text-muted block">Network Passphrase</span>
                <span className="text-text-secondary font-mono text-[10px]">Test SDF Network ; September 2015</span>
              </div>
            </div>
          </div>

          {/* EVENT LISTENER */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col h-[320px]">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Sparkles className="h-4 w-4 text-accent-cyan" />
              Live Soroban Events
            </h3>
            
            <div className="flex-grow bg-bg-dark rounded-xl p-3 font-mono text-[10px] overflow-y-auto border border-border-subtle space-y-3">
              {contractEvents.length === 0 ? (
                <span className="text-text-muted block italic">Listening for events... Make a contract deposit.</span>
              ) : (
                contractEvents.map((ev, idx) => (
                  <div key={idx} className="border-b border-border-subtle pb-2 space-y-1 leading-relaxed">
                    <div className="flex justify-between items-center text-text-muted">
                      <span>Ledger: {ev.ledger}</span>
                      <span>ID: {ev.id.substring(0, 8)}...</span>
                    </div>
                    <div>
                      <span className="text-accent-cyan font-bold">Topic:</span>{' '}
                      <span className="text-text-secondary">{ev.topics.join(' ➡️ ')}</span>
                    </div>
                    <div>
                      <span className="text-indigo-400 font-bold">Data:</span>{' '}
                      <span className="text-text-muted break-all">{ev.value}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* REALTIME SYSTEM TERMINAL */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col h-[280px]">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Terminal className="h-4 w-4 text-accent-green" />
              Soroban RPC Console
            </h3>
            <div className="flex-grow bg-bg-dark rounded-xl p-3 font-mono text-[10px] overflow-y-auto border border-border-subtle space-y-2">
              {logs.length === 0 ? (
                <span className="text-text-muted block italic">No logs...</span>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-text-muted">[{log.timestamp}]</span>{' '}
                    <span className={
                      log.type === 'success' ? 'text-accent-green font-bold' :
                      log.type === 'error' ? 'text-accent-red font-bold' :
                      'text-text-secondary'
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
