import { motion } from 'framer-motion';
import { Shield, Target, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

/**
 * ScoreComparison — Shows a before/after comparison of ATS and Match scores.
 * Displayed in the results view after generation completes.
 */
export default function ScoreComparison({ before, after }) {
  const [expanded, setExpanded] = useState(false);

  if (!before && !after) return null;

  const getScoreColor = (score) => {
    if (score >= 85) return '#16a34a';
    if (score >= 70) return '#ca8a04';
    if (score >= 50) return '#ea580c';
    return '#dc2626';
  };

  const getDelta = (beforeVal, afterVal) => {
    if (beforeVal == null || afterVal == null) return null;
    return afterVal - beforeVal;
  };

  const DeltaIndicator = ({ delta }) => {
    if (delta == null) return null;
    if (delta > 0) return (
      <span className="score-delta positive">
        <TrendingUp size={14} /> +{delta}
      </span>
    );
    if (delta < 0) return (
      <span className="score-delta negative">
        <TrendingDown size={14} /> {delta}
      </span>
    );
    return (
      <span className="score-delta neutral">
        <Minus size={14} /> 0
      </span>
    );
  };

  const atsDelta = getDelta(before?.atsScore, after?.atsScore);
  const matchDelta = getDelta(before?.matchScore, after?.matchScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="score-comparison"
    >
      <button
        className="score-comparison-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="score-comparison-title">
          <Shield size={18} />
          <span>Relatório ATS — Antes vs Depois</span>
          {after && (
            <span className="score-comparison-badge" style={{ backgroundColor: getScoreColor(after.atsScore) }}>
              ATS {after.atsScore}/100
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="score-comparison-body"
        >
          {/* ATS Score comparison */}
          <div className="score-comparison-row">
            <div className="score-comparison-label">
              <Shield size={16} />
              ATS Score
            </div>
            <div className="score-comparison-values">
              {before && (
                <div className="score-comparison-cell">
                  <span className="score-comparison-cell-label">Antes</span>
                  <span className="score-comparison-cell-value" style={{ color: getScoreColor(before.atsScore) }}>
                    {before.atsScore}
                  </span>
                </div>
              )}
              {(before && after) && (
                <div className="score-comparison-arrow">→</div>
              )}
              {after && (
                <div className="score-comparison-cell">
                  <span className="score-comparison-cell-label">Depois</span>
                  <span className="score-comparison-cell-value" style={{ color: getScoreColor(after.atsScore) }}>
                    {after.atsScore}
                  </span>
                </div>
              )}
              {atsDelta !== null && <DeltaIndicator delta={atsDelta} />}
            </div>
          </div>

          {/* Match Score comparison */}
          {(before?.matchScore != null || after?.matchScore != null) && (
            <div className="score-comparison-row">
              <div className="score-comparison-label">
                <Target size={16} />
                Match Score
              </div>
              <div className="score-comparison-values">
                {before?.matchScore != null && (
                  <div className="score-comparison-cell">
                    <span className="score-comparison-cell-label">Antes</span>
                    <span className="score-comparison-cell-value" style={{ color: getScoreColor(before.matchScore) }}>
                      {before.matchScore}
                    </span>
                  </div>
                )}
                {(before?.matchScore != null && after?.matchScore != null) && (
                  <div className="score-comparison-arrow">→</div>
                )}
                {after?.matchScore != null && (
                  <div className="score-comparison-cell">
                    <span className="score-comparison-cell-label">Depois</span>
                    <span className="score-comparison-cell-value" style={{ color: getScoreColor(after.matchScore) }}>
                      {after.matchScore}
                    </span>
                  </div>
                )}
                {matchDelta !== null && <DeltaIndicator delta={matchDelta} />}
              </div>
            </div>
          )}

          {/* Probability */}
          <div className="score-comparison-row">
            <div className="score-comparison-label">Leitura ATS</div>
            <div className="score-comparison-values">
              {before && (
                <div className="score-comparison-cell">
                  <span className="score-comparison-cell-label">Antes</span>
                  <span className="score-comparison-cell-tag">{before.probability}</span>
                </div>
              )}
              {(before && after) && <div className="score-comparison-arrow">→</div>}
              {after && (
                <div className="score-comparison-cell">
                  <span className="score-comparison-cell-label">Depois</span>
                  <span className="score-comparison-cell-tag">{after.probability}</span>
                </div>
              )}
            </div>
          </div>

          {/* Post-analysis details */}
          {after?.screeningReason && (
            <div className="score-comparison-detail">
              <strong>Análise Pós-Geração:</strong> {after.screeningReason}
            </div>
          )}

          {/* Keywords gained */}
          {after?.foundKeywords?.length > 0 && (
            <div className="score-comparison-keywords">
              <strong>Keywords no Currículo Final:</strong>
              <div className="keywords-chips" style={{ marginTop: '8px' }}>
                {after.foundKeywords.map((kw, i) => (
                  <span key={i} className="keyword-chip found">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {after?.missingKeywords?.length > 0 && (
            <div className="score-comparison-keywords">
              <strong>Ainda faltantes:</strong>
              <div className="keywords-chips" style={{ marginTop: '8px' }}>
                {after.missingKeywords.map((kw, i) => (
                  <span key={i} className="keyword-chip missing">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {after?.tips?.length > 0 && (
            <div className="score-comparison-tips">
              <strong>Recomendações finais:</strong>
              <ul className="tips-list" style={{ marginTop: '8px' }}>
                {after.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
