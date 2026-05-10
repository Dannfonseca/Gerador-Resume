import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import AiGeneratorView from './components/AiGeneratorView';
import DocsView from './components/DocsView';
import './App.css';

const queryClient = new QueryClient();

function AppContent() {
  const [currentStep, setCurrentStep] = useState('input');
  const [activeTab, setActiveTab] = useState('app'); // 'app' or 'docs'
  const [prevStep, setPrevStep] = useState('input');

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
      />
      <main className="main-content">
        {activeTab === 'docs' ? (
          <DocsView onBack={() => setActiveTab('app')} />
        ) : (
          <AiGeneratorView currentStep={currentStep} setCurrentStep={setCurrentStep} />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
