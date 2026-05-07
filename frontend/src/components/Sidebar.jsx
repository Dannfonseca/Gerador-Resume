import React from 'react';
import { BookOpen, User, FileText, Zap } from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, activeResume, setActiveResume }) {
  const handleArticleClick = () => {
    setActiveView('article');
  };

  const handleAiClick = () => {
    setActiveView('ai-generator');
  };

  const handleResumeClick = (id) => {
    setActiveView('resume');
    setActiveResume(id);
  };

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon"></div>
        <h2>ATS Pro</h2>
      </div>
      
      <nav className="nav-menu">
        <div className="nav-section">
          <span className="nav-title">Guia Definitivo</span>
          <button 
            className={`nav-item ${activeView === 'article' ? 'active' : ''}`} 
            onClick={handleArticleClick}
          >
            <BookOpen size={18} />
            O que é ATS?
          </button>
        </div>

        <div className="nav-section">
          <span className="nav-title">Inteligência Artificial</span>
          <button 
            className={`nav-item ${activeView === 'ai-generator' ? 'active' : ''}`} 
            onClick={handleAiClick}
          >
            <Zap size={18} />
            Gerar Currículo ATS
          </button>
        </div>
        
        <div className="nav-section">
          <span className="nav-title">Modelos Brasileiros</span>
          <button 
            className={`nav-item ${activeView === 'resume' && activeResume === 'paula' ? 'active' : ''}`}
            onClick={() => handleResumeClick('paula')}
          >
            <User size={18} />
            Paula Ferreira
          </button>
          <button 
            className={`nav-item ${activeView === 'resume' && activeResume === 'joao' ? 'active' : ''}`}
            onClick={() => handleResumeClick('joao')}
          >
            <User size={18} />
            João Vieira
          </button>
        </div>

        <div className="nav-section">
          <span className="nav-title">Modelos Gringos (ATS)</span>
          <button 
            className={`nav-item ${activeView === 'resume' && activeResume === 'patrick_basic' ? 'active' : ''}`}
            onClick={() => handleResumeClick('patrick_basic')}
          >
            <FileText size={18} />
            Patrick Bateman (Basic)
          </button>
        </div>
      </nav>
      
      <div className="sidebar-footer">
        <p>Otimizado para Sistemas de Rastreamento.</p>
      </div>
    </aside>
  );
}
