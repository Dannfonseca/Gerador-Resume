import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import AiGeneratorView from './components/AiGeneratorView';
import './App.css';

const queryClient = new QueryClient();

function AppContent() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <AiGeneratorView />
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
