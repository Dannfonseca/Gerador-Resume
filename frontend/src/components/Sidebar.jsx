import { BookOpen, Zap } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon"></div>
        <h2>ATS Pro</h2>
      </div>

      <section className="ats-summary">
        <div className="ats-summary-title">
          <BookOpen size={16} />
          <span>O que é ATS?</span>
        </div>
        <p>
          ATS é o sistema que empresas usam para ler currículos, buscar palavras-chave e priorizar candidatos antes da triagem humana.
        </p>
      </section>

      <nav className="nav-menu">
        <div className="nav-section">
          <span className="nav-title">Currículo</span>
          <div className="nav-item active" aria-current="page">
            <Zap size={18} />
            Gerar Currículo ATS
          </div>
        </div>
      </nav>

      <div className="sidebar-footer">
        <p>Otimizado para Sistemas de Rastreamento.</p>
      </div>
    </aside>
  );
}
