import { Upload, Search, Sliders, Key, Zap, FileText, Check } from 'lucide-react';

const WIZARD_STEPS = [
  { id: 'input',    label: 'Upload',       icon: Upload,   desc: 'Enviar currículo e vaga' },
  { id: 'analysis', label: 'Diagnóstico',  icon: Search,   desc: 'ATS Score & Match Score' },
  { id: 'level',    label: 'Override',     icon: Sliders,  desc: 'Nível de agressividade' },
  { id: 'keywords', label: 'Keywords',     icon: Key,      desc: 'Boost de palavras-chave' },
  { id: 'result',   label: 'Resultado',    icon: FileText, desc: 'Currículo otimizado' },
];

/**
 * Sidebar — Wizard-style step indicator for the ATS pipeline.
 * Non-interactive: shows current progress only.
 */
export default function Sidebar({ currentStep }) {
  const currentIdx = WIZARD_STEPS.findIndex(s => s.id === currentStep);

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon"></div>
        <h2>ATS Pro</h2>
      </div>

      <div className="wizard-container">
        <div className="wizard-title">Pipeline</div>
        <div className="wizard-steps">
          {WIZARD_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentIdx;
            const isCompleted = idx < currentIdx;
            const isPending = idx > currentIdx;

            let statusClass = 'pending';
            if (isActive) statusClass = 'active';
            if (isCompleted) statusClass = 'completed';

            return (
              <div key={step.id} className={`wizard-step ${statusClass}`}>
                {/* Connector line (not for first step) */}
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

      <div className="sidebar-footer">
        <p>Otimizado para Sistemas de Rastreamento.</p>
      </div>
    </aside>
  );
}
