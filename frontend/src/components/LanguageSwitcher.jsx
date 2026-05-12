import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * LanguageSwitcher — Visual toggle card for EN ⇄ PT-BR.
 * Placed above the wizard content. Affects both UI language and resume output language.
 */
export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  const options = [
    { id: 'pt-BR', label: t('language.ptBr'), flag: '🇧🇷' },
    { id: 'en',    label: t('language.en'),   flag: '🇺🇸' },
  ];

  return (
    <div className="lang-switcher">
      <div className="lang-switcher-header">
        <Globe size={16} className="lang-switcher-icon" />
        <span className="lang-switcher-title">{t('language.title')}</span>
      </div>
      <div className="lang-switcher-options">
        {options.map((opt) => {
          const isActive = language === opt.id;
          return (
            <motion.button
              key={opt.id}
              type="button"
              className={`lang-option ${isActive ? 'active' : ''}`}
              onClick={() => setLanguage(opt.id)}
              whileTap={{ scale: 0.97 }}
            >
              <span className="lang-option-flag">{opt.flag}</span>
              <span className="lang-option-label">{opt.label}</span>
              {isActive && (
                <motion.div
                  className="lang-option-indicator"
                  layoutId="lang-indicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
