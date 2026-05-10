import { Book, Terminal, Settings, Key, Zap, CheckCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DocsView({ onBack }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="article-container glass-panel" 
      style={{ maxWidth: '900px', margin: '0 auto' }}
    >
      <header className="article-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="badge">Guia de Instalação</span>
          <button onClick={onBack} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
            Voltar ao App
          </button>
        </div>
        <h1>Como Executar o Projeto Localmente</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Siga os passos abaixo para configurar e rodar o ATS Pro na sua máquina.
        </p>
      </header>

      <div className="docs-content" style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        <section>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Info size={20} color="var(--primary)" /> 1. Pré-requisitos
          </h3>
          <p>Antes de começar, você precisa ter instalado:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px', lineHeight: '1.8' }}>
            <li><strong>Node.js (v18+)</strong>: O motor que roda o JavaScript.</li>
            <li><strong>Bun</strong>: Um runtime ultra-rápido usado no Backend (opcional, mas recomendado).</li>
            <li><strong>Editor de Código</strong>: Recomendamos o VS Code.</li>
          </ul>
        </section>

        <section>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Terminal size={20} color="var(--primary)" /> 2. Comandos no Terminal
          </h3>
          <p>Abra o terminal na pasta do projeto e siga esta sequência:</p>
          
          <div style={{ background: '#1e1e2e', padding: '20px', borderRadius: '8px', color: '#cdd6f4', fontFamily: 'monospace', fontSize: '0.9rem', marginTop: '12px' }}>
            <div style={{ color: '#6e6e8e', marginBottom: '8px' }}># Instalar dependências</div>
            <div>npm install</div>
            
            <div style={{ color: '#6e6e8e', margin: '16px 0 8px' }}># Se você estiver no Windows e der erro de permissão (PowerShell):</div>
            <div style={{ color: '#f38ba8' }}>Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser</div>

            <div style={{ color: '#6e6e8e', margin: '16px 0 8px' }}># Rodar o Frontend (Terminal 1)</div>
            <div>npm run dev:frontend</div>

            <div style={{ color: '#6e6e8e', margin: '16px 0 8px' }}># Rodar o Backend (Terminal 2)</div>
            <div>npm run dev:backend</div>
          </div>
        </section>

        <section>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Key size={20} color="var(--primary)" /> 3. Configurando a API Key
          </h3>
          <p>
            O projeto utiliza a inteligência do <strong>Google Gemini</strong>. Você tem duas formas de configurar sua chave:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
            <div style={{ border: '1px solid var(--border-light)', padding: '16px', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '8px' }}>Via Interface (Recomendado)</h4>
              <p style={{ fontSize: '0.85rem' }}>
                Clique no ícone de engrenagem no canto inferior do sidebar e cole sua chave. Ela será salva no seu navegador de forma segura.
              </p>
            </div>
            <div style={{ border: '1px solid var(--border-light)', padding: '16px', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '8px' }}>Via Arquivo .env</h4>
              <p style={{ fontSize: '0.85rem' }}>
                Crie um arquivo <code>.env</code> na pasta <code>backend</code> com: <code>GEMINI_API_KEY=sua_chave_aqui</code>
              </p>
            </div>
          </div>
        </section>

        <section style={{ background: 'rgba(var(--primary-rgb), 0.05)', padding: '24px', borderRadius: '12px', border: '1px solid var(--primary)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Zap size={20} color="var(--primary)" /> Dica de Ouro
          </h3>
          <p style={{ fontSize: '0.95rem' }}>
            Sempre que mudar algo no currículo, o <strong>Match Score</strong> será recalculado automaticamente para garantir que você está no caminho certo para a aprovação.
          </p>
        </section>

      </div>

      <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
        <button onClick={onBack} className="btn-primary">
          <CheckCircle size={18} /> Entendi, vamos começar!
        </button>
      </footer>
    </motion.div>
  );
}
