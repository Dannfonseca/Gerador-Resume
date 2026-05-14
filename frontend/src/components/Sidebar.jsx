import { Upload, Search, Sliders, Key, FileText, Check, BookOpen, Settings, LayoutDashboard, Menu, X as CloseIcon } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import SettingsModal from './SettingsModal';
import { useLanguage } from '../i18n/LanguageContext';

const WIZARD_STEPS = [
  { id: 'upload',   icon: Upload   },
  { id: 'analysis', icon: Search   },
  { id: 'level',    icon: Sliders  },
  { id: 'keywords', icon: Key      },
  { id: 'result',   icon: FileText },
];

export default function Sidebar({ currentStep, activeTab, onSwitchTab, onNavigateStep }) {
  const { t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const currentIdx = WIZARD_STEPS.findIndex(s => s.id === currentStep);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleStepClick = (stepId, idx) => {
    // Allow navigating to completed steps
    if (idx < currentIdx && onNavigateStep) {
      onNavigateStep(stepId);
      setIsMenuOpen(false);
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 2600);
  };

  return (
    <aside className={`sidebar ${isMenuOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-top-row">
        <div className="logo">
          <div className="logo-icon"></div>
          <h2>{t('app.title')}</h2>
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
            <span>{t('nav.docs')}</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'app' ? 'active' : ''}`}
            onClick={() => { onSwitchTab('app'); setIsMenuOpen(false); }}
          >
            <LayoutDashboard size={18} />
            <span>{t('nav.app')}</span>
          </button>
        </div>

        {activeTab === 'app' && (
          <div className="wizard-container">
            <div className="wizard-title">{t('wizard.title')}</div>
            <div className="wizard-steps">
              {WIZARD_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = idx === currentIdx;
                const isCompleted = idx < currentIdx;
                const canClick = isCompleted;

                let statusClass = 'pending';
                if (isActive) statusClass = 'active';
                if (isCompleted) statusClass = 'completed';

                const stepLabel = t(`wizard.steps.${step.id}.label`);
                const stepDesc = t(`wizard.steps.${step.id}.desc`);

                return (
                  <div
                    key={step.id}
                    className={`wizard-step ${statusClass} ${canClick ? 'clickable' : ''}`}
                    onClick={() => handleStepClick(step.id, idx)}
                  >
                    {idx > 0 && (
                      <motion.div
                        className={`wizard-connector ${isCompleted || isActive ? 'filled' : ''}`}
                        initial={false}
                        animate={{
                          background: isCompleted || isActive ? 'var(--tertiary)' : 'var(--border-light)'
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    )}

                    <div className="wizard-step-row">
                      <motion.div
                        className={`wizard-step-icon ${statusClass}`}
                        layout
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        {isCompleted ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
                      </motion.div>
                      <div className="wizard-step-content">
                        <span className="wizard-step-label">{stepLabel}</span>
                        <span className="wizard-step-desc">{stepDesc}</span>
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
            <span>{t('nav.settings')}</span>
          </button>
          <p>{t('app.subtitle')}</p>
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSaved={showToast}
        />
      )}
      {toastMessage && (
        <div className="app-toast" role="status" aria-live="polite">
          <Check size={16} strokeWidth={3} />
          <span>{toastMessage}</span>
        </div>
      )}
    </aside>
  );
}
