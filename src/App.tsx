import React, { useState } from 'react';
import { StellarProvider, useStellar } from './context/StellarContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { MintRedeemModal } from './components/MintRedeemModal';
import { VaultCreationModal } from './components/VaultCreationModal';
import { RedemptionPanel } from './components/RedemptionPanel';
import { LiquidationPanel } from './components/LiquidationPanel';
import { TransactionHistory } from './components/TransactionHistory';
import { ToastContainer } from './components/ToastContainer';

import { MasteryPlayground } from './components/MasteryPlayground';

const MainAppContent: React.FC = () => {
  const { walletConnected } = useStellar();
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [isCreateVaultOpen, setIsCreateVaultOpen] = useState<boolean>(false);

  // If wallet is connected, bypass landing and show dashboard (if they are on landing)
  const handleLaunch = () => {
    setActiveTab('dashboard');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingPage onLaunch={handleLaunch} />;
      case 'dashboard':
        return (
          <Dashboard
            onManageVault={(id) => setSelectedVaultId(id)}
            onCreateVaultClick={() => setIsCreateVaultOpen(true)}
          />
        );
      case 'whitebelt':
        return <MasteryPlayground />;
      case 'redemption':
        return <RedemptionPanel />;
      case 'liquidation':
        return <LiquidationPanel />;
      case 'transactions':
        return <TransactionHistory />;
      default:
        return <LandingPage onLaunch={handleLaunch} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-text-primary flex flex-col justify-between selection:bg-purple-500/35 selection:text-white relative overflow-hidden">
      {/* Ambient background vectors */}
      <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-cyan-500/6 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
      
      <div className="relative z-10">
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (!walletConnected && tab !== 'landing') {
              // Lock other tabs if wallet is disconnected
              return;
            }
            setActiveTab(tab);
          }}
        />

        {/* pt-20 clears the sticky pill navbar (≈64px) + 24px breathing room */}
        <main className="flex-grow pt-20">
          {renderActiveTab()}
        </main>
      </div>

      {/* Global Modals */}
      {selectedVaultId && (
        <MintRedeemModal
          vaultId={selectedVaultId}
          onClose={() => setSelectedVaultId(null)}
        />
      )}

      {isCreateVaultOpen && (
        <VaultCreationModal
          onClose={() => setIsCreateVaultOpen(false)}
          onSuccess={(id) => {
            setIsCreateVaultOpen(false);
            setSelectedVaultId(id); // Immediately open management for newly created vault
          }}
        />
      )}

      {/* Elegant notifications */}
      <ToastContainer />
    </div>
  );
};

function App() {
  return (
    <StellarProvider>
      <MainAppContent />
    </StellarProvider>
  );
}

export default App;
