import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, LayoutTemplate, Edit3, X, Sparkles, Code } from 'lucide-react';
import ProfessionalTheme from '../themes/AtsBasicTheme';
import HeritageTheme from '../themes/HeritageTheme';
import ScoreComparison from '../ScoreComparison';
import CoverLetterPanel from '../CoverLetterPanel';
import { RESUME_LAYOUTS } from '../../lib/resumePayload';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * WizardStepResult — Step 5: Final result with resume preview, toolbar, cover letter.
 */
export default function WizardStepResult({
  generatedResumes,
  selectedLayout, setSelectedLayout,
  latexData,
  analysisData,
  postAnalysisData,
  jobDescText,
  onStartOver,
  onExportJson,
  onRefine,
  isRefining,
}) {
  const { t } = useLanguage();
  const [interactionMode, setInteractionMode] = useState('none');
  const [editModal, setEditModal] = useState(null);
  const [refiningText, setRefiningText] = useState('');
  const [showLatex, setShowLatex] = useState(false);

  const selectedResume = generatedResumes[selectedLayout] ?? generatedResumes.professional;

  const resumeTextForCoverLetter = selectedResume
    ? `${selectedResume.name}\n${selectedResume.title}\n${selectedResume.email} | ${selectedResume.phone}\n\n${selectedResume.summary}\n\nExperience:\n${(selectedResume.experience || []).map(e => `${e.role} - ${e.company}\n${(e.responsibilities || []).join('\n')}`).join('\n\n')}`
    : '';

  const handleCopyLatex = useCallback(() => {
    if (!latexData) return;
    const text = latexData[selectedLayout] || latexData.professional;
    navigator.clipboard.writeText(text);
    alert(t('result.latexCopied'));
  }, [latexData, selectedLayout, t]);

  const handleEditAction = (path, value) => {
    if (interactionMode !== 'none') {
      setEditModal({ path, value, type: interactionMode });
    }
  };

  const handleRefineSubmit = async () => {
    if (!refiningText.trim() && !jobDescText) return;
    await onRefine(editModal, refiningText);
    setEditModal(null);
    setRefiningText('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Toolbar */}
      <div className="resume-toolbar glass-panel no-print">
        <div className="resume-info">
          <h3>{t('result.successTitle')}</h3>
          <p>{t('result.successDesc')}</p>
        </div>
        <div className="resume-toolbar-actions result-toolbar-grid">
          <div className="layout-toggle" role="group">
            {Object.entries(RESUME_LAYOUTS).map(([layout, config]) => (
              <button
                key={layout}
                type="button"
                className={`layout-toggle-button ${selectedLayout === layout ? 'active' : ''}`}
                onClick={() => setSelectedLayout(layout)}
              >
                <LayoutTemplate size={16} /> {config.label}
              </button>
            ))}
          </div>
          <button
            className={`btn-secondary ${interactionMode === 'edit' ? 'active' : ''}`}
            onClick={() => setInteractionMode(interactionMode === 'edit' ? 'none' : 'edit')}
            style={{ background: interactionMode === 'edit' ? 'var(--primary)' : '', color: interactionMode === 'edit' ? 'white' : '', borderColor: interactionMode === 'edit' ? 'var(--primary)' : '' }}
          >
            <Edit3 size={16} /> {t('result.editManual')}
          </button>
          <button
            className={`btn-secondary ${interactionMode === 'ai' ? 'active' : ''}`}
            onClick={() => setInteractionMode(interactionMode === 'ai' ? 'none' : 'ai')}
            style={{ background: interactionMode === 'ai' ? '#8b5cf6' : '', color: interactionMode === 'ai' ? 'white' : '', borderColor: interactionMode === 'ai' ? '#8b5cf6' : '' }}
          >
            <Sparkles size={16} /> {t('result.editAi')}
          </button>
          <button className="btn-secondary" onClick={onStartOver}>
            {t('result.startOver')}
          </button>
          <button className="btn-secondary" onClick={onExportJson}>
            <Download size={16} /> {t('result.exportJson')}
          </button>
          {latexData && (
            <button className="btn-secondary" onClick={handleCopyLatex}>
              <Code size={16} /> {t('result.copyLatex')}
            </button>
          )}
          <button className="btn-primary btn-shimmer" onClick={() => window.print()}>
            <Download size={16} /> {t('result.savePdf')}
          </button>
        </div>
      </div>

      {/* Score Comparison */}
      <div className="no-print" style={{ maxWidth: '900px', margin: '0 auto 24px' }}>
        <ScoreComparison before={analysisData} after={postAnalysisData} />
      </div>

      {/* Resume Paper */}
      <div className="resume-paper-container">
        <div className={`resume-paper ${RESUME_LAYOUTS[selectedLayout].className}`}>
          {selectedLayout === 'heritage' ? (
            <HeritageTheme data={selectedResume} onEdit={interactionMode !== 'none' ? handleEditAction : null} />
          ) : (
            <ProfessionalTheme data={selectedResume} onEdit={interactionMode !== 'none' ? handleEditAction : null} />
          )}
        </div>
      </div>

      {/* Cover Letter */}
      <div className="no-print" style={{ maxWidth: '900px', margin: '40px auto 0' }}>
        <CoverLetterPanel resumeText={resumeTextForCoverLetter} jobDescription={jobDescText} />
      </div>

      {/* LaTeX Expandable */}
      {latexData && (
        <div className="no-print" style={{ maxWidth: '900px', margin: '24px auto 60px' }}>
          <button
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setShowLatex(!showLatex)}
          >
            <Code size={16} />
            {showLatex ? t('result.hideLatex') : t('result.showLatex')} {t('result.latexCode')} ({selectedLayout === 'heritage' ? t('result.heritage') : t('result.professional')})
          </button>
          {showLatex && (
            <div style={{ marginTop: '12px', background: '#1e1e2e', padding: '20px', border: '1px solid var(--secondary)' }}>
              <pre style={{ color: '#cdd6f4', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                {latexData[selectedLayout] || latexData.professional}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div
            className="modal-content glass-panel"
            style={{ width: '500px', maxWidth: '90%', background: 'white', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editModal.type === 'ai' ? <><Sparkles size={20} color="#8b5cf6" /> {t('result.modalAiTitle')}</> : <><Edit3 size={20} /> {t('result.modalEditTitle')}</>}
              </h3>
              <button onClick={() => setEditModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {editModal.type === 'edit' ? (
              <textarea
                value={editModal.value}
                onChange={(e) => setEditModal({ ...editModal, value: e.target.value })}
                style={{ width: '100%', minHeight: '150px', padding: '12px', fontFamily: 'inherit', resize: 'vertical', border: '1px solid var(--border-light)' }}
              />
            ) : (
              <>
                <div style={{ padding: '12px', background: '#f1f5f9', fontSize: '0.9rem', color: '#334155', maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0' }}>
                  <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>{t('result.modalOriginal')}</strong>
                  {editModal.value}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t('result.modalAiLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('result.modalAiPlaceholder')}
                    value={refiningText}
                    onChange={(e) => setRefiningText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRefineSubmit(); }}
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--border-light)' }}
                  />
                  <small style={{ color: '#64748b', fontSize: '0.8rem' }}>{t('result.modalAiHint')}</small>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setEditModal(null)}>{t('result.modalCancel')}</button>
              {editModal.type === 'ai' ? (
                <button className="btn-primary" onClick={handleRefineSubmit} disabled={isRefining} style={{ background: '#8b5cf6' }}>
                  {isRefining ? t('result.modalProcessing') : t('result.modalGenerate')}
                </button>
              ) : (
                <button className="btn-primary" onClick={() => { /* handled by parent */ setEditModal(null); }}>
                  {t('result.modalSave')}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
