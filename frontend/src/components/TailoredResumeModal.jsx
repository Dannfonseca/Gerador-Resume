import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Download, Edit3, LayoutTemplate, Save, Sparkles, X } from 'lucide-react';
import CoverLetterPanel from './CoverLetterPanel';
import HeritageTheme from './themes/HeritageTheme';
import ProfessionalTheme from './themes/AtsBasicTheme';
import { getApiKey, getAiModel } from '../lib/apiKey';
import {
  RESUME_LAYOUTS,
  normalizeGeneratedResumes,
  resumeToPlainText,
  setValueAtPath,
} from '../lib/resumePayload';
import { useLanguage } from '../i18n/LanguageContext';

function getHeaders(extra = {}) {
  const gemini = getApiKey('gemini');
  const openai = getApiKey('openai');
  const anthropic = getApiKey('anthropic');
  return {
    ...(gemini ? { 'x-api-key': gemini } : {}),
    ...(openai ? { 'x-openai-key': openai } : {}),
    ...(anthropic ? { 'x-anthropic-key': anthropic } : {}),
    ...extra,
  };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderResumeSection(title, body) {
  if (!body) return '';
  return `<h2>${escapeHtml(title)}</h2>${body}`;
}

function resumeToWordHtml(resume) {
  if (!resume) return '';

  const contact = [resume.email, resume.phone, resume.address].filter(Boolean).map(escapeHtml).join(' | ');
  const experience = (resume.experience || []).map((item) => `
    <div class="entry">
      <h3>${escapeHtml(item.role)}${item.company ? ` - ${escapeHtml(item.company)}` : ''}</h3>
      <p class="meta">${escapeHtml([item.date, item.location].filter(Boolean).join(' | '))}</p>
      <ul>${(item.responsibilities || []).map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>
    </div>
  `).join('');
  const projects = (resume.projects || []).map((project) => `
    <div class="entry">
      <h3>${escapeHtml(project.name)}</h3>
      <p class="meta">${escapeHtml(project.technologies)}</p>
      <p>${escapeHtml(project.description)}</p>
    </div>
  `).join('');
  const education = (resume.education || []).map((item) => `
    <div class="entry">
      <h3>${escapeHtml(item.degree)}${item.institution ? ` - ${escapeHtml(item.institution)}` : ''}</h3>
      <p class="meta">${escapeHtml([item.date, item.location].filter(Boolean).join(' | '))}</p>
    </div>
  `).join('');
  const skills = (resume.skillsGroup || []).map((group) => `
    <p><strong>${escapeHtml(group.category)}:</strong> ${escapeHtml((group.items || []).join(', '))}</p>
  `).join('');

  return `
    <h1>${escapeHtml(resume.name)}</h1>
    <p class="title">${escapeHtml(resume.title)}</p>
    <p class="contact">${contact}</p>
    ${renderResumeSection('Resumo', `<p>${escapeHtml(resume.summary)}</p>`)}
    ${renderResumeSection('Experiencia', experience)}
    ${renderResumeSection('Projetos', projects)}
    ${renderResumeSection('Educacao', education)}
    ${renderResumeSection('Competencias', skills)}
  `;
}

export default function TailoredResumeModal({
  job,
  resumeVersion,
  onClose,
  onSaveVersion,
}) {
  const { t } = useLanguage();
  const [selectedLayout, setSelectedLayout] = useState(resumeVersion.selectedLayout || 'professional');
  const [interactionMode, setInteractionMode] = useState('none');
  const [editModal, setEditModal] = useState(null);
  const [instruction, setInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [showLatex, setShowLatex] = useState(false);

  const layouts = useMemo(() => normalizeGeneratedResumes(resumeVersion.data), [resumeVersion.data]);
  const selectedResume = layouts[selectedLayout] || layouts.professional;
  const selectedLatex = resumeVersion.latex?.[selectedLayout] || resumeVersion.latex?.professional || '';
  const resumeText = resumeToPlainText(selectedResume);

  const saveVersion = useCallback((updates) => {
    onSaveVersion({
      ...resumeVersion,
      ...updates,
    });
  }, [onSaveVersion, resumeVersion]);

  const handleSelectLayout = (layout) => {
    setSelectedLayout(layout);
    saveVersion({ selectedLayout: layout });
  };

  const handleFieldClick = (path, value) => {
    if (interactionMode === 'none') return;
    setEditModal({ path: `${selectedLayout}.${path}`, value, type: interactionMode });
  };

  const handleManualSave = () => {
    const nextData = setValueAtPath(resumeVersion.data, editModal.path, editModal.value);
    saveVersion({ data: nextData, selectedLayout });
    setEditModal(null);
  };

  const handleAiSave = async () => {
    setIsRefining(true);
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          text: editModal.value,
          jobDescription: job.jdRaw,
          instruction,
          modelId: getAiModel(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erro ao refinar trecho.');
      const nextData = setValueAtPath(resumeVersion.data, editModal.path, data.text);
      saveVersion({ data: nextData, selectedLayout });
      setEditModal(null);
      setInstruction('');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsRefining(false);
    }
  };

  const exportJson = () => {
    const safeCompany = (job.company || 'vaga').replace(/[^\w-]+/g, '_');
    const blob = new Blob([JSON.stringify(resumeVersion.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `cv_${safeCompany}_${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportWord = () => {
    const safeCompany = (job.company || 'vaga').replace(/[^\w-]+/g, '_');
    const documentHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; color: #111827; line-height: 1.35; }
      h1 { font-size: 28px; margin: 0 0 4px; }
      h2 { font-size: 15px; margin: 22px 0 8px; border-bottom: 1px solid #d1d5db; text-transform: uppercase; }
      h3 { font-size: 13px; margin: 10px 0 2px; }
      p { margin: 4px 0; }
      ul { margin: 6px 0 0 18px; padding: 0; }
      li { margin: 3px 0; }
      .title { font-size: 15px; font-weight: bold; }
      .contact, .meta { color: #4b5563; font-size: 11px; }
      .entry { margin-bottom: 10px; }
    </style>
  </head>
  <body>${resumeToWordHtml(selectedResume)}</body>
</html>`;
    const blob = new Blob(['\ufeff', documentHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `cv_${safeCompany}_${Date.now()}.doc`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyLatex = () => {
    if (!selectedLatex) return;
    navigator.clipboard.writeText(selectedLatex);
    alert(t('result.latexCopied'));
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="modal-content"
        style={{
          background: 'var(--bg)',
          width: 'min(1200px, 96vw)',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div className="resume-toolbar glass-panel no-print" style={{ margin: 0, borderRadius: 0 }}>
          <div className="resume-info">
            <h3>{resumeVersion.name}</h3>
            <p>{job.company} - {job.title}</p>
          </div>
          <div className="resume-toolbar-actions result-toolbar-grid">
            <div className="layout-toggle" role="group">
              {Object.entries(RESUME_LAYOUTS).map(([layout, config]) => (
                <button
                  key={layout}
                  type="button"
                  className={`layout-toggle-button ${selectedLayout === layout ? 'active' : ''}`}
                  onClick={() => handleSelectLayout(layout)}
                >
                  <LayoutTemplate size={16} /> {config.label}
                </button>
              ))}
            </div>
            <button className="btn-secondary" onClick={() => setInteractionMode(interactionMode === 'edit' ? 'none' : 'edit')}>
              <Edit3 size={16} /> {t('result.editManual')}
            </button>
            <button className="btn-secondary" onClick={() => setInteractionMode(interactionMode === 'ai' ? 'none' : 'ai')}>
              <Sparkles size={16} /> {t('result.editAi')}
            </button>
            <button className="btn-secondary" onClick={exportJson}>
              <Download size={16} /> {t('result.exportJson')}
            </button>
            <button className="btn-secondary" onClick={exportWord}>
              <Download size={16} /> Word
            </button>
            {selectedLatex && (
              <button className="btn-secondary" onClick={copyLatex}>
                <Code size={16} /> {t('result.copyLatex')}
              </button>
            )}
            <button className="btn-primary" onClick={() => window.print()}>
              <Download size={16} /> {t('result.savePdf')}
            </button>
            <button className="btn-secondary" onClick={onClose}>
              <X size={16} /> Fechar
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <div className="resume-paper-container">
            <div className={`resume-paper ${RESUME_LAYOUTS[selectedLayout].className}`}>
              {selectedLayout === 'heritage' ? (
                <HeritageTheme data={selectedResume} onEdit={interactionMode !== 'none' ? handleFieldClick : null} />
              ) : (
                <ProfessionalTheme data={selectedResume} onEdit={interactionMode !== 'none' ? handleFieldClick : null} />
              )}
            </div>
          </div>

          <div className="no-print" style={{ maxWidth: '900px', margin: '32px auto 0' }}>
            <CoverLetterPanel resumeText={resumeText} jobDescription={job.jdRaw} />
          </div>

          {selectedLatex && (
            <div className="no-print" style={{ maxWidth: '900px', margin: '24px auto 60px' }}>
              <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowLatex(!showLatex)}>
                <Code size={16} /> {showLatex ? t('result.hideLatex') : t('result.showLatex')} {t('result.latexCode')}
              </button>
              {showLatex && (
                <pre style={{ marginTop: '12px', background: '#1e1e2e', color: '#cdd6f4', padding: '20px', whiteSpace: 'pre-wrap' }}>
                  {selectedLatex}
                </pre>
              )}
            </div>
          )}
        </div>

        {editModal && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.35)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="modal-content glass-panel"
              style={{ width: '520px', maxWidth: '92vw', background: 'white', padding: '24px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>{editModal.type === 'ai' ? t('result.modalAiTitle') : t('result.modalEditTitle')}</h3>
                <button className="icon-btn" onClick={() => setEditModal(null)}>
                  <X size={18} />
                </button>
              </div>
              {editModal.type === 'edit' ? (
                <textarea
                  value={editModal.value}
                  onChange={(event) => setEditModal({ ...editModal, value: event.target.value })}
                  style={{ width: '100%', minHeight: '160px' }}
                />
              ) : (
                <>
                  <div style={{ padding: '12px', background: '#f1f5f9', marginBottom: '12px' }}>{editModal.value}</div>
                  <input
                    value={instruction}
                    onChange={(event) => setInstruction(event.target.value)}
                    placeholder={t('result.modalAiPlaceholder')}
                    style={{ width: '100%', padding: '12px' }}
                  />
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button className="btn-secondary" onClick={() => setEditModal(null)}>{t('result.modalCancel')}</button>
                <button className="btn-primary" onClick={editModal.type === 'ai' ? handleAiSave : handleManualSave} disabled={isRefining}>
                  <Save size={16} /> {isRefining ? t('result.modalProcessing') : t('result.modalSave')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
