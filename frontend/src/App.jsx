import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './i18n/LanguageContext';
import Sidebar from './components/Sidebar';
import WizardEngine from './components/WizardEngine';
import DocsView from './components/DocsView';
import './App.css';

const queryClient = new QueryClient();

function AppContent() {
  const [currentStep, setCurrentStep] = useState('upload');
  const [activeTab, setActiveTab] = useState('app');
  const [prevStep, setPrevStep] = useState('upload');

  const handleSwitchTab = (tab) => {
    if (tab === 'docs') {
      setPrevStep(currentStep);
    }
    setActiveTab(tab);
  };

  return (
    <div className="app-container">
      <Sidebar
        currentStep={currentStep}
        activeTab={activeTab}
        onSwitchTab={handleSwitchTab}
        onNavigateStep={setCurrentStep}
      />
      <main className="main-content">
        {activeTab === 'docs' ? (
          <DocsView onBack={() => setActiveTab('app')} />
        ) : (
          <WizardEngine currentStep={currentStep} setCurrentStep={setCurrentStep} />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
