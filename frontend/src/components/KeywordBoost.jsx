import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Zap, Info, Sparkles } from 'lucide-react';

const CATEGORY_LABELS = {
  hard_skill: 'Hard Skill',
  soft_skill: 'Soft Skill',
  tool: 'Ferramenta',
  methodology: 'Metodologia',
  certification: 'Certificação',
  domain: 'Domínio',
};

const CATEGORY_COLORS = {
  hard_skill: '#2563eb',
  soft_skill: '#7c3aed',
  tool: '#0891b2',
  methodology: '#ca8a04',
  certification: '#16a34a',
  domain: '#dc2626',
};

const PRIORITY_LABELS = {
  high: '⬆ Alta',
  medium: '— Média',
  low: '⬇ Baixa',
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
 * KeywordBoost — Intermediate screen between Level Select and Generation.
 * Shows AI-suggested keywords that the user can toggle on/off before generation.
 */
export default function KeywordBoost({
  suggestions,
  isLoading,
  onGenerate,
  onBack,
  isGenerating,
  activeCombo,
}) {
  const [toggledKeywords, setToggledKeywords] = useState({});

  // Initialize all keywords as active when suggestions load
  useEffect(() => {
    if (suggestions && suggestions.length > 0) {
      const initial = {};
      suggestions.forEach((s, i) => {
        initial[i] = true;
      });
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
    return suggestions
      .filter((_, i) => toggledKeywords[i])
      .map(s => s.keyword);
  };

  const activeCount = Object.values(toggledKeywords).filter(Boolean).length;
  const totalCount = suggestions?.length || 0;

  if (isLoading) {
    return (
      <div className="keyword-boost-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Loader2 size={28} />
        </motion.div>
        <h3>Analisando oportunidades de Match...</h3>
        <p>A IA está identificando palavras-chave que podem aumentar sua compatibilidade com a vaga.</p>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="keyword-boost-empty" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <p style={{ color: 'var(--secondary)', marginBottom: '20px' }}>
          Nenhuma sugestão disponível. Prossiga para a geração.
        </p>
        <button 
          className="btn-primary" 
          onClick={() => onGenerate([])}
          disabled={isGenerating}
          style={{ justifyContent: 'center', padding: '16px 32px', fontSize: '1rem' }}
        >
          {isGenerating ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <Loader2 size={18} />
            </motion.div>
          ) : (
            <Zap size={18} />
          )}
          {isGenerating ? 'Reescrevendo Currículo...' : 'Gerar Currículo'}
        </button>
        {isGenerating && (
          <p style={{ color: 'var(--secondary)', marginTop: '16px', fontSize: '0.85rem' }}>
            Isso pode levar até 60 segundos. A IA está reescrevendo seu currículo...
          </p>
        )}
      </div>
    );
  }

  // Group by priority
  const highPriority = suggestions.map((s, i) => ({ ...s, _idx: i })).filter(s => s.priority === 'high');
  const mediumPriority = suggestions.map((s, i) => ({ ...s, _idx: i })).filter(s => s.priority === 'medium');
  const lowPriority = suggestions.map((s, i) => ({ ...s, _idx: i })).filter(s => s.priority === 'low');

  const renderGroup = (items, label) => {
    if (items.length === 0) return null;
    return (
      <div className="keyword-boost-group">
        <div className="keyword-boost-group-label">{label}</div>
        <div className="keyword-boost-chips">
          {items.map((item) => {
            const isActive = toggledKeywords[item._idx];
            const catColor = CATEGORY_COLORS[item.category] || '#6b7280';
            return (
              <motion.button
                key={item._idx}
                type="button"
                className={`keyword-boost-chip ${isActive ? 'active' : 'inactive'}`}
                onClick={() => toggleKeyword(item._idx)}
                whileTap={{ scale: 0.95 }}
                style={{
                  '--chip-color': catColor,
                  borderColor: isActive ? catColor : undefined,
                }}
                title={item.reason}
              >
                <span className="keyword-boost-chip-text">{item.keyword}</span>
                <span className="keyword-boost-chip-cat" style={{ color: isActive ? catColor : undefined }}>
                  {CATEGORY_LABELS[item.category] || item.category}
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
        <span className="badge">Keyword Boost</span>
        <h1>Potencializar Keywords</h1>
        <p style={{ color: 'var(--secondary)', marginTop: '8px', fontSize: '0.9rem' }}>
          A IA identificou palavras-chave e expressões que podem aumentar seu Match Score.
          Desative as que não fazem sentido para o seu perfil.
        </p>
      </header>

      {/* Career Combo Active Banner */}
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
              Modo <strong style={{ color: COMBO_LABELS[activeCombo].color }}>{COMBO_LABELS[activeCombo].label}</strong> ativo — keywords priorizadas para este setor.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="keyword-boost-info">
        <Info size={16} />
        <span>
          <strong>{activeCount}/{totalCount}</strong> keywords ativas — serão incorporadas naturalmente no currículo durante a geração.
        </span>
      </div>

      <div className="keyword-boost-controls">
        <button className="btn-secondary btn-sm" onClick={() => toggleAll(true)}>
          Ativar Todas
        </button>
        <button className="btn-secondary btn-sm" onClick={() => toggleAll(false)}>
          Desativar Todas
        </button>
      </div>

      <div className="keyword-boost-groups">
        {renderGroup(highPriority, PRIORITY_LABELS.high + ' prioridade')}
        {renderGroup(mediumPriority, PRIORITY_LABELS.medium + ' prioridade')}
        {renderGroup(lowPriority, PRIORITY_LABELS.low + ' prioridade')}
      </div>

      {/* Tooltip area for hovered keyword reason */}
      <div className="keyword-boost-hint">
        <Info size={14} />
        <span>Passe o mouse sobre uma keyword para ver por que ela foi sugerida.</span>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
        <button className="btn-secondary" onClick={onBack}>
          ← Voltar
        </button>
        <button
          className="btn-primary"
          style={{ flex: 1, justifyContent: 'center', padding: '16px', fontSize: '1.1rem' }}
          onClick={() => onGenerate(getActiveKeywords())}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
              <Zap size={20} />
            </motion.div>
          ) : (
            <Zap size={20} />
          )}
          {isGenerating ? 'Reescrevendo Currículo...' : `Gerar com ${activeCount} Keywords`}
        </button>
      </div>
    </div>
  );
}
