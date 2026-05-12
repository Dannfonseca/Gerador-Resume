import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Zap, Info, Sparkles } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const CATEGORY_COLORS = {
  hard_skill: '#2563eb', soft_skill: '#7c3aed', tool: '#0891b2',
  methodology: '#ca8a04', certification: '#16a34a', domain: '#dc2626',
};

const COMBO_LABELS = {
  tech: { label: 'Tecnologia & T.I.', color: '#2563eb' },
  architecture: { label: 'Arquitetura & Urbanismo', color: '#78716c' },
  marketing: { label: 'Marketing & Comunicação', color: '#ec4899' },
  engineering: { label: 'Engenharia', color: '#f59e0b' },
  healthcare: { label: 'Saúde', color: '#ef4444' },
  legal: { label: 'Direito & Compliance', color: '#6366f1' },
  finance: { label: 'Finanças & Contabilidade', color: '#059669' },
  education: { label: 'Educação & Docência', color: '#8b5cf6' },
};

/**
 * WizardStepKeywords — Step 4: Keyword boost selection.
 */
export default function WizardStepKeywords({
  suggestions, isLoading, onGenerate, onBack, isGenerating, activeCombo,
}) {
  const { t } = useLanguage();
  const [toggledKeywords, setToggledKeywords] = useState({});

  useEffect(() => {
    if (suggestions && suggestions.length > 0) {
      const initial = {};
      suggestions.forEach((_, i) => { initial[i] = true; });
      setToggledKeywords(initial);
    }
  }, [suggestions]);

  const toggleKeyword = (idx) => {
    setToggledKeywords(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleAll = (value) => {
    const updated = {};
    suggestions.forEach((_, i) => { updated[i] = value; });
    setToggledKeywords(updated);
  };

  const getActiveKeywords = () => {
    if (!suggestions) return [];
    return suggestions.filter((_, i) => toggledKeywords[i]).map(s => s.keyword);
  };

  const activeCount = Object.values(toggledKeywords).filter(Boolean).length;
  const totalCount = suggestions?.length || 0;

  if (isLoading) {
    return (
      <div className="keyword-boost-loading" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Loader2 size={28} />
        </motion.div>
        <h3 style={{ marginTop: '16px' }}>{t('keywords.loading')}</h3>
        <p style={{ color: 'var(--secondary)', marginTop: '8px' }}>{t('keywords.loadingDesc')}</p>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <p style={{ color: 'var(--secondary)', marginBottom: '20px' }}>{t('keywords.empty')}</p>
        <button
          className="btn-primary btn-shimmer"
          onClick={() => onGenerate([])}
          disabled={isGenerating}
          style={{ justifyContent: 'center', padding: '16px 32px', fontSize: '1rem' }}
        >
          {isGenerating ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <Loader2 size={18} />
            </motion.div>
          ) : <Zap size={18} />}
          {isGenerating ? t('keywords.generating') : t('keywords.generate')}
        </button>
        {isGenerating && (
          <p style={{ color: 'var(--secondary)', marginTop: '16px', fontSize: '0.85rem' }}>
            {t('keywords.generatingWait')}
          </p>
        )}
      </div>
    );
  }

  // Group by priority
  const grouped = { high: [], medium: [], low: [] };
  suggestions.forEach((s, i) => {
    const group = grouped[s.priority] || grouped.medium;
    group.push({ ...s, _idx: i });
  });

  const renderGroup = (items, priorityKey) => {
    if (items.length === 0) return null;
    const label = `${t(`keywords.priorities.${priorityKey}`)} ${t('keywords.prioritySuffix')}`;
    return (
      <div className="keyword-boost-group">
        <div className="keyword-boost-group-label">{label}</div>
        <div className="keyword-boost-chips">
          {items.map((item, chipIdx) => {
            const isActive = toggledKeywords[item._idx];
            const catColor = CATEGORY_COLORS[item.category] || '#6b7280';
            return (
              <motion.button
                key={item._idx}
                type="button"
                className={`keyword-boost-chip ${isActive ? 'active' : 'inactive'}`}
                onClick={() => toggleKeyword(item._idx)}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: chipIdx * 0.03 }}
                style={{
                  '--chip-color': catColor,
                  borderColor: isActive ? catColor : undefined,
                }}
                title={item.reason}
              >
                <span className="keyword-boost-chip-text">{item.keyword}</span>
                <span className="keyword-boost-chip-cat" style={{ color: isActive ? catColor : undefined }}>
                  {t(`keywords.categories.${item.category}`) || item.category}
                </span>
                <span className={`keyword-boost-chip-toggle ${isActive ? 'on' : 'off'}`}>
                  {isActive ? '✓' : '✗'}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="article-container glass-panel" style={{ maxWidth: '900px' }}>
      <header className="article-header">
        <span className="badge">{t('keywords.badge')}</span>
        <h1>{t('keywords.title')}</h1>
        <p style={{ color: 'var(--secondary)', marginTop: '8px', fontSize: '0.9rem' }}>
          {t('keywords.subtitle')}
        </p>
      </header>

      {/* Combo banner */}
      <AnimatePresence>
        {activeCombo && COMBO_LABELS[activeCombo] && (
          <motion.div
            className="keyword-combo-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ borderLeftColor: COMBO_LABELS[activeCombo].color }}
          >
            <Sparkles size={16} style={{ color: COMBO_LABELS[activeCombo].color, flexShrink: 0 }} />
            <span>
              {t('keywords.comboMode')} <strong style={{ color: COMBO_LABELS[activeCombo].color }}>{COMBO_LABELS[activeCombo].label}</strong> {t('keywords.comboActive')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="keyword-boost-info" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0', fontSize: '0.85rem', color: 'var(--secondary)' }}>
        <Info size={16} />
        <span><strong>{activeCount}/{totalCount}</strong> {t('keywords.activeInfo')}</span>
      </div>

      <div className="keyword-boost-controls" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => toggleAll(true)}>
          {t('keywords.enableAll')}
        </button>
        <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => toggleAll(false)}>
          {t('keywords.disableAll')}
        </button>
      </div>

      <div className="keyword-boost-groups" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {renderGroup(grouped.high, 'high')}
        {renderGroup(grouped.medium, 'medium')}
        {renderGroup(grouped.low, 'low')}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0', fontSize: '0.8rem', color: 'var(--secondary)', marginTop: '12px' }}>
        <Info size={14} />
        <span>{t('keywords.hoverHint')}</span>
      </div>

      <div className="wizard-nav">
        <button className="btn-secondary" onClick={onBack}>
          {t('keywords.back')}
        </button>
        <button
          className="btn-primary btn-shimmer"
          onClick={() => onGenerate(getActiveKeywords())}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
              <Zap size={20} />
            </motion.div>
          ) : <Zap size={20} />}
          {isGenerating ? t('keywords.generating') : `${t('keywords.generateWith')} ${activeCount} ${t('keywords.keywordsLabel')}`}
        </button>
      </div>

      {isGenerating && (
        <p style={{ color: 'var(--secondary)', marginTop: '16px', fontSize: '0.85rem', textAlign: 'center' }}>
          {t('keywords.generatingWait')}
        </p>
      )}
    </div>
  );
}
