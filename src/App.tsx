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

import { WhiteBeltPlayground } from './components/WhiteBeltPlayground';

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
        return <WhiteBeltPlayground />;
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
    <div className="min-h-screen bg-bg-dark text-text-primary flex flex-col justify-between selection:bg-accent-purple/35 selection:text-white">
      <div>
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

        <main className="flex-grow">
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
