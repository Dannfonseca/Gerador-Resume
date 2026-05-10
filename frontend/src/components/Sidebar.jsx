import { Upload, Search, Sliders, Key, Zap, FileText, Check, BookOpen, Settings, LayoutDashboard, Menu, X as CloseIcon } from 'lucide-react';
import { useState } from 'react';
import SettingsModal from './SettingsModal';

const WIZARD_STEPS = [
  { id: 'input',    label: 'Upload',       icon: Upload,   desc: 'Enviar currículo e vaga' },
  { id: 'analysis', label: 'Diagnóstico',  icon: Search,   desc: 'ATS Score & Match Score' },
  { id: 'level',    label: 'Override',     icon: Sliders,  desc: 'Nível de agressividade' },
  { id: 'keywords', label: 'Keywords',     icon: Key,      desc: 'Boost de palavras-chave' },
  { id: 'result',   label: 'Resultado',    icon: FileText, desc: 'Currículo otimizado' },
];

export default function Sidebar({ currentStep, activeTab, onSwitchTab }) {
  const [showSettings, setShowSettings] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentIdx = WIZARD_STEPS.findIndex(s => s.id === currentStep);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <aside className={`sidebar ${isMenuOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-top-row">
        <div className="logo">
          <div className="logo-icon"></div>
          <h2>ATS Pro</h2>
        </div>
        <button className="menu-toggle" onClick={toggleMenu}>
          {isMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className={`sidebar-content ${isMenuOpen ? 'show' : ''}`}>
        <div className="nav-menu">
          <button 
            className={`nav-item ${activeTab === 'docs' ? 'active' : ''}`} 
            onClick={() => { onSwitchTab('docs'); setIsMenuOpen(false); }}
          >
            <BookOpen size={18} />
            <span>Documentação</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'app' ? 'active' : ''}`} 
            onClick={() => { onSwitchTab('app'); setIsMenuOpen(false); }}
          >
            <LayoutDashboard size={18} />
            <span>Análise de Currículo</span>
          </button>
        </div>

        {activeTab === 'app' && (
          <div className="wizard-container">
            <div className="wizard-title">Pipeline de Otimização</div>
            <div className="wizard-steps">
              {WIZARD_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = idx === currentIdx;
                const isCompleted = idx < currentIdx;

                let statusClass = 'pending';
                if (isActive) statusClass = 'active';
                if (isCompleted) statusClass = 'completed';

                return (
                  <div key={step.id} className={`wizard-step ${statusClass}`}>
                    {idx > 0 && (
                      <div className={`wizard-connector ${isCompleted || isActive ? 'filled' : ''}`} />
                    )}
                    
                    <div className="wizard-step-row">
                      <div className={`wizard-step-icon ${statusClass}`}>
                        {isCompleted ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
                      </div>
                      <div className="wizard-step-content">
                        <span className="wizard-step-label">{step.label}</span>
                        <span className="wizard-step-desc">{step.desc}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="sidebar-footer">
          <button 
            className="settings-toggle-btn"
            onClick={() => { setShowSettings(true); setIsMenuOpen(false); }}
          >
            <Settings size={18} />
            <span>Configurações</span>
          </button>
          <p>Otimizado para Sistemas de Rastreamento.</p>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </aside>
  );
}
