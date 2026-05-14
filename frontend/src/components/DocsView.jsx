import { Terminal, Settings, Key, Zap, CheckCircle, Info, Cpu, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DocsView({ onBack }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="docs-container glass-panel article-container" 
    >
      <header className="article-header">
        <div className="docs-header-top">
          <span className="badge docs-badge">Guia de Instalação v2.0</span>
          <button onClick={onBack} className="btn-secondary docs-back-btn">
            Voltar ao App
          </button>
        </div>
        <h1 className="docs-title">Como Executar o Projeto</h1>
        <p className="docs-subtitle">
          Configuração rápida para rodar o ATS Pro na sua máquina com suporte a múltiplos modelos de IA.
        </p>
      </header>

      <div className="docs-content">
        
        <section className="docs-section">
          <h3 className="docs-section-title">
            <Info size={24} color="var(--tertiary)" /> 1. Pré-requisitos
          </h3>
          <div className="docs-grid">
            <div className="doc-card">
              <h4 className="doc-card-header"><Cpu size={18} /> Motores de Execução</h4>
              <p className="doc-card-text">Instale os runtimes necessários para rodar o app:</p>
              <ul className="doc-list">
                <li>
                  <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="doc-link">Node.js</a>: <code>winget install OpenJS.NodeJS</code>
                </li>
                <li>
                  <a href="https://bun.sh" target="_blank" rel="noreferrer" className="doc-link">Bun</a>: <code>irm bun.sh/install.ps1 | iex</code>
                </li>
              </ul>
            </div>
            <div className="doc-card">
              <h4 className="doc-card-header"><Settings size={18} /> Ferramentas</h4>
              <p className="doc-card-text">Editores e extensões recomendadas:</p>
              <ul className="doc-list">
                <li>
                  <a href="https://code.visualstudio.com/" target="_blank" rel="noreferrer" className="doc-link">VS Code</a>: Editor oficial.
                </li>
                <li>
                  <a href="https://antigravity.dev" target="_blank" rel="noreferrer" className="doc-link">Antigravity</a>: IA que construiu este projeto.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="docs-section">
          <h3 className="docs-section-title">
            <Terminal size={24} color="var(--tertiary)" /> 2. Comandos no Terminal
          </h3>
          <div className="docs-terminal-box">
             <div className="docs-terminal-icon"><Terminal size={40} /></div>
             <div className="docs-code-comment"># Instalar dependências</div>
             <div className="docs-code-cmd">npm install</div>
             
             <div className="docs-code-comment" style={{ marginTop: '20px' }}># Liberar execução de scripts (Windows)</div>
             <div className="docs-code-cmd">Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser</div>

             <div className="docs-code-comment" style={{ marginTop: '20px' }}># Rodar em modo Desenvolvimento</div>
             <div className="docs-code-line">npm run dev:frontend <span className="docs-code-comment"># Terminal 1</span></div>
             <div className="docs-code-line">npm run dev:backend <span className="docs-code-comment"># Terminal 2</span></div>
          </div>
        </section>

        <section className="docs-section">
          <h3 className="docs-section-title">
            <Key size={24} color="var(--tertiary)" /> 3. Configurando a Inteligência Artificial
          </h3>
          <p className="docs-section-desc">
            O ATS Pro é <strong>multimodelo</strong>. Você só precisa configurar <strong>uma das chaves abaixo</strong> para o sistema funcionar, mas pode configurar ambas para ter redundância.
          </p>
          <div className="docs-grid">
            <div className="doc-card ai-card gemini">
              <h4 className="doc-card-header">
                <ShieldCheck size={18} color="#8b5cf6" /> Google Gemini (Padrão)
              </h4>
              <p className="doc-card-text">
                Recomendado para uso gratuito. Se configurado, o sistema usará este como motor principal.
              </p>
            </div>
            <div className="doc-card ai-card openai">
              <h4 className="doc-card-header">
                <Key size={18} color="#10a37f" /> OpenAI GPT (Fallback)
              </h4>
              <p className="doc-card-text">
                Pode ser usado como motor principal ou como backup automático caso o Gemini falhe.
              </p>
            </div>
          </div>
        </section>

        <section className="docs-info-box">
          <h3 className="docs-info-title">
            <Zap size={24} /> Por que usar Fallback?
          </h3>
          <p className="docs-info-text">
            Se você atingir o limite de requisições do Gemini Free, o sistema mudará instantaneamente para o ChatGPT para que você nunca pare sua produtividade.
          </p>
        </section>

      </div>

      <footer className="docs-footer">
        <button onClick={onBack} className="btn-primary docs-start-btn">
          <CheckCircle size={20} /> Tudo pronto, vamos começar!
        </button>
      </footer>
    </motion.div>
  );
}
