import { Book, Terminal, Settings, Key, Zap, CheckCircle, Info, BookOpen, Cpu, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DocsView({ onBack }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="article-container glass-panel" 
      style={{ maxWidth: '900px', margin: '0 auto', border: '1px solid var(--primary)', padding: '60px' }}
    >
      <header className="article-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="badge" style={{ background: 'var(--tertiary)', color: 'white', padding: '6px 12px' }}>Guia de Instalação v2.0</span>
          <button onClick={onBack} className="btn-secondary" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
            Voltar ao App
          </button>
        </div>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '24px' }}>Como Executar o Projeto</h1>
        <p style={{ color: 'var(--secondary)', fontSize: '1.1rem', maxWidth: '700px' }}>
          Configuração rápida para rodar o ATS Pro na sua máquina com suporte a múltiplos modelos de IA.
        </p>
      </header>

      <div className="docs-content" style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
        
        <section>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '1.5rem', borderBottom: '2px solid var(--primary)', paddingBottom: '8px' }}>
            <Info size={24} color="var(--tertiary)" /> 1. Pré-requisitos
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="doc-card" style={cardStyle}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><Cpu size={18} /> Motores de Execução</h4>
              <p style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Instale os runtimes necessários para rodar o app:</p>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem' }}>
                <li style={{ marginBottom: '8px' }}>
                  <a href="https://nodejs.org" target="_blank" rel="noreferrer" style={linkStyle}>Node.js</a>: <code>winget install OpenJS.NodeJS</code>
                </li>
                <li>
                  <a href="https://bun.sh" target="_blank" rel="noreferrer" style={linkStyle}>Bun</a>: <code>irm bun.sh/install.ps1 | iex</code>
                </li>
              </ul>
            </div>
            <div className="doc-card" style={cardStyle}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><Settings size={18} /> Ferramentas</h4>
              <p style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Editores e extensões recomendadas:</p>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem' }}>
                <li style={{ marginBottom: '8px' }}>
                  <a href="https://code.visualstudio.com/" target="_blank" rel="noreferrer" style={linkStyle}>VS Code</a>: Editor oficial.
                </li>
                <li>
                  <a href="https://antigravity.dev" target="_blank" rel="noreferrer" style={linkStyle}>Antigravity</a>: IA que construiu este projeto.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '1.5rem', borderBottom: '2px solid var(--primary)', paddingBottom: '8px' }}>
            <Terminal size={24} color="var(--tertiary)" /> 2. Comandos no Terminal
          </h3>
          <div style={{ background: '#1A1C1E', padding: '32px', borderRadius: '4px', color: '#F7F5F2', fontFamily: 'monospace', fontSize: '0.95rem', position: 'relative' }}>
             <div style={{ position: 'absolute', top: '12px', right: '12px', opacity: 0.3 }}><Terminal size={40} /></div>
             <div style={{ color: '#6C7278', marginBottom: '8px' }}># Instalar dependências</div>
             <div style={{ color: '#B8422E' }}>npm install</div>
             
             <div style={{ color: '#6C7278', margin: '20px 0 8px' }}># Liberar execução de scripts (Windows)</div>
             <div style={{ color: '#B8422E' }}>Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser</div>

             <div style={{ color: '#6C7278', margin: '20px 0 8px' }}># Rodar em modo Desenvolvimento</div>
             <div>npm run dev:frontend <span style={{ color: '#6C7278' }}># Terminal 1</span></div>
             <div>npm run dev:backend <span style={{ color: '#6C7278' }}># Terminal 2</span></div>
          </div>
        </section>

        <section>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '1.5rem', borderBottom: '2px solid var(--primary)', paddingBottom: '8px' }}>
            <Key size={24} color="var(--tertiary)" /> 3. Configurando a Inteligência Artificial
          </h3>
          <p style={{ marginBottom: '20px' }}>
            O ATS Pro é <strong>multimodelo</strong>. Você só precisa configurar <strong>uma das chaves abaixo</strong> para o sistema funcionar, mas pode configurar ambas para ter redundância.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="doc-card" style={{ ...cardStyle, borderLeft: '4px solid #8b5cf6' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldCheck size={18} color="#8b5cf6" /> Google Gemini (Padrão)
              </h4>
              <p style={{ fontSize: '0.85rem' }}>
                Recomendado para uso gratuito. Se configurado, o sistema usará este como motor principal.
              </p>
            </div>
            <div className="doc-card" style={{ ...cardStyle, borderLeft: '4px solid #10a37f' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Key size={18} color="#10a37f" /> OpenAI GPT (Fallback)
              </h4>
              <p style={{ fontSize: '0.85rem' }}>
                Pode ser usado como motor principal ou como backup automático caso o Gemini falhe.
              </p>
            </div>
          </div>
        </section>

        <section style={{ background: 'var(--primary)', padding: '32px', color: 'white', border: '1px solid var(--tertiary)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: 'var(--tertiary)' }}>
            <Zap size={24} /> Por que usar Fallback?
          </h3>
          <p style={{ fontSize: '0.95rem', opacity: 0.9 }}>
            Se você atingir o limite de requisições do Gemini Free, o sistema mudará instantaneamente para o ChatGPT para que você nunca pare sua produtividade.
          </p>
        </section>

      </div>

      <footer style={{ marginTop: '60px', paddingTop: '32px', borderTop: '2px solid var(--primary)', textAlign: 'center' }}>
        <button onClick={onBack} className="btn-primary" style={{ padding: '16px 48px', fontSize: '1rem' }}>
          <CheckCircle size={20} /> Tudo pronto, vamos começar!
        </button>
      </footer>
    </motion.div>
  );
}

const cardStyle = {
  border: '1px solid var(--border-light)',
  padding: '24px',
  background: 'white',
  boxShadow: '8px 8px 0px var(--primary)',
  display: 'flex',
  flexDirection: 'column'
};

const linkStyle = {
  color: 'var(--tertiary)',
  fontWeight: '700',
  textDecoration: 'underline'
};
