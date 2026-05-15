import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './i18n/LanguageContext';
import Sidebar from './components/Sidebar';
import WizardEngine from './components/WizardEngine';
import DocsView from './components/DocsView';
import PipelineView from './components/PipelineView';
import MasterResumeView from './components/MasterResumeView';
import './App.css';

const queryClient = new QueryClient();

function AppContent() {
  const [currentStep, setCurrentStep] = useState('upload');
  const [activeTab, setActiveTab] = useState('app');

  const handleSwitchTab = (tab) => {
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
        ) : activeTab === 'pipeline' ? (
          <PipelineView />
        ) : activeTab === 'master' ? (
          <MasterResumeView />
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
