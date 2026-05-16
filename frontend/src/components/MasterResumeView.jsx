import { useState } from 'react';
import { FileText, Edit2, Check, X, Shield, Loader2, AlertTriangle, Save, Upload, Settings, Eye, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { getApiKey, getAiModel } from '../lib/apiKey';
import { setValueAtPath } from '../lib/resumePayload';
import ProfessionalTheme from './themes/AtsBasicTheme';
import '../styles/master.css';

export default function MasterResumeView() {
  const { t, language } = useLanguage();
  const [resume, setResume] = useState(() => {
    try {
      const saved = localStorage.getItem('ats_master_resume');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [editJson, setEditJson] = useState(() => {
    try {
      const saved = localStorage.getItem('ats_master_resume');
      return saved ? JSON.stringify(JSON.parse(saved), null, 2) : '';
    } catch {
      return '';
    }
  });

  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [isCreatingMaster, setIsCreatingMaster] = useState(() => !localStorage.getItem('ats_master_resume'));
  const [previewResume, setPreviewResume] = useState(null);
  const [isViewing, setIsViewing] = useState(false);
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('balanced');
  const [combo, setCombo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [interactionMode, setInteractionMode] = useState('none');
  const [editModal, setEditModal] = useState(null);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const getHeaders = (extra = {}) => {
    const gemini = getApiKey('gemini');
    const openai = getApiKey('openai');
    const anthropic = getApiKey('anthropic');
    return {
      ...(gemini ? { 'x-api-key': gemini } : {}),
      ...(openai ? { 'x-openai-key': openai } : {}),
      ...(anthropic ? { 'x-anthropic-key': anthropic } : {}),
      ...extra,
    };
  };

  const persistResume = (nextResume) => {
    localStorage.setItem('ats_master_resume', JSON.stringify(nextResume));
    setResume(nextResume);
    setEditJson(JSON.stringify(nextResume, null, 2));
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editJson);
      persistResume(parsed);
      setIsEditing(false);
      setError('');
    } catch {
      setError('JSON invalido. Verifique a sintaxe antes de salvar.');
    }
  };

  const handleAnalyze = async () => {
    if (!resume) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch('/api/analyze-master', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ resumeJson: resume, language, modelId: getAiModel() }),
      });
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.data);
      } else {
        setError(data.error || 'Erro ao analisar curriculo mestre.');
      }
    } catch {
      setError('Erro de conexao ao analisar.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateMaster = async (event) => {
    event.preventDefault();
    if (!file) return;

    setIsGenerating(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('level', level);
      if (combo) formData.append('careerFocus', combo);
      formData.append('language', language);
      formData.append('modelId', getAiModel());

      const res = await fetch('/api/generate-master', {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar');

      const professionalResume = data.data.professional || data.data;
      setPreviewResume(professionalResume);
      setIsCreatingMaster(false);
    } catch (err) {
      setError(`Erro ao processar curriculo mestre: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmPreview = () => {
    persistResume(previewResume);
    setPreviewResume(null);
  };

  const handleCancelPreview = () => {
    setPreviewResume(null);
    if (!resume) setIsCreatingMaster(true);
  };

  const handleMasterFieldClick = (path, value) => {
    if (interactionMode === 'none') return;
    setEditModal({ path, value, type: interactionMode });
  };

  const handleManualFieldSave = () => {
    const nextResume = setValueAtPath(resume, editModal.path, editModal.value);
    persistResume(nextResume);
    setEditModal(null);
  };

  const handleAiFieldSave = async () => {
    setIsRefining(true);
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          text: editModal.value,
          instruction: refineInstruction || 'Melhore clareza, impacto e aderencia ATS sem inventar informacoes.',
          modelId: getAiModel(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erro ao refinar trecho.');
      const nextResume = setValueAtPath(resume, editModal.path, data.text);
      persistResume(nextResume);
      setEditModal(null);
      setRefineInstruction('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRefining(false);
    }
  };

  const renderFieldEditModal = () => {
    if (!editModal) return null;

    return (
      <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="modal-content glass-panel"
          style={{ width: '520px', maxWidth: '92vw', background: 'white', padding: '24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>{editModal.type === 'ai' ? 'Refinar com IA' : 'Editar campo'}</h3>
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
                value={refineInstruction}
                onChange={(event) => setRefineInstruction(event.target.value)}
                placeholder="Ex: deixe mais objetivo e com verbos de acao"
                style={{ width: '100%', padding: '12px' }}
              />
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button className="btn-secondary" onClick={() => setEditModal(null)}>Cancelar</button>
            <button className="btn-primary" onClick={editModal.type === 'ai' ? handleAiFieldSave : handleManualFieldSave} disabled={isRefining}>
              <Save size={16} /> {isRefining ? 'Processando...' : 'Salvar'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderMiniWizard = () => (
    <motion.div
      className="master-wizard-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mw-header">
        <div className="mw-icon-wrapper">
          <Settings size={32} color="var(--primary)" />
        </div>
        <h2>Configurar Curriculo Mestre</h2>
        <p>Faca o upload do seu curriculo atual e deixe a IA reestrutura-lo como seu perfil central para futuras adaptacoes.</p>
      </div>

      <form className="mw-form" onSubmit={handleGenerateMaster}>
        <div className="wizard-input-section" style={{ marginBottom: '2rem' }}>
          <input type="file" id="master-upload" accept=".pdf,.doc,.docx" onChange={(event) => setFile(event.target.files[0])} required className="hidden-input" />
          <label htmlFor="master-upload" className={`dropzone-area ${file ? 'has-file' : ''}`}>
            <Upload size={32} className="upload-icon" style={{ color: file ? 'var(--primary)' : 'var(--secondary)', marginBottom: '10px' }} />
            <p className="upload-text">
              {file ? <span className="file-name">{file.name}</span> : 'Clique para enviar seu PDF/DOCX'}
            </p>
          </label>
        </div>

        <div className="mw-field-group">
          <div className="wizard-input-section">
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}>
              Foco de Carreira <span className="optional" style={{ color: 'var(--secondary)', fontWeight: 'normal' }}>(Opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Desenvolvedor Front-end / UX Designer"
              value={combo}
              onChange={(event) => setCombo(event.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid var(--border-light)', borderRadius: '0', background: 'transparent', fontFamily: 'inherit' }}
            />
            <p className="wizard-input-hint" style={{ marginTop: '6px' }}>Se deixar em branco, manteremos o cargo atual do arquivo.</p>
          </div>

          <div className="wizard-input-section">
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}>Nivel de Reescrita (IA)</label>
            <select value={level} onChange={(event) => setLevel(event.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-light)', borderRadius: '0', background: 'transparent', fontFamily: 'inherit' }}>
              <option value="conservative">Conservador (Pequenas correcoes)</option>
              <option value="balanced">Balanceado (Otimizacao de impacto)</option>
              <option value="aggressive">Agressivo (Forte vies comercial/vendas)</option>
            </select>
          </div>
        </div>

        <div className="wizard-nav" style={{ justifyContent: 'flex-end' }}>
          {resume && (
            <button type="button" className="btn-secondary" onClick={() => setIsCreatingMaster(false)} disabled={isGenerating} style={{ width: 'auto' }}>
              Cancelar
            </button>
          )}
          <button type="submit" className="btn-primary btn-shimmer" disabled={isGenerating || !file} style={{ width: 'auto', minWidth: '250px' }}>
            {isGenerating ? <><Loader2 size={16} className="spin" /> Processando...</> : 'Criar Curriculo Mestre'}
          </button>
        </div>
      </form>
    </motion.div>
  );

  if (isCreatingMaster) {
    return (
      <div className="master-container">
        {error && <div className="error-banner"><AlertTriangle size={18} /> {error}</div>}
        {renderMiniWizard()}
      </div>
    );
  }

  if (previewResume) {
    return (
      <div className="master-container" style={{ maxWidth: '1200px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Pre-visualizacao do Mestre</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary)' }}>Revise a formatacao ATS gerada antes de salvar.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secondary" onClick={handleCancelPreview}><X size={16} /> Descartar</button>
            <button className="btn-primary btn-shimmer" onClick={handleConfirmPreview}><Save size={16} /> Salvar como Mestre</button>
          </div>
        </div>
        <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <ProfessionalTheme data={previewResume} />
        </div>
      </div>
    );
  }

  if (isViewing) {
    return (
      <div className="master-container" style={{ maxWidth: '1200px' }}>
        {error && <div className="error-banner"><AlertTriangle size={18} /> {error}</div>}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
          <button className="btn-secondary" onClick={() => { setIsViewing(false); setInteractionMode('none'); }}>
            <X size={16} /> Fechar Visualizacao
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" onClick={() => setInteractionMode(interactionMode === 'edit' ? 'none' : 'edit')}>
              <Edit2 size={16} /> Editar campos
            </button>
            <button className="btn-secondary" onClick={() => setInteractionMode(interactionMode === 'ai' ? 'none' : 'ai')}>
              <Sparkles size={16} /> Refinar com IA
            </button>
          </div>
        </div>
        <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <ProfessionalTheme data={resume} onEdit={interactionMode !== 'none' ? handleMasterFieldClick : null} />
        </div>
        {renderFieldEditModal()}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="master-container">
        <div className="master-header">
          <div className="master-title-row">
            <Edit2 size={28} color="var(--primary)" />
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Editar Mestre Manualmente</h2>
          </div>
          <div className="master-actions">
            <button className="btn-secondary" onClick={() => { setIsEditing(false); setEditJson(JSON.stringify(resume, null, 2)); }}>
              <X size={16} /> Cancelar
            </button>
            <button className="btn-primary btn-shimmer" onClick={handleSave}>
              <Save size={16} /> Salvar Alteracoes
            </button>
          </div>
        </div>
        <div className="master-editor">
          <p className="editor-hint"><AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }} /> Cuidado: altere este JSON apenas se souber o que esta fazendo.</p>
          <textarea value={editJson} onChange={(event) => setEditJson(event.target.value)} />
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="master-container">
        <div className="error-banner"><AlertTriangle size={18} /> Curriculo mestre nao encontrado.</div>
        <button className="btn-primary" onClick={() => setIsCreatingMaster(true)}>Configurar Novo</button>
      </div>
    );
  }

  return (
    <div className="master-container">
      {error && <div className="error-banner"><AlertTriangle size={18} /> {error}</div>}

      <div className="master-header">
        <div className="master-title-row">
          <FileText size={28} color="var(--primary)" />
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.5px' }}>{t('nav.master') || 'Curriculo Mestre'}</h2>
        </div>
        <div className="master-actions">
          <button className="btn-secondary" onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? <Loader2 size={16} className="spin" /> : <Shield size={16} />}
            Analise ATS Base
          </button>
        </div>
      </div>

      {analysis && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="master-analysis-card">
          <div className="mac-header">
            <Shield size={24} color="var(--primary)" />
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Resultado do Diagnostico ATS Base</h3>
            <div className="mac-score">{analysis.atsScore}/100</div>
          </div>
          <p className="mac-reason">{analysis.screeningReason || 'Analise concluida.'}</p>
        </motion.div>
      )}

      <motion.div
        className="master-minimized-card"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>
              <Check size={14} /> Mestre Ativo
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', margin: '0 0 8px 0', color: 'var(--text)' }}>{resume.name}</h3>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--primary)', margin: '0 0 16px 0', fontWeight: 500 }}>{resume.title}</h4>
            <div style={{ color: 'var(--secondary)', fontSize: '0.9rem', display: 'flex', gap: '16px' }}>
              <span>{resume.email}</span>
              <span>{resume.phone}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn-primary" onClick={() => setIsViewing(true)} style={{ width: '100%', justifyContent: 'center' }}>
              <Eye size={16} /> Ver Curriculo
            </button>
            <button className="btn-secondary" onClick={() => setIsEditing(true)} style={{ width: '100%', justifyContent: 'center' }}>
              <Edit2 size={16} /> Editar JSON
            </button>
            <button className="btn-secondary" onClick={() => setIsCreatingMaster(true)} style={{ width: '100%', justifyContent: 'center' }}>
              <RefreshCw size={16} /> Substituir Arquivo
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
