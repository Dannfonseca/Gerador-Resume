import { motion } from 'framer-motion';
import { Shield, Target, Key, TrendingUp, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';

/**
 * AnalysisDashboard — Displays the "Raio-X" of the resume before optimization.
 * Inspired by apresentando.me's AnalysisCard + ScoreSection + MatchReport.
 */
export default function AnalysisDashboard({ analysis, onOptimize }) {
  if (!analysis) return null;

  const { atsScore, probability, screeningReason, matchScore, matchAnalysis,
          foundKeywords, missingKeywords, strengths, keywordOps, tips } = analysis;

  const getScoreColor = (score) => {
    if (score >= 85) return '#16a34a'; // green
    if (score >= 70) return '#ca8a04'; // yellow
    if (score >= 50) return '#ea580c'; // orange
    return '#dc2626'; // red
  };

  const getProbabilityIcon = (prob) => {
    if (prob === 'Alta') return <CheckCircle size={16} color="#16a34a" />;
    if (prob === 'Média') return <AlertTriangle size={16} color="#ca8a04" />;
    return <AlertTriangle size={16} color="#dc2626" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="analysis-dashboard"
    >
      {/* Header */}
      <div className="analysis-header">
        <span className="badge">Diagnóstico Completo</span>
        <h2>Raio-X do seu Currículo</h2>
        <p style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
          Análise automática da qualidade estrutural e aderência à vaga.
        </p>
      </div>

      {/* Score Cards Row */}
      <div className="analysis-scores-row">
        {/* ATS Score */}
        <div className="analysis-score-card">
          <div className="score-card-header">
            <Shield size={20} />
            <span>ATS Score</span>
          </div>
          <div className="score-ring" style={{ '--score-color': getScoreColor(atsScore) }}>
            <span className="score-value" style={{ color: getScoreColor(atsScore) }}>{atsScore}</span>
            <span className="score-label">/100</span>
          </div>
          <div className="score-probability">
            {getProbabilityIcon(probability)}
            <span>Leitura ATS: <strong>{probability}</strong></span>
          </div>
          <p className="score-reason">{screeningReason}</p>
        </div>

        {/* Match Score */}
        {matchScore !== null && matchScore !== undefined && (
          <div className="analysis-score-card">
            <div className="score-card-header">
              <Target size={20} />
              <span>Match Score</span>
            </div>
            <div className="score-ring" style={{ '--score-color': getScoreColor(matchScore) }}>
              <span className="score-value" style={{ color: getScoreColor(matchScore) }}>{matchScore}</span>
              <span className="score-label">/100</span>
            </div>
            <p className="score-reason">{matchAnalysis}</p>
          </div>
        )}
      </div>

      {/* Keywords Radar */}
      {(foundKeywords || missingKeywords) && (
        <div className="analysis-keywords-section">
          <div className="analysis-section-title">
            <Key size={18} />
            <span>Radar de Palavras-Chave</span>
          </div>
          <div className="keywords-grid">
            {foundKeywords && foundKeywords.length > 0 && (
              <div className="keywords-column found">
                <h4>✓ Encontradas</h4>
                <div className="keywords-chips">
                  {foundKeywords.map((kw, i) => (
                    <span key={i} className="keyword-chip found">{kw}</span>
                  ))}
                </div>
              </div>
            )}
            {missingKeywords && missingKeywords.length > 0 && (
              <div className="keywords-column missing">
                <h4>✗ Faltantes</h4>
                <div className="keywords-chips">
                  {missingKeywords.map((kw, i) => (
                    <span key={i} className="keyword-chip missing">{kw}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strengths */}
      {strengths && strengths.length > 0 && (
        <div className="analysis-strengths-section">
          <div className="analysis-section-title">
            <TrendingUp size={18} />
            <span>Pontos Fortes</span>
          </div>
          <div className="strengths-list">
            {strengths.map((s, i) => (
              <div key={i} className="strength-item">
                <strong>{s.title}</strong>
                <span>{s.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {tips && tips.length > 0 && (
        <div className="analysis-tips-section">
          <div className="analysis-section-title">
            <span>💡</span>
            <span>Dicas Práticas</span>
          </div>
          <ul className="tips-list">
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA: Optimize */}
      <div className="analysis-cta">
        <button className="btn-primary analysis-optimize-btn" onClick={onOptimize}>
          <ChevronRight size={20} />
          Otimizar Currículo com IA
        </button>
        <p style={{ color: 'var(--secondary)', fontSize: '0.8rem', marginTop: '8px', textAlign: 'center' }}>
          A IA vai reescrever seu currículo com base neste diagnóstico
        </p>
      </div>
    </motion.div>
  );
}
