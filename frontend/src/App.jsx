import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import AiGeneratorView from './components/AiGeneratorView';
import './App.css';

const queryClient = new QueryClient();

function AppContent() {
  const [currentStep, setCurrentStep] = useState('input');

  return (
    <div className="app-container">
      <Sidebar currentStep={currentStep} />
      <main className="main-content">
        <AiGeneratorView currentStep={currentStep} setCurrentStep={setCurrentStep} />
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
