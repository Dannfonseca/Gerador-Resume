import { FileText, Target, CheckCircle, Key, Zap, Settings, Info, Briefcase, BookOpen, Layers, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DocsView({ onBack }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="docs-container glass-panel article-container" 
      style={{ background: 'var(--neutral)', border: '1px solid var(--primary)', padding: '0', overflow: 'hidden' }}
    >
      <header className="modal-standard-header" style={{ padding: '40px' }}>
        <div style={{ flex: 1 }}>
          <span className="badge" style={{ marginBottom: '12px' }}>Documentação Oficial</span>
          <h1 className="docs-title" style={{ margin: 0, fontSize: 'var(--font-h1)' }}>Career-Ops Hub</h1>
          <p className="docs-subtitle" style={{ marginTop: '8px' }}>
            Maximize suas chances em sistemas ATS com nossa plataforma de gestão de carreira e otimização por IA.
          </p>
        </div>
        <button onClick={onBack} className="icon-btn-red" style={{ borderRadius: '4px' }}>
          Voltar
        </button>
      </header>

      <div className="modal-standard-body" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
        
        {/* Section 1: Master Resume */}
        <section className="docs-section">
          <h3 className="docs-section-title" style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '12px' }}>
            <BookOpen size={24} color="var(--tertiary)" /> 1. Currículo Mestre
          </h3>
          <p className="docs-section-desc">
            Seu <strong>Currículo Mestre</strong> é a base de tudo. É o documento completo com todas as suas experiências, habilidades e conquistas.
          </p>
          <div className="doc-card" style={{ padding: '24px', background: 'white', border: '1px solid var(--border-light)' }}>
            <ul className="doc-list" style={{ fontSize: 'var(--font-body)' }}>
              <li><strong>Importação Única:</strong> Faça o upload uma única vez e use como base para todas as vagas.</li>
              <li><strong>Fonte da Verdade:</strong> A IA usará este documento para extrair informações e adaptá-las contextualmente.</li>
              <li><strong>Edição Rápida:</strong> Atualize seu perfil mestre e todas as novas adaptações usarão a versão mais recente.</li>
            </ul>
          </div>
        </section>

        {/* Section 2: Pipeline Management */}
        <section className="docs-section">
          <h3 className="docs-section-title" style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '12px' }}>
            <Briefcase size={24} color="var(--tertiary)" /> 2. Gestão de Vagas (Pipeline)
          </h3>
          <p className="docs-section-desc">
            Organize suas candidaturas e acompanhe o progresso de cada oportunidade em um só lugar.
          </p>
          <div className="docs-grid">
            <div className="doc-card">
              <h4 className="doc-card-header"><Layers size={18} /> Fluxo de Status</h4>
              <p className="doc-card-text">
                Mova suas vagas entre <strong>Para Aplicar</strong>, <strong>Aplicada</strong>, <strong>Entrevista</strong> e <strong>Finalizada</strong>. Tenha controle total do seu funil de contratação.
              </p>
            </div>
            <div className="doc-card">
              <h4 className="doc-card-header"><CheckCircle size={18} /> Histórico de Versões</h4>
              <p className="doc-card-text">
                Cada vaga pode ter múltiplas versões de currículo adaptadas. Compare scores de Match e escolha a melhor versão para enviar.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Adaptation Flow */}
        <section className="docs-section">
          <h3 className="docs-section-title" style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '12px' }}>
            <Zap size={24} color="var(--tertiary)" /> 3. O Fluxo de Otimização IA
          </h3>
          <p className="docs-section-desc">Nosso processo inteligente garante que seu perfil brilhe nos sistemas de triagem automática.</p>
          
          <div className="docs-terminal-box" style={{ background: 'var(--primary)', borderRadius: '0' }}>
             <div className="docs-code-comment">Fase A: Análise de Match</div>
             <div className="docs-code-line">A IA compara seu currículo mestre com a descrição da vaga e gera um diagnóstico de compatibilidade.</div>
             
             <div className="docs-code-comment" style={{ marginTop: '20px' }}>Fase B: Seleção de Keywords</div>
             <div className="docs-code-line">Escolha as habilidades e termos técnicos sugeridos pela IA que realmente fazem parte do seu repertório.</div>

             <div className="docs-code-comment" style={{ marginTop: '20px' }}>Fase C: Adaptação de Experiência</div>
             <div className="docs-code-line">O sistema reescreve seus pontos de experiência usando verbos de ação e integrando as palavras-chave de forma natural.</div>

             <div className="docs-code-comment" style={{ marginTop: '20px' }}>Fase D: Exportação Premium</div>
             <div className="docs-code-line">Visualize o resultado final, escolha o layout (Classic, Modern ou Slate) e exporte para PDF com formatação profissional.</div>
          </div>
        </section>

        {/* Section 4: API Configuration */}
        <section className="docs-section">
          <h3 className="docs-section-title" style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '12px' }}>
            <Settings size={24} color="var(--tertiary)" /> 4. Configuração de Modelos
          </h3>
          <p className="docs-section-desc">Acesse o menu de configurações para conectar sua conta aos provedores de Inteligência Artificial.</p>
          <div className="doc-card" style={{ padding: '24px', background: 'white', border: '1px solid var(--border-light)', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 8px 0', fontFamily: "'Space Grotesk', sans-serif" }}>Chaves de API (BYOK)</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary)' }}>
                Utilizamos o modelo "Bring Your Own Key". Suas chaves ficam salvas apenas no seu navegador. Recomendamos o uso do <strong>Google Gemini 1.5 Flash</strong> por ser extremamente rápido e possuir uma camada gratuita generosa.
              </p>
            </div>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '10px 16px', fontSize: '0.7rem' }}>
              Obter Chave Gemini <ExternalLink size={12} style={{ marginLeft: '4px' }} />
            </a>
          </div>
        </section>

        <section className="docs-info-box" style={{ borderRadius: '0' }}>
          <h3 className="docs-info-title">
            <Target size={24} /> Por que Otimizar para ATS?
          </h3>
          <p className="docs-info-text">
            Mais de 90% das grandes empresas utilizam softwares de triagem. Se o seu currículo não contiver os termos exatos e a estrutura que o sistema espera, você pode ser descartado antes mesmo de um humano ler seu perfil. O <strong>Career-Ops Hub</strong> remove essa barreira técnica para você.
          </p>
        </section>

      </div>

      <footer className="modal-standard-footer" style={{ padding: '32px 40px' }}>
        <button onClick={onBack} className="btn-primary" style={{ padding: '14px 48px' }}>
          <CheckCircle size={20} /> Entendi, vamos ao trabalho!
        </button>
      </footer>
    </motion.div>
  );
}
