import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { PROVIDERS } from '../lib/aiModels';

const MODELS = PROVIDERS.flatMap((provider) => provider.models).slice(0, 3);

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
              <span className="model-card-tag">{model.tag}</span>
              <span className="model-card-name">{model.name}</span>
              <p className="model-card-desc">{model.desc}</p>
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
