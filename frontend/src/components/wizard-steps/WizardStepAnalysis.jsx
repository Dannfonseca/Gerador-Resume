import { motion } from 'framer-motion';
import { Shield, Target, Key, TrendingUp, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * WizardStepAnalysis — Step 2: Analysis dashboard (Raio-X).
 * Refactored from AnalysisDashboard with i18n support.
 */
export default function WizardStepAnalysis({ analysis, onOptimize }) {
  const { t } = useLanguage();

  if (!analysis) return null;

  const { atsScore, probability, screeningReason, matchScore, matchAnalysis,
    foundKeywords, missingKeywords, strengths, tips } = analysis;

  const getScoreColor = (score) => {
    if (score >= 85) return '#16a34a';
    if (score >= 70) return '#ca8a04';
    if (score >= 50) return '#ea580c';
    return '#dc2626';
  };

  const getProbabilityIcon = (prob) => {
    if (prob === 'Alta' || prob === 'High') return <CheckCircle size={16} color="#16a34a" />;
    if (prob === 'Média' || prob === 'Medium') return <AlertTriangle size={16} color="#ca8a04" />;
    return <AlertTriangle size={16} color="#dc2626" />;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  return (
    <motion.div
      className="analysis-dashboard"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="analysis-header" variants={itemVariants}>
        <span className="badge">{t('analysis.badge')}</span>
        <h2>{t('analysis.title')}</h2>
        <p style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
          {t('analysis.subtitle')}
        </p>
      </motion.div>

      {/* Score Cards */}
      <motion.div className="analysis-scores-row" variants={itemVariants}>
        <div className="analysis-score-card">
          <div className="score-card-header">
            <Shield size={20} />
            <span>{t('analysis.atsScore')}</span>
          </div>
          <div className="score-ring" style={{ '--score-color': getScoreColor(atsScore) }}>
            <motion.span
              className="score-value"
              style={{ color: getScoreColor(atsScore) }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            >
              {atsScore}
            </motion.span>
            <span className="score-label">/100</span>
          </div>
          <div className="score-probability">
            {getProbabilityIcon(probability)}
            <span>{t('analysis.atsReading')} <strong>{probability}</strong></span>
          </div>

          {analysis.atsBreakdown && (
            <div className="ats-breakdown">
              <div className="ats-breakdown-row">
                <span className="ats-breakdown-label">{t('analysis.parseability')}</span>
                <div className="ats-breakdown-bar-track">
                  <motion.div
                    className="ats-breakdown-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${(analysis.atsBreakdown.parseability / 60) * 100}%` }}
                    transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                    style={{ backgroundColor: getScoreColor(Math.round(analysis.atsBreakdown.parseability / 60 * 100)) }}
                  />
                </div>
                <span className="ats-breakdown-value">{analysis.atsBreakdown.parseability}/60</span>
              </div>
              <div className="ats-breakdown-row">
                <span className="ats-breakdown-label">{t('analysis.quality')}</span>
                <div className="ats-breakdown-bar-track">
                  <motion.div
                    className="ats-breakdown-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${(analysis.atsBreakdown.contentQuality / 40) * 100}%` }}
                    transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}
                    style={{ backgroundColor: getScoreColor(Math.round(analysis.atsBreakdown.contentQuality / 40 * 100)) }}
                  />
                </div>
                <span className="ats-breakdown-value">{analysis.atsBreakdown.contentQuality}/40</span>
              </div>
            </div>
          )}

          <p className="score-reason">{screeningReason}</p>
        </div>

        {matchScore !== null && matchScore !== undefined && (
          <div className="analysis-score-card">
            <div className="score-card-header">
              <Target size={20} />
              <span>{t('analysis.matchScore')}</span>
            </div>
            <div className="score-ring" style={{ '--score-color': getScoreColor(matchScore) }}>
              <motion.span
                className="score-value"
                style={{ color: getScoreColor(matchScore) }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              >
                {matchScore}
              </motion.span>
              <span className="score-label">/100</span>
            </div>
            <p className="score-reason">{matchAnalysis}</p>
          </div>
        )}
      </motion.div>

      {/* Keywords */}
      {(foundKeywords || missingKeywords) && (
        <motion.div className="analysis-keywords-section" variants={itemVariants}>
          <div className="analysis-section-title">
            <Key size={18} />
            <span>{t('analysis.keywordsRadar')}</span>
          </div>
          <div className="keywords-grid">
            {foundKeywords && foundKeywords.length > 0 && (
              <div className="keywords-column found">
                <h4>{t('analysis.found')}</h4>
                <div className="keywords-chips">
                  {foundKeywords.map((kw, i) => (
                    <motion.span
                      key={i}
                      className="keyword-chip found"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * i }}
                    >
                      {kw}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
            {missingKeywords && missingKeywords.length > 0 && (
              <div className="keywords-column missing">
                <h4>{t('analysis.missing')}</h4>
                <div className="keywords-chips">
                  {missingKeywords.map((kw, i) => (
                    <motion.span
                      key={i}
                      className="keyword-chip missing"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * i + 0.2 }}
                    >
                      {kw}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Strengths */}
      {strengths && strengths.length > 0 && (
        <motion.div className="analysis-strengths-section" variants={itemVariants}>
          <div className="analysis-section-title">
            <TrendingUp size={18} />
            <span>{t('analysis.strengths')}</span>
          </div>
          <div className="strengths-list">
            {strengths.map((s, i) => (
              <div key={i} className="strength-item">
                <strong>{s.title}</strong>
                <span>{s.description}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tips */}
      {tips && tips.length > 0 && (
        <motion.div className="analysis-tips-section" variants={itemVariants}>
          <div className="analysis-section-title">
            <span>💡</span>
            <span>{t('analysis.tips')}</span>
          </div>
          <ul className="tips-list">
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div className="analysis-cta" variants={itemVariants}>
        <button className="btn-primary btn-shimmer analysis-optimize-btn" onClick={onOptimize}>
          <ChevronRight size={20} />
          {t('analysis.optimizeBtn')}
        </button>
        <p style={{ color: 'var(--secondary)', fontSize: '0.8rem', marginTop: '8px', textAlign: 'center' }}>
          {t('analysis.optimizeHint')}
        </p>
      </motion.div>
    </motion.div>
  );
}
