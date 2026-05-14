import { FileText, Target, CheckSquare, CheckCircle, Key, Zap, Settings } from 'lucide-react';
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
          <span className="badge docs-badge">Guia de Uso v2.0</span>
          <button onClick={onBack} className="btn-secondary docs-back-btn">
            Voltar ao App
          </button>
        </div>
        <h1 className="docs-title">Como usar o ATS Pro</h1>
        <p className="docs-subtitle">
          Aprenda a transformar seu currículo em um ímã de recrutadores seguindo nossa metodologia de 5 passos.
        </p>
      </header>

      <div className="docs-content">
        
        <section className="docs-section">
          <h3 className="docs-section-title">
            <Settings size={24} color="var(--tertiary)" /> 1. Configurações Iniciais
          </h3>
          <p className="docs-section-desc">
            Antes de gerar seu primeiro currículo, configure suas preferências no menu lateral (ícone de engrenagem).
          </p>
          <div className="docs-grid">
            <div className="doc-card">
              <h4 className="doc-card-header"><Key size={18} /> Chaves de API</h4>
              <p className="doc-card-text">
                O sistema precisa de uma conexão com as IAs para funcionar. Adicione sua chave do <strong>Google Gemini</strong> (gratuita), <strong>OpenAI</strong> ou <strong>Anthropic</strong> nas configurações. Suas chaves ficam salvas localmente no seu navegador e não são armazenadas no servidor.
              </p>
            </div>
            <div className="doc-card">
              <h4 className="doc-card-header"><Zap size={18} /> Modelos Multimodais</h4>
              <p className="doc-card-text">
                Você pode alternar livremente entre mais de 18 modelos de Inteligência Artificial. Recomendamos os modelos mais modernos e rápidos (como o Gemini 1.5 Flash ou GPT-4o-mini) para eficiência.
              </p>
            </div>
          </div>
        </section>

        <section className="docs-section">
          <h3 className="docs-section-title">
            <FileText size={24} color="var(--tertiary)" /> 2. O Pipeline de 5 Passos
          </h3>
          <p className="docs-section-desc">Nosso processo guiado garante máxima aderência aos sistemas de rastreamento de candidatos (ATS).</p>
          
          <div className="docs-terminal-box">
             <div className="docs-code-comment">Passo 1: Upload & Vaga</div>
             <div className="docs-code-line">Faça o upload do seu currículo base (PDF ou DOCX) e cole a descrição da vaga desejada. Você pode escolher seu idioma (Português ou Inglês).</div>
             
             <div className="docs-code-comment" style={{ marginTop: '20px' }}>Passo 2: Diagnóstico ATS</div>
             <div className="docs-code-line">A Inteligência Artificial fará um raio-x do seu perfil comparando-o com a vaga, gerando um ATS Score preciso e apontando os pontos fracos.</div>

             <div className="docs-code-comment" style={{ marginTop: '20px' }}>Passo 3: Nível de Agressividade (Override)</div>
             <div className="docs-code-line">Defina quanta liberdade a IA terá na reescrita. Escolha entre um polimento simples (Conservador) ou uma transformação completa (Agressivo).</div>

             <div className="docs-code-comment" style={{ marginTop: '20px' }}>Passo 4: Boost de Palavras-Chave</div>
             <div className="docs-code-line">Selecione as keywords sugeridas pela IA que faltavam no seu currículo. Elas serão inseridas de forma natural nas suas experiências no próximo passo.</div>

             <div className="docs-code-comment" style={{ marginTop: '20px' }}>Passo 5: Resultado & Exportação</div>
             <div className="docs-code-line">Seu novo currículo está pronto! Alterne entre os temas disponíveis (Ats Basic, Professional, etc) e salve como PDF no próprio navegador (Ctrl+P).</div>
          </div>
        </section>

        <section className="docs-info-box">
          <h3 className="docs-info-title">
            <Target size={24} /> Dica Profissional
          </h3>
          <p className="docs-info-text">
            O ATS Pro atinge sua eficácia máxima quando você fornece a <strong>Descrição da Vaga</strong>. Com a descrição da vaga colada no passo 1, o modelo reformulará ativamente suas experiências passadas para destacar as tecnologias e os verbos de ação que o recrutador específico está buscando.
          </p>
        </section>

      </div>

      <footer className="docs-footer">
        <button onClick={onBack} className="btn-primary docs-start-btn">
          <CheckCircle size={20} /> Entendi, vamos começar!
        </button>
      </footer>
    </motion.div>
  );
}
