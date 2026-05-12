import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';

const MODELS = [
  { id: 'gemini-1.5-flash', key: 'flash' },
  { id: 'gemini-1.5-pro',   key: 'pro'   },
  { id: 'gemini-2.0-pro-exp', key: 'ultra' } // Usando 2.0 Pro Exp como "Ultra" por agora
];

/**
 * AiModelSelector — Component for picking the AI "brain".
 */
export default function AiModelSelector({ selectedModel, setSelectedModel }) {
  const { t } = useLanguage();

  return (
    <div className="model-selector">
      <div className="model-selector-header">
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{t('models.title')}</h3>
        <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
          {t('models.desc')}
        </p>
      </div>
      <div className="model-cards">
        {MODELS.map((model, idx) => {
          const isSelected = selectedModel === model.id;
          const modelT = t(`models.${model.key}`);

          return (
            <motion.button
              key={model.id}
              type="button"
              className={`model-card ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedModel(model.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="model-card-tag">{modelT.tag}</span>
              <span className="model-card-name">{modelT.name}</span>
              <p className="model-card-desc">{modelT.desc}</p>
              {isSelected && (
                <motion.div
                  className="lang-option-indicator"
                  layoutId="model-indicator"
                  style={{ background: 'var(--primary)', height: '3px' }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
