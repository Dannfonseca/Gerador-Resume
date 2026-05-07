import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import ArticleView from './components/ArticleView';
import ResumeView from './components/ResumeView';
import AiGeneratorView from './components/AiGeneratorView';
import './App.css';

const queryClient = new QueryClient();

function AppContent() {
  const [activeView, setActiveView] = useState('ai-generator');
  const [activeResume, setActiveResume] = useState('paula');

  return (
    <div className="app-container">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        activeResume={activeResume}
        setActiveResume={setActiveResume}
      />
      <main className="main-content">
        {activeView === 'article' && <ArticleView />}
        {activeView === 'resume' && <ResumeView activeResume={activeResume} />}
        {activeView === 'ai-generator' && <AiGeneratorView />}
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
