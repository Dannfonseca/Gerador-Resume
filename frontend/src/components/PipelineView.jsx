import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Briefcase,
  Check,
  ExternalLink,
  Eye,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useJobPipeline } from '../lib/useJobPipeline';
import { getApiKey, getAiModel } from '../lib/apiKey';
import { normalizeGeneratedResumes } from '../lib/resumePayload';
import TailoredResumeModal from './TailoredResumeModal';
import '../styles/pipeline.css';

const emptyJobForm = {
  company: '',
  title: '',
  url: '',
  jdText: '',
};

const emptyAddModal = {
  isOpen: false,
  step: 1,
  job: emptyJobForm,
  loadingMsg: '',
  error: '',
};

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

function safeResumeName(company) {
  return (company || 'vaga').replace(/[^\w-]+/g, '_');
}

export default function PipelineView() {
  const { t, language } = useLanguage();
  const {
    jobs,
    addJob,
    updateJob,
    deleteJob,
    addResumeToJob,
    updateResumeForJob,
    deleteResumeFromJob,
  } = useJobPipeline();

  const [addModal, setAddModal] = useState(emptyAddModal);
  const [jobDetailModal, setJobDetailModal] = useState({ isOpen: false, jobId: null });
  const [keywordFlow, setKeywordFlow] = useState({ isOpen: false, jobId: null, selectedKeywords: [] });
  const [selectedResumeModal, setSelectedResumeModal] = useState({
    isOpen: false,
    jobId: null,
    resumeId: null,
  });

  const statusOptions = ['A Avaliar', 'Para Aplicar', 'Aplicado', 'Entrevista', 'Rejeitado', 'Oferta'];

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === jobDetailModal.jobId) || null,
    [jobs, jobDetailModal.jobId],
  );

  const selectedResumeJob = useMemo(
    () => jobs.find((job) => job.id === selectedResumeModal.jobId) || null,
    [jobs, selectedResumeModal.jobId],
  );

  const selectedResumeVersion = useMemo(
    () => selectedResumeJob?.resumes?.find((resume) => resume.id === selectedResumeModal.resumeId) || null,
    [selectedResumeJob, selectedResumeModal.resumeId],
  );

  const openAddModal = () => {
    setAddModal({ ...emptyAddModal, isOpen: true, job: { ...emptyJobForm } });
  };

  const closeAddModal = () => {
    setAddModal({ ...emptyAddModal, job: { ...emptyJobForm } });
  };

  const handleAddStart = async (event) => {
    event.preventDefault();

    const formJob = addModal.job;
    if (!formJob.url && (!formJob.company || !formJob.title || !formJob.jdText)) {
      setAddModal((prev) => ({
        ...prev,
        error: 'Forneca um link ou preencha empresa, cargo e descricao manualmente.',
      }));
      return;
    }

    setAddModal((prev) => ({
      ...prev,
      step: 2,
      loadingMsg: 'Extraindo dados e analisando a vaga...',
      error: '',
    }));

    try {
      const aiModel = getAiModel();
      let jd = formJob.jdText.trim();
      let company = formJob.company.trim();
      let title = formJob.title.trim();

      if (!jd && formJob.url) {
        if (formJob.url.includes('linkedin.com')) {
          throw new Error('LinkedIn costuma bloquear extracao. Cole a descricao manualmente.');
        }

        const extractionResponse = await fetch('/api/extract-job', {
          method: 'POST',
          headers: getHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ url: formJob.url, modelId: aiModel }),
        });
        const extractionData = await extractionResponse.json();
        if (!extractionData.success) {
          throw new Error(extractionData.error || 'Nao foi possivel extrair a vaga.');
        }

        jd = extractionData.description || '';
        company = extractionData.company || company;
        title = extractionData.title || title;
      }

      if (!jd) {
        throw new Error('A descricao da vaga nao pode ser lida. Cole o texto manualmente.');
      }

      const masterStr = localStorage.getItem('ats_master_resume');
      if (!masterStr) {
        throw new Error('Configure seu Curriculo Mestre antes de adicionar vagas.');
      }

      const masterResume = JSON.parse(masterStr);
      const analysisResponse = await fetch('/api/analyze-master', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          resumeJson: masterResume,
          jobDescription: jd,
          language,
          modelId: aiModel,
        }),
      });
      const analysisData = await analysisResponse.json();
      if (!analysisData.success) {
        throw new Error(analysisData.error || 'Nao foi possivel analisar a vaga.');
      }

      const jobId = addJob({
        company: company || 'Empresa nao identificada',
        title: title || 'Cargo nao identificado',
        url: formJob.url,
        jdRaw: jd,
        analysisData: analysisData.data,
        keywordSelection: [],
        isProcessing: false,
        processingError: null,
      });

      closeAddModal();
      setJobDetailModal({ isOpen: true, jobId });
      setKeywordFlow({ isOpen: true, jobId, selectedKeywords: [] });
    } catch (error) {
      setAddModal((prev) => ({
        ...prev,
        step: 1,
        error: error.message || 'Erro ao adicionar vaga.',
      }));
    }
  };

  const processTailoringBackground = async (jobId, jd, masterStr, boostedKeywords) => {
    try {
      const masterResume = JSON.parse(masterStr);
      const aiModel = getAiModel();
      const tailorResponse = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          resume: masterResume,
          jobDescription: jd,
          boostedKeywords,
          language,
          modelId: aiModel,
        }),
      });
      const tailorData = await tailorResponse.json();
      if (!tailorData.success) {
        throw new Error(tailorData.error || 'Nao foi possivel adaptar o curriculo.');
      }

      const normalizedData = normalizeGeneratedResumes(tailorData.data);
      const analysisResponse = await fetch('/api/analyze-master', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          resumeJson: normalizedData.professional || normalizedData.heritage,
          jobDescription: jd,
          language,
          modelId: aiModel,
        }),
      });
      const analysisData = await analysisResponse.json();
      const currentJob = jobs.find((job) => job.id === jobId);
      const versionNumber = (currentJob?.resumes?.length || 0) + 1;

      addResumeToJob(jobId, {
        data: normalizedData,
        latex: tailorData.latex || null,
        analysis: analysisData.success ? analysisData.data : null,
        boostedKeywords,
        name: `Versao ${versionNumber}`,
      });
      updateJob(jobId, {
        isProcessing: false,
        processingError: null,
        status: 'Para Aplicar',
      });
    } catch (error) {
      updateJob(jobId, {
        isProcessing: false,
        processingError: error.message || 'Erro ao adaptar curriculo.',
      });
    }
  };

  const startTailoring = (jobId, selectedKeywords = []) => {
    const job = jobs.find((item) => item.id === jobId);
    if (!job) return;

    const masterStr = localStorage.getItem('ats_master_resume');
    if (!masterStr) {
      updateJob(jobId, {
        isProcessing: false,
        processingError: 'Configure seu Curriculo Mestre antes de gerar curriculos por vaga.',
      });
      return;
    }

    const keywordList = selectedKeywords.join(', ');
    updateJob(jobId, {
      isProcessing: true,
      processingError: null,
      keywordSelection: selectedKeywords,
    });
    setKeywordFlow({ isOpen: false, jobId: null, selectedKeywords: [] });
    processTailoringBackground(jobId, job.jdRaw, masterStr, keywordList);
  };

  const toggleKeyword = (keyword) => {
    setKeywordFlow((prev) => {
      const exists = prev.selectedKeywords.includes(keyword);
      return {
        ...prev,
        selectedKeywords: exists
          ? prev.selectedKeywords.filter((item) => item !== keyword)
          : [...prev.selectedKeywords, keyword],
      };
    });
  };

  const handleStatusChange = (id, newStatus) => {
    updateJob(id, { status: newStatus });
  };

  const deleteJobWithoutOpening = (event, jobId) => {
    event.stopPropagation();
    deleteJob(jobId);
  };

  const openKeywordFlow = (job) => {
    setKeywordFlow({
      isOpen: true,
      jobId: job.id,
      selectedKeywords: job.keywordSelection || [],
    });
  };

  const openResumeVersion = (jobId, resumeId) => {
    setSelectedResumeModal({ isOpen: true, jobId, resumeId });
  };

  const exportJson = (resumeData, company) => {
    const blob = new Blob([JSON.stringify(resumeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `cv_adaptado_${safeResumeName(company)}_${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const renderKeywordFlow = (job) => {
    const keywords = job.analysisData?.missingKeywords || [];
    const selectedKeywords = keywordFlow.selectedKeywords;

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="doc-card"
        style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
          <div>
            <h5 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Confirmar keywords
            </h5>
            <p style={{ margin: '8px 0 0', color: 'var(--secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              {job.analysisData?.matchAnalysis || job.analysisData?.scoreReason || 'Selecione apenas palavras que sejam verdadeiras no seu curriculo.'}
            </p>
          </div>
          {job.analysisData?.matchScore !== undefined && (
            <div style={{ background: 'var(--primary)', color: 'white', padding: '8px 12px', fontWeight: 800 }}>
              {job.analysisData.matchScore}%
            </div>
          )}
        </div>

        {keywords.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {keywords.map((keyword) => {
              const isSelected = selectedKeywords.includes(keyword);
              return (
                <button
                  type="button"
                  key={keyword}
                  className={`nav-item ${isSelected ? 'active' : ''}`}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--border-light)',
                    background: isSelected ? 'var(--primary)' : 'white',
                    color: isSelected ? 'white' : 'var(--primary)',
                    fontSize: '0.75rem',
                  }}
                  onClick={() => toggleKeyword(keyword)}
                >
                  {isSelected && <Check size={13} style={{ marginRight: '5px' }} />}
                  {keyword}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>
            A analise nao retornou keywords especificas. Voce ainda pode gerar uma versao adaptada.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: 'auto' }}
            onClick={() => setKeywordFlow({ isOpen: false, jobId: null, selectedKeywords: [] })}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary btn-shimmer"
            style={{ width: 'auto' }}
            onClick={() => startTailoring(job.id, selectedKeywords)}
          >
            Gerar curriculo
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="pipeline-container">
      <div className="pipeline-header">
        <div className="pipeline-title-row">
          <Briefcase size={28} color="var(--primary)" />
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.5px' }}>
            {t('nav.pipeline') || 'Minhas Vagas'}
          </h2>
        </div>
        <button
          className="btn-primary btn-shimmer"
          onClick={openAddModal}
          style={{ width: 'auto', padding: '12px 20px', borderRadius: '4px' }}
        >
          <Plus size={18} />
          <span>Nova Vaga</span>
        </button>
      </div>

      <div className="jobs-list">
        {jobs.length === 0 ? (
          <div className="empty-state">
            Nenhuma vaga rastreada ainda. Adicione sua primeira vaga para comecar.
          </div>
        ) : (
          <table className="jobs-table">
            <thead>
              <tr>
                <th>Empresa / Cargo</th>
                <th>Status</th>
                <th>Curriculos Adaptados</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => setJobDetailModal({ isOpen: true, jobId: job.id })}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{job.company}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {job.title}
                      {job.url && <ExternalLink size={12} />}
                    </div>
                  </td>
                  <td onClick={(event) => event.stopPropagation()}>
                    <select
                      value={job.status}
                      onChange={(event) => handleStatusChange(job.id, event.target.value)}
                      className={`status-select status-${job.status.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ background: 'var(--bg)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                        {job.resumes?.length || 0} versoes
                      </div>
                      {job.isProcessing && <Loader2 size={14} className="spin" style={{ color: 'var(--primary)' }} />}
                      {job.processingError && <AlertCircle size={14} style={{ color: 'var(--error)' }} />}
                    </div>
                  </td>
                  <td onClick={(event) => event.stopPropagation()}>
                    <button className="icon-btn delete" onClick={(event) => deleteJobWithoutOpening(event, job.id)} title="Excluir Vaga">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {addModal.isOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-content glass-panel"
            style={{ width: '100%', maxWidth: '800px', padding: '40px' }}
          >
            {addModal.step === 1 && (
              <>
                <h3 style={{ marginBottom: '0.5rem', fontFamily: "'Public Sans', sans-serif", fontSize: '1.75rem', fontWeight: 800 }}>
                  Adicionar Oportunidade
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '2rem' }}>
                  Cole o link da vaga ou preencha os dados manualmente.
                </p>
                {addModal.error && (
                  <div className="doc-card" style={{ marginBottom: '18px', padding: '14px', borderColor: 'var(--error)', color: 'var(--error)' }}>
                    <AlertCircle size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    {addModal.error}
                  </div>
                )}
                <form onSubmit={handleAddStart} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="wizard-input-section" style={{ flex: 1, marginBottom: 0 }}>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Empresa</label>
                      <input
                        type="text"
                        value={addModal.job.company}
                        onChange={(event) => setAddModal({ ...addModal, job: { ...addModal.job, company: event.target.value } })}
                        style={{ width: '100%', padding: '12px', border: '1px solid var(--border-light)', background: 'transparent' }}
                      />
                    </div>
                    <div className="wizard-input-section" style={{ flex: 1, marginBottom: 0 }}>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Cargo</label>
                      <input
                        type="text"
                        value={addModal.job.title}
                        onChange={(event) => setAddModal({ ...addModal, job: { ...addModal.job, title: event.target.value } })}
                        style={{ width: '100%', padding: '12px', border: '1px solid var(--border-light)', background: 'transparent' }}
                      />
                    </div>
                  </div>

                  <div className="wizard-input-section" style={{ marginBottom: 0 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Link da Vaga</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={addModal.job.url}
                      onChange={(event) => setAddModal({ ...addModal, job: { ...addModal.job, url: event.target.value } })}
                      style={{ width: '100%', padding: '12px', border: '1px solid var(--border-light)', background: 'transparent' }}
                    />
                  </div>

                  <div className="wizard-input-section" style={{ marginBottom: 0 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Ou Descricao Manual</label>
                    <textarea
                      className="wizard-textarea"
                      style={{ height: '150px' }}
                      placeholder="Cole o texto da vaga aqui..."
                      value={addModal.job.jdText}
                      onChange={(event) => setAddModal({ ...addModal, job: { ...addModal.job, jdText: event.target.value } })}
                    />
                  </div>

                  <div className="wizard-nav" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button type="button" className="btn-secondary" onClick={closeAddModal} style={{ width: 'auto' }}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                      Registrar e analisar
                    </button>
                  </div>
                </form>
              </>
            )}

            {addModal.step === 2 && (
              <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Loader2 size={48} className="spin" style={{ color: 'var(--tertiary)', marginBottom: '1.5rem' }} />
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1rem' }}>
                  {addModal.loadingMsg}
                </h3>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {jobDetailModal.isOpen && selectedJob && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-content glass-panel"
            style={{ width: '100%', maxWidth: '1100px', height: '85vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
          >
            <div style={{ padding: '32px 40px', background: 'var(--neutral)', borderBottom: '1px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="badge" style={{ marginBottom: '8px' }}>Detalhes da Oportunidade</div>
                <h2 style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-1px' }}>
                  {selectedJob.title}
                </h2>
                <p style={{ margin: '4px 0 0 0', color: 'var(--tertiary)', fontWeight: 700, fontSize: '1.1rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {selectedJob.company}
                </p>
              </div>
              <button className="btn-secondary" onClick={() => setJobDetailModal({ isOpen: false, jobId: null })} style={{ padding: '12px' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', background: 'white' }}>
              <div style={{ flex: '1.25', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '16px 32px', background: 'var(--neutral)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 className="wizard-title" style={{ margin: 0 }}>Descricao da Vaga</h4>
                  {selectedJob.url && (
                    <a href={selectedJob.url} target="_blank" rel="noreferrer" className="doc-link" title="Ver Link Original" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                      <ExternalLink size={14} /> Link
                    </a>
                  )}
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '32px', fontSize: '1rem', color: 'var(--primary)', whiteSpace: 'pre-wrap', lineHeight: '1.7', fontFamily: "'Public Sans', sans-serif" }}>
                  {selectedJob.jdRaw}
                </div>
              </div>

              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--neutral)' }}>
                <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 className="wizard-title" style={{ margin: 0 }}>Versoes do Curriculo</h4>
                  <button
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.75rem', width: 'auto' }}
                    onClick={() => openKeywordFlow(selectedJob)}
                    disabled={selectedJob.isProcessing}
                  >
                    <Plus size={14} style={{ marginRight: '4px' }} /> Adaptar Nova
                  </button>
                </div>

                <div style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {keywordFlow.isOpen && keywordFlow.jobId === selectedJob.id && renderKeywordFlow(selectedJob)}

                  {selectedJob.isProcessing && (
                    <div className="doc-card" style={{ padding: '20px', borderStyle: 'dashed', background: 'white', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                      <Loader2 size={22} className="spin" style={{ color: 'var(--tertiary)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase' }}>
                          Gerando nova versao...
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', lineHeight: 1.5, marginTop: '4px' }}>
                          Voce pode fechar este modal enquanto esta aba continuar aberta. Ao abrir a vaga de novo, o loading continua aqui.
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedJob.processingError && (
                    <div className="doc-card" style={{ padding: '20px', borderColor: 'var(--error)', background: 'white' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', color: 'var(--error)', marginBottom: '14px' }}>
                        <AlertCircle size={20} />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase' }}>Erro na geracao</div>
                          <p style={{ margin: '6px 0 0', fontSize: '0.8rem', lineHeight: 1.5 }}>{selectedJob.processingError}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ width: 'auto' }}
                        onClick={() => openKeywordFlow(selectedJob)}
                      >
                        <RotateCcw size={15} /> Tentar novamente
                      </button>
                    </div>
                  )}

                  {(!selectedJob.resumes || selectedJob.resumes.length === 0) && !selectedJob.isProcessing && !keywordFlow.isOpen && (
                    <div className="doc-card" style={{ textAlign: 'center', padding: '48px 24px', background: 'white' }}>
                      <Briefcase size={40} style={{ margin: '0 auto 16px', color: 'var(--border-light)' }} />
                      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: 'var(--secondary)' }}>
                        Confirme as keywords para gerar a primeira versao adaptada desta vaga.
                      </p>
                    </div>
                  )}

                  {(selectedJob.resumes || []).map((resume) => (
                    <div key={resume.id} className="doc-card" style={{ padding: '20px', transition: 'transform 0.2s ease' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)', marginBottom: '4px' }}>
                            {resume.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontFamily: "'Space Grotesk', sans-serif" }}>
                            Gerado em {new Date(resume.dateCreated).toLocaleDateString()}
                          </div>
                        </div>
                        {resume.analysis?.matchScore !== undefined && (
                          <div style={{ background: 'var(--primary)', color: 'white', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                            {resume.analysis.matchScore}% MATCH
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                        <button
                          className="btn-secondary"
                          style={{ flex: 1, padding: '8px', fontSize: '0.7rem' }}
                          onClick={() => openResumeVersion(selectedJob.id, resume.id)}
                        >
                          <Eye size={14} style={{ marginRight: '6px' }} /> VISUALIZAR
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '8px' }}
                          onClick={() => exportJson(resume.data, selectedJob.company)}
                          title="Baixar JSON"
                        >
                          JSON
                        </button>
                        <button
                          className="btn-secondary delete"
                          style={{ padding: '8px', borderColor: 'transparent', color: 'var(--tertiary)' }}
                          onClick={() => deleteResumeFromJob(selectedJob.id, resume.id)}
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {selectedResumeModal.isOpen && selectedResumeJob && selectedResumeVersion && (
        <TailoredResumeModal
          job={selectedResumeJob}
          resumeVersion={selectedResumeVersion}
          onClose={() => setSelectedResumeModal({ isOpen: false, jobId: null, resumeId: null })}
          onSaveVersion={(nextVersion) => updateResumeForJob(selectedResumeJob.id, selectedResumeVersion.id, nextVersion)}
        />
      )}
    </div>
  );
}
