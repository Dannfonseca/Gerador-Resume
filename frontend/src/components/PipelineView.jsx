import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Briefcase,
  Check,
  CheckCircle,
  ExternalLink,
  Eye,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useJobPipeline } from '../lib/useJobPipeline';
import { getApiKey, getAiModel } from '../lib/apiKey';
import { normalizeGeneratedResumes } from '../lib/resumePayload';
import TailoredResumeModal from './TailoredResumeModal';
import ConfirmationModal from './ConfirmationModal';
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
  jobId: null,
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

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {
      error: 'O servidor respondeu em um formato inesperado.',
      details: 'A resposta nao era JSON valido.',
    };
  }
}

function formatApiError(payload, fallbackMessage, status) {
  const parts = [
    payload?.error || fallbackMessage,
    payload?.details,
    payload?.hint,
    status ? `Status HTTP: ${status}` : '',
  ].filter(Boolean);

  return [...new Set(parts)].join('\n\n');
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
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: 'job', // 'job' or 'resume'
    jobId: null,
    resumeId: null,
    title: '',
    message: '',
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

  const processJobAnalysisBackground = async (jobId, formJob, masterStr) => {
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
        const extractionData = await readJsonResponse(extractionResponse);
        if (!extractionResponse.ok || !extractionData.success) {
          throw new Error(formatApiError(extractionData, 'Nao foi possivel extrair a vaga.', extractionResponse.status));
        }

        jd = extractionData.description || '';
        company = extractionData.company || company;
        title = extractionData.title || title;
      }

      if (!jd) {
        throw new Error('A descricao da vaga nao pode ser lida. Cole o texto manualmente.');
      }

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
      const analysisData = await readJsonResponse(analysisResponse);
      if (!analysisResponse.ok || !analysisData.success) {
        throw new Error(formatApiError(analysisData, 'Nao foi possivel analisar a vaga.', analysisResponse.status));
      }

      updateJob(jobId, {
        company: company || 'Empresa nao identificada',
        title: title || 'Cargo nao identificado',
        url: formJob.url,
        jdRaw: jd,
        analysisData: analysisData.data,
        analysisStatus: 'ready',
        analysisError: null,
      });

      setAddModal((prev) => (
        prev.jobId === jobId
          ? { ...prev, step: 3, loadingMsg: 'Analise pronta.', error: '' }
          : prev
      ));
    } catch (error) {
      updateJob(jobId, {
        company: formJob.company.trim() || 'Empresa nao identificada',
        title: formJob.title.trim() || 'Cargo nao identificado',
        url: formJob.url,
        jdRaw: formJob.jdText.trim(),
        analysisStatus: 'failed',
        analysisError: error.message || 'Erro ao analisar vaga.',
      });

      setAddModal((prev) => (
        prev.jobId === jobId
          ? {
              ...prev,
              step: 1,
              error: error.message || 'Erro ao adicionar vaga.',
            }
          : prev
      ));
    }
  };

  const handleAddStart = (event) => {
    event.preventDefault();

    const formJob = {
      company: addModal.job.company.trim(),
      title: addModal.job.title.trim(),
      url: addModal.job.url.trim(),
      jdText: addModal.job.jdText.trim(),
    };

    if (!formJob.url && (!formJob.company || !formJob.title || !formJob.jdText)) {
      setAddModal((prev) => ({
        ...prev,
        error: 'Forneca um link ou preencha empresa, cargo e descricao manualmente.',
      }));
      return;
    }

    if (!formJob.jdText && formJob.url.includes('linkedin.com')) {
      setAddModal((prev) => ({
        ...prev,
        error: 'LinkedIn costuma bloquear extracao. Cole a descricao manualmente.',
      }));
      return;
    }

    const masterStr = localStorage.getItem('ats_master_resume');
    if (!masterStr) {
      setAddModal((prev) => ({
        ...prev,
        error: 'Configure seu Curriculo Mestre antes de adicionar vagas.',
      }));
      return;
    }

    const jobId = addJob({
      company: formJob.company || 'Analisando empresa',
      title: formJob.title || 'Vaga em analise',
      url: formJob.url,
      jdRaw: formJob.jdText,
      analysisData: null,
      analysisStatus: 'analyzing',
      analysisError: null,
      keywordSelection: [],
      isProcessing: false,
      processingError: null,
    });

    setAddModal((prev) => ({
      ...prev,
      step: 2,
      jobId,
      loadingMsg: formJob.jdText ? 'Analisando match e keywords...' : 'Extraindo dados e analisando a vaga...',
      error: '',
    }));

    processJobAnalysisBackground(jobId, formJob, masterStr);
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
      const tailorData = await readJsonResponse(tailorResponse);
      if (!tailorResponse.ok || !tailorData.success) {
        throw new Error(formatApiError(tailorData, 'Nao foi possivel adaptar o curriculo.', tailorResponse.status));
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
      const analysisData = await readJsonResponse(analysisResponse);
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

  const requestDeleteJob = (event, job) => {
    event.stopPropagation();
    const hasResumes = job.resumes && job.resumes.length > 0;
    setDeleteModal({
      isOpen: true,
      type: 'job',
      jobId: job.id,
      title: 'Excluir Vaga',
      message: hasResumes 
        ? `Esta vaga contém ${job.resumes.length} currículo(s) adaptado(s). Ao excluir a vaga, todos eles serão removidos permanentemente.`
        : 'Tem certeza que deseja remover esta vaga da sua lista?',
    });
  };

  const requestDeleteResume = (event, jobId, resumeId) => {
    event.stopPropagation();
    setDeleteModal({
      isOpen: true,
      type: 'resume',
      jobId,
      resumeId,
      title: 'Excluir Versão',
      message: 'Tem certeza que deseja excluir esta versão do currículo? Esta ação não pode ser desfeita.',
    });
  };

  const confirmDelete = () => {
    if (deleteModal.type === 'job') {
      deleteJob(deleteModal.jobId);
    } else {
      deleteResumeFromJob(deleteModal.jobId, deleteModal.resumeId);
    }
    setDeleteModal({ ...deleteModal, isOpen: false });
  };

  const openKeywordFlow = (job) => {
    setKeywordFlow({
      isOpen: true,
      jobId: job.id,
      selectedKeywords: job.keywordSelection || [],
    });
  };

  const getJobAnalysisStatus = (job) => job.analysisStatus || (job.analysisData ? 'ready' : 'idle');

  const [isJdExpanded, setIsJdExpanded] = useState(false);

  const openJobAnalysis = (job) => {
    setJobDetailModal({ isOpen: true, jobId: job.id });
    // If no resumes yet, expand JD by default
    setIsJdExpanded(!job.resumes || job.resumes.length === 0);
    
    if (getJobAnalysisStatus(job) === 'ready' && (!job.resumes || job.resumes.length === 0)) {
      setKeywordFlow({ isOpen: true, jobId: job.id, selectedKeywords: job.keywordSelection || [] });
    } else {
      setKeywordFlow({ isOpen: false, jobId: null, selectedKeywords: [] });
    }
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
              {jobs.map((job) => {
                const analysisStatus = getJobAnalysisStatus(job);
                return (
                  <tr
                    key={job.id}
                    onClick={() => setJobDetailModal({ isOpen: true, jobId: job.id })}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className={`status-${job.status.replace(/\s+/g, '-').toLowerCase()}`}>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '4px' }}>{job.company}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        {job.title}
                        {job.url && <ExternalLink size={14} style={{ opacity: 0.6 }} />}
                      </div>
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <select
                        value={job.status}
                        onChange={(event) => handleStatusChange(job.id, event.target.value)}
                        className="status-select"
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          background: 'var(--neutral)', 
                          padding: '6px 14px', 
                          border: '1px solid var(--border-light)',
                          fontSize: '0.75rem', 
                          fontWeight: 800,
                          fontFamily: "'Space Grotesk', sans-serif"
                        }}>
                          {job.resumes?.length || 0} VERSÕES
                        </div>
                        {analysisStatus === 'analyzing' && <Loader2 size={16} className="spin" style={{ color: 'var(--secondary)' }} />}
                        {job.isProcessing && <Loader2 size={16} className="spin" style={{ color: 'var(--tertiary)' }} />}
                      </div>
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <div className="pipeline-actions">
                        {analysisStatus === 'analyzing' && (
                          <span className="pipeline-status-pill analyzing">
                            <Loader2 size={13} className="spin" /> Analisando
                          </span>
                        )}
                        {analysisStatus === 'ready' && (
                          <button
                            type="button"
                            className="pipeline-ready-button"
                            onClick={() => openJobAnalysis(job)}
                          >
                            <Sparkles size={15} /> Abrir analise
                          </button>
                        )}
                        {analysisStatus === 'failed' && (
                          <span className="pipeline-status-pill failed" title={job.analysisError || 'Falha na analise'}>
                            <AlertCircle size={13} /> Falhou
                          </span>
                        )}
                        <button className="icon-btn delete" onClick={(event) => requestDeleteJob(event, job)} title="Excluir Vaga">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
              <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Loader2 size={48} className="spin" style={{ color: 'var(--tertiary)', marginBottom: '1.5rem' }} />
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1rem' }}>
                  {addModal.loadingMsg}
                </h3>
                <p style={{ maxWidth: '420px', color: 'var(--secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: '12px 0 24px' }}>
                  A analise continua nesta aba. Voce pode fechar este modal e cadastrar outras vagas enquanto ela termina.
                </p>
                <button type="button" className="btn-secondary" onClick={closeAddModal} style={{ width: 'auto' }}>
                  Fechar e continuar
                </button>
              </div>
            )}

            {addModal.step === 3 && (
              <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <CheckCircle size={48} style={{ color: '#16a34a', marginBottom: '1.5rem' }} />
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1rem' }}>
                  Analise pronta
                </h3>
                <p style={{ maxWidth: '420px', color: 'var(--secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: '12px 0 24px' }}>
                  A vaga ja esta na lista. Abra para revisar match, keywords e gerar o curriculo adaptado.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn-secondary" onClick={closeAddModal} style={{ width: 'auto' }}>
                    Fechar
                  </button>
                  <button
                    type="button"
                    className="pipeline-ready-button"
                    onClick={() => {
                      const job = jobs.find((item) => item.id === addModal.jobId);
                      if (job) openJobAnalysis(job);
                      closeAddModal();
                    }}
                  >
                    <CheckCircle size={15} /> Abrir analise
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {jobDetailModal.isOpen && selectedJob && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-standard"
            style={{ width: '100%', maxWidth: '1100px', height: '85vh', overflow: 'hidden' }}
          >
            <div className="modal-standard-header">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>{selectedJob.title}</h2>
                  <div style={{ height: '16px', width: '2px', background: 'var(--border-light)' }} />
                  <p style={{ margin: 0, color: 'var(--tertiary)', fontWeight: 800, fontSize: '0.8rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                    {selectedJob.company}
                  </p>
                </div>
              </div>
              <button 
                className="icon-btn-red" 
                onClick={() => setJobDetailModal({ isOpen: false, jobId: null })}
                style={{ borderRadius: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', background: 'white' }}>
              {/* Left Column: Job Description (Collapsible) */}
              <motion.div 
                animate={{ width: isJdExpanded ? '55%' : '50px' }}
                style={{ 
                  borderRight: '1px solid var(--border-light)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  overflow: 'hidden',
                  background: isJdExpanded ? 'white' : 'var(--neutral)',
                }}
              >
                <div style={{ 
                  padding: isJdExpanded ? '12px 24px' : '16px 0', 
                  background: 'var(--neutral)', 
                  borderBottom: '1px solid var(--border-light)', 
                  display: 'flex', 
                  flexDirection: isJdExpanded ? 'row' : 'column',
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  minHeight: '50px'
                }}>
                  {isJdExpanded ? (
                    <>
                      <h4 className="wizard-title" style={{ margin: 0, fontSize: '0.75rem' }}>DESCRICAO</h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="icon-btn" onClick={() => setIsJdExpanded(false)} title="Recolher" style={{ padding: '4px' }}>
                          <Eye size={16} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <button className="icon-btn" onClick={() => setIsJdExpanded(true)} title="Ver Descricao" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}>
                      <Eye size={18} />
                    </button>
                  )}
                </div>
                {isJdExpanded && (
                  <div className="modal-standard-body" style={{ padding: '32px', overflowY: 'auto' }}>
                    <div style={{ fontSize: 'var(--font-body)', color: 'var(--primary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {selectedJob.jdRaw}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Right Column: Versions & Keywords */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--neutral)' }}>
                <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '50px' }}>
                  <h4 className="wizard-title" style={{ margin: 0, fontSize: '0.75rem' }}>{keywordFlow.isOpen ? 'ADAPTACAO IA' : 'VERSOES'}</h4>
                  {!keywordFlow.isOpen && (
                    <button
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.7rem' }}
                      onClick={() => openKeywordFlow(selectedJob)}
                      disabled={selectedJob.isProcessing || getJobAnalysisStatus(selectedJob) !== 'ready'}
                    >
                      <Plus size={14} style={{ marginRight: '4px' }} /> ADAPTAR NOVA
                    </button>
                  )}
                </div>

                <div className="modal-standard-body" style={{ background: 'var(--neutral)', padding: '24px' }}>
                  {keywordFlow.isOpen && keywordFlow.jobId === selectedJob.id && renderKeywordFlow(selectedJob)}

                  {!keywordFlow.isOpen && (
                    <>
                      {getJobAnalysisStatus(selectedJob) === 'analyzing' && (
                        <div className="doc-card" style={{ padding: '20px', borderStyle: 'dashed', background: 'white', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                          <Loader2 size={22} className="spin" style={{ color: 'var(--tertiary)', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase' }}>
                              Analisando vaga...
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedJob.isProcessing && (
                        <div className="doc-card" style={{ padding: '20px', borderStyle: 'dashed', background: 'white', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                          <Loader2 size={22} className="spin" style={{ color: 'var(--tertiary)', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase' }}>
                              Gerando nova versao...
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
                        </div>
                      )}

                      {(!selectedJob.resumes || selectedJob.resumes.length === 0) && !selectedJob.isProcessing && !keywordFlow.isOpen && getJobAnalysisStatus(selectedJob) === 'ready' && (
                        <div className="doc-card" style={{ textAlign: 'center', padding: '48px 24px', background: 'white' }}>
                          <Briefcase size={40} style={{ margin: '0 auto 16px', color: 'var(--border-light)' }} />
                          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: 'var(--secondary)', fontSize: '0.9rem' }}>
                            Confirme as keywords para gerar a primeira versao adaptada desta vaga.
                          </p>
                        </div>
                      )}

                      {(selectedJob.resumes || []).map((resume) => (
                        <div 
                          key={resume.id} 
                          style={{ 
                            padding: '12px 16px', 
                            display: 'flex', 
                            flexWrap: 'wrap',
                            alignItems: 'center', 
                            background: 'white',
                            border: '1px solid var(--border-light)',
                            gap: '12px',
                            justifyContent: 'space-between'
                          }}
                        >
                          {/* Info Column */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 auto', minWidth: '200px' }}>
                            <span style={{ fontWeight: 900, fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                              {resume.name}
                            </span>
                            <span style={{ fontSize: '0.6rem', color: 'var(--secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {new Date(resume.dateCreated).toLocaleDateString()}
                            </span>
                            
                            {resume.analysis?.matchScore !== undefined && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid var(--border-light)', paddingLeft: '8px' }}>
                                <div style={{ 
                                  background: 'var(--primary)', 
                                  color: 'white', 
                                  padding: '2px 6px', 
                                  fontSize: '0.6rem', 
                                  fontWeight: 800, 
                                  fontFamily: "'Space Grotesk', sans-serif",
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  {selectedJob.analysisData?.matchScore !== undefined && (
                                    <span style={{ opacity: 0.5, textDecoration: 'line-through', fontSize: '0.5rem' }}>{selectedJob.analysisData.matchScore}%</span>
                                  )}
                                  <span>{resume.analysis.matchScore}%</span>
                                </div>
                                {selectedJob.analysisData?.matchScore !== undefined && resume.analysis.matchScore > selectedJob.analysisData.matchScore && (
                                  <span style={{ color: '#16a34a', fontSize: '0.6rem', fontWeight: 800 }}>
                                    +{resume.analysis.matchScore - selectedJob.analysisData.matchScore}%
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions Column */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <button 
                              className="btn-primary" 
                              style={{ padding: '6px 10px', fontSize: '0.65rem', width: 'auto' }} 
                              onClick={() => openResumeVersion(selectedJob.id, resume.id)}
                            >
                              VISUALIZAR
                            </button>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '6px 8px', fontSize: '0.6rem', width: 'auto' }} 
                              onClick={() => exportJson(resume.data, selectedJob.company)}
                            >
                              JSON
                            </button>
                            <button 
                              className="icon-btn delete" 
                              style={{ padding: '4px', color: 'var(--secondary)', display: 'flex' }} 
                              onClick={(event) => requestDeleteResume(event, selectedJob.id, resume.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {deleteModal.isOpen && (
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          title={deleteModal.title}
          message={deleteModal.message}
          confirmText="Sim, Excluir"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        />
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
