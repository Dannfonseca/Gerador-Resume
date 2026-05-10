import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import AiGeneratorView from './components/AiGeneratorView';
import DocsView from './components/DocsView';
import './App.css';

const queryClient = new QueryClient();

function AppContent() {
  const [currentStep, setCurrentStep] = useState('input');
  const [prevStep, setPrevStep] = useState('input');

  const handleGoToDocs = () => {
    setPrevStep(currentStep);
    setCurrentStep('docs');
  };

  return (
    <div className="app-container">
      <Sidebar currentStep={currentStep} onGoToDocs={handleGoToDocs} />
      <main className="main-content">
        {currentStep === 'docs' ? (
          <DocsView onBack={() => setCurrentStep(prevStep)} />
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
