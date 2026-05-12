import { Shield, Scale, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';

const LEVEL_ICONS = { conservative: Shield, balanced: Scale, aggressive: Zap };
const LEVEL_KEYS = ['conservative', 'balanced', 'aggressive'];
const LEVEL_COLORS = { conservative: '#16a34a', balanced: '#ca8a04', aggressive: '#dc2626' };

/**
 * WizardStepLevel — Step 3: Aggressiveness level selection.
 */
export default function WizardStepLevel({
  aggressivenessLevel, setAggressivenessLevel,
  onBack, onNext,
}) {
  const { t } = useLanguage();

  return (
    <div className="article-container glass-panel" style={{ maxWidth: '900px' }}>
      <header className="article-header">
        <span className="badge">{t('level.badge')}</span>
        <h1>{t('level.title')}</h1>
        <p style={{ color: 'var(--secondary)' }}>{t('level.subtitle')}</p>
      </header>

      <div className="level-selector" style={{ marginTop: '24px' }}>
        <div className="level-selector-header">
          <h3>{t('level.selectorTitle')}</h3>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            {t('level.selectorDesc')}
          </p>
        </div>
        <div className="level-cards">
          {LEVEL_KEYS.map((key, idx) => {
            const isSelected = aggressivenessLevel === key;
            const Icon = LEVEL_ICONS[key];
            const color = LEVEL_COLORS[key];
            const levelT = t(`level.${key}`);

            return (
              <motion.button
                key={key}
                type="button"
                className={`level-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setAggressivenessLevel(key)}
                style={{
                  '--level-color': color,
                  borderColor: isSelected ? color : undefined,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="level-card-icon" style={{ color: isSelected ? color : 'var(--secondary)' }}>
                  <Icon size={24} />
                </div>
                <div className="level-card-title" style={{ color: isSelected ? color : 'var(--primary)' }}>
                  {levelT.title}
                </div>
                <p className="level-card-desc">{levelT.desc}</p>
                {isSelected && (
                  <motion.div
                    className="level-card-badge"
                    style={{ backgroundColor: color }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    {t('level.selected')}
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="wizard-nav">
        <button className="btn-secondary" onClick={onBack}>
          {t('level.back')}
        </button>
        <button className="btn-primary btn-shimmer" onClick={onNext}>
          <Zap size={20} />
          {t('level.next')}
        </button>
      </div>
    </div>
  );
}
