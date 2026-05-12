import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const STEP_IDS = ['upload', 'analysis', 'level', 'keywords', 'result'];

/**
 * WizardProgressBar — Horizontal progress bar for mobile/tablet.
 * Hidden on desktop (sidebar takes over).
 */
export default function WizardProgressBar({ currentStep, onNavigate }) {
  const { t } = useLanguage();
  const currentIdx = STEP_IDS.indexOf(currentStep);
  const fillPercent = currentIdx > 0 ? (currentIdx / (STEP_IDS.length - 1)) * 100 : 0;

  return (
    <div className="wizard-progress">
      <div className="wizard-progress-steps">
        <div className="wizard-progress-track">
          <motion.div
            className="wizard-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${fillPercent}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>

        {STEP_IDS.map((stepId, idx) => {
          const isActive = idx === currentIdx;
          const isCompleted = idx < currentIdx;
          const canNavigate = isCompleted;
          const statusClass = isActive ? 'active' : isCompleted ? 'completed' : '';

          return (
            <div
              key={stepId}
              className={`wizard-progress-dot-wrapper ${statusClass}`}
            >
              <motion.div
                className={`wizard-progress-dot ${statusClass}`}
                onClick={() => canNavigate && onNavigate?.(stepId)}
                whileTap={canNavigate ? { scale: 0.9 } : {}}
                layout
              >
                {isCompleted ? (
                  <Check size={12} strokeWidth={3} />
                ) : (
                  idx + 1
                )}
              </motion.div>
              <span className="wizard-progress-dot-label">
                {t(`wizard.steps.${stepId}.label`)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
