import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { FileText, ImageIcon, Zap, Download, LayoutTemplate, Upload, Edit3, X, Sparkles, Code, Search } from 'lucide-react';
import ProfessionalTheme from './themes/AtsBasicTheme';
import HeritageTheme from './themes/HeritageTheme';
import AnalysisDashboard from './AnalysisDashboard';
import LevelSelector from './LevelSelector';
import CoverLetterPanel from './CoverLetterPanel';
import ScoreComparison from './ScoreComparison';
import KeywordBoost from './KeywordBoost';
import { RESUME_LAYOUTS, normalizeGeneratedResumes } from '../lib/resumePayload';
import { getApiKey } from '../lib/apiKey';
import '../styles/resume.css';

export default function AiGeneratorView({ currentStep, setCurrentStep }) {
  // Helper for fetch headers
  const getHeaders = (extra = {}) => {
    const geminiKey = getApiKey('gemini');
    const openaiKey = getApiKey('openai');
    return {
      ...(geminiKey ? { 'x-api-key': geminiKey } : {}),
      ...(openaiKey ? { 'x-openai-key': openaiKey } : {}),
      ...extra
    };
  };
  // ── State ──────────────────────────────────────────
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescFile, setJobDescFile] = useState(null);
  const [jobDescText, setJobDescText] = useState('');
  const [selectedLayout, setSelectedLayout] = useState('professional');
  const [importedData, setImportedData] = useState(null);
  const [interactionMode, setInteractionMode] = useState('none'); // 'none', 'edit', 'ai'
  const [editModal, setEditModal] = useState(null);
  const [refiningText, setRefiningText] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Pipeline State (currentStep comes from props)
  const [analysisData, setAnalysisData] = useState(null);
  const [aggressivenessLevel, setAggressivenessLevel] = useState('balanced');
  const [latexData, setLatexData] = useState(null);
  const [showLatex, setShowLatex] = useState(false);
  const [postAnalysisData, setPostAnalysisData] = useState(null);
  const [resumeTextCache, setResumeTextCache] = useState('');

  // Keyword Boost State
  const [keywordSuggestions, setKeywordSuggestions] = useState([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  const [activeBoostedKeywords, setActiveBoostedKeywords] = useState([]);

  // ── Dropzones ──────────────────────────────────────
  const { getRootProps: getResumeProps, getInputProps: getResumeInput } = useDropzone({
    accept: { 
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    onDrop: (accepted) => setResumeFile(accepted[0])
  });

  const { getRootProps: getJobProps, getInputProps: getJobInput } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
    onDrop: (accepted) => setJobDescFile(accepted[0])
  });

  // ── Mutations ──────────────────────────────────────

  // Pilar 1: Analyze
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      if (jobDescText) formData.append('jobDescriptionText', jobDescText);
      if (jobDescFile) formData.append('jobDescriptionFile', jobDescFile);

      const res = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro na análise');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setAnalysisData(data.data);
      setCurrentStep('analysis');
    }
  });

  // Pilar 2: Generate with level + boosted keywords
  const generateMutation = useMutation({
    mutationFn: async (boostedKeywords = []) => {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      if (jobDescText) formData.append('jobDescriptionText', jobDescText);
      if (jobDescFile) formData.append('jobDescriptionFile', jobDescFile);
      formData.append('level', aggressivenessLevel);
      if (boostedKeywords.length > 0) {
        formData.append('boostedKeywords', boostedKeywords.join(', '));
      }

      const res = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro na geração');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setLatexData(data.latex);
      setPostAnalysisData(data.postAnalysis || null);
      setCurrentStep('result');
    }
  });

  // ── Handlers ───────────────────────────────────────

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (!resumeFile) return alert('Por favor, envie seu currículo em PDF.');
    if (!jobDescText && !jobDescFile) return alert('Por favor, informe a descrição da vaga (texto ou print).');
    analyzeMutation.mutate();
  };

  const handleGoToLevel = () => {
    setCurrentStep('level');
  };

  const handleGoToKeywords = async () => {
    setCurrentStep('keywords');
    setIsLoadingKeywords(true);
    try {
      // Build a summary from analysis data for keyword suggestion
      const resumeSummary = analysisData
        ? `Pontos fortes: ${(analysisData.strengths || []).map(s => s.title).join(', ')}. Keywords encontradas: ${(analysisData.foundKeywords || []).join(', ')}.`
        : '';

      const res = await fetch('http://localhost:3000/api/suggest-keywords', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          resumeText: resumeSummary,
          jobDescription: jobDescText,
          missingKeywords: (analysisData?.missingKeywords || []).join(', ')
        })
      });
      const data = await res.json();
      if (data.success) {
        setKeywordSuggestions(data.suggestions);
      }
    } catch (e) {
      console.error('Keyword suggestions failed:', e);
    } finally {
      setIsLoadingKeywords(false);
    }
  };

  const handleGenerateWithKeywords = (activeKeywords) => {
    setActiveBoostedKeywords(activeKeywords);
    generateMutation.mutate(activeKeywords);
  };

  const handleStartOver = () => {
    analyzeMutation.reset();
    generateMutation.reset();
    setImportedData(null);
    setAnalysisData(null);
    setLatexData(null);
    setSelectedLayout('professional');
    setInteractionMode('none');
    setCurrentStep('input');
    setShowLatex(false);
  };

  const updateDataByPath = (path, newValue) => {
    const newData = JSON.parse(JSON.stringify(importedData || generateMutation.data?.data));
    const layoutData = newData[selectedLayout];
    
    const keys = path.split('.');
    let current = layoutData;
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] === undefined) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = newValue;
    
    setImportedData(newData);
    setEditModal(null);
    setRefiningText('');
  };

  const handleRefine = async () => {
    if (!refiningText.trim() && !jobDescText) {
      alert("Informe uma instrução ou cole a vaga para a IA saber como melhorar.");
      return;
    }
    setIsRefining(true);
    try {
      const res = await fetch('http://localhost:3000/api/refine', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          text: editModal.value,
          jobDescription: jobDescText,
          instruction: refiningText
        })
      });
      const data = await res.json();
      if (data.success) {
        updateDataByPath(editModal.path, data.text);
      } else {
        alert("Erro na IA: " + data.error);
      }
    } catch (e) {
      alert("Erro na requisição.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleExportJson = () => {
    const dataToExport = importedData || generateMutation.data?.data;
    if (!dataToExport) return;
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cv-as-code-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setImportedData(json);
        setCurrentStep('result');
      } catch (err) {
        alert("Arquivo JSON inválido.");
      }
    };
    reader.readAsText(file);
  };

  const handleCopyLatex = useCallback(() => {
    if (!latexData) return;
    const text = latexData[selectedLayout] || latexData.professional;
    navigator.clipboard.writeText(text);
    alert("Código LaTeX copiado para o clipboard!");
  }, [latexData, selectedLayout]);

  // ── Derived data ────────────────────────────────────
  const activeData = importedData || generateMutation.data?.data;
  const generatedResumes = activeData ? normalizeGeneratedResumes(activeData) : {};
  const generatedData = generatedResumes?.professional;
  const selectedResume = generatedResumes[selectedLayout] ?? generatedResumes.professional;
  const isLoading = analyzeMutation.isPending || generateMutation.isPending;
  const error = analyzeMutation.error || generateMutation.error;

  // ── Build the resume text from the generated data for cover letter ──
  const resumeTextForCoverLetter = selectedResume
    ? `${selectedResume.name}\n${selectedResume.title}\n${selectedResume.email} | ${selectedResume.phone}\n\n${selectedResume.summary}\n\nExperiência:\n${(selectedResume.experience || []).map(e => `${e.role} - ${e.company}\n${(e.responsibilities || []).join('\n')}`).join('\n\n')}`
    : '';

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════

  return (
    <section className="view-section active">

      {/* ── STEP: INPUT ───────────────────────────────── */}
      {currentStep === 'input' && (
        <div className="article-container glass-panel" style={{ maxWidth: '900px' }}>
          <header className="article-header">
            <span className="badge">Inteligência Artificial</span>
            <h1>Gerador de Currículo ATS</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Faça upload do seu currículo atual e dos dados da vaga. Nossa IA primeiro analisará seu CV e depois o reconstruirá com foco total em passar no filtro ATS.
            </p>
          </header>

          <form onSubmit={handleAnalyze} style={{ marginTop: '30px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px' }}>1. Seu Currículo Atual (PDF ou Word)</h3>
              <div {...getResumeProps()} style={dropzoneStyle}>
                <input {...getResumeInput()} />
                <FileText size={40} color="var(--primary)" style={{ marginBottom: '10px' }} />
                {resumeFile ? (
                  <p><strong>{resumeFile.name}</strong> carregado!</p>
                ) : (
                  <p>Arraste seu PDF ou DOCX aqui ou clique para selecionar.</p>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px' }}>2. A Vaga Desejada</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Cole o texto da vaga OU envie um print/screenshot da tela.
              </p>
              
              <textarea 
                placeholder="Cole a descrição da vaga aqui..."
                value={jobDescText}
                onChange={(e) => setJobDescText(e.target.value)}
                style={textareaStyle}
              />

              <div {...getJobProps()} style={{...dropzoneStyle, marginTop: '10px', minHeight: '100px'}}>
                <input {...getJobInput()} />
                <ImageIcon size={30} color="var(--primary)" style={{ marginBottom: '10px' }} />
                {jobDescFile ? (
                  <p><strong>{jobDescFile.name}</strong> carregado!</p>
                ) : (
                  <p>Arraste o print da vaga aqui (opcional se preencheu o texto).</p>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1.1rem' }}
              disabled={isLoading}
            >
              {analyzeMutation.isPending ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Search size={20} />
                </motion.div>
              ) : (
                <Search size={20} />
              )}
              {analyzeMutation.isPending ? 'Diagnosticando seu Currículo...' : 'Diagnosticar Currículo'}
            </button>

            {error && (
              <p style={{ color: 'red', marginTop: '15px', textAlign: 'center' }}>
                Erro: {error.message}
              </p>
            )}

            <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-light)', paddingTop: '20px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '10px', fontSize: '0.9rem' }}>
                Ou pule a análise e importe um CV-as-Code (JSON) gerado anteriormente:
              </p>
              <label className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 20px', borderRadius: '8px', border: '1px solid #ccc', background: '#f9fafb' }}>
                <Upload size={16} /> Importar CV-as-Code
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJson} />
              </label>
            </div>
          </form>
        </div>
      )}

      {/* ── STEP: ANALYSIS ─────────────────────────────── */}
      {currentStep === 'analysis' && analysisData && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <AnalysisDashboard analysis={analysisData} onOptimize={handleGoToLevel} />
        </div>
      )}

      {/* ── STEP: LEVEL SELECT ─────────────────────────── */}
      {currentStep === 'level' && (
        <div className="article-container glass-panel" style={{ maxWidth: '900px' }}>
          <header className="article-header">
            <span className="badge">Otimização</span>
            <h1>Configurar Override</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Defina o nível de interferência algorítmica no seu documento original.
            </p>
          </header>

          <LevelSelector value={aggressivenessLevel} onChange={setAggressivenessLevel} />

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button className="btn-secondary" onClick={() => setCurrentStep('analysis')}>
              ← Voltar ao Diagnóstico
            </button>
            <button
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '16px', fontSize: '1.1rem' }}
              onClick={handleGoToKeywords}
            >
              <Zap size={20} />
              Próximo: Selecionar Keywords
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: KEYWORD BOOST ────────────────────────── */}
      {currentStep === 'keywords' && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <KeywordBoost
            suggestions={keywordSuggestions}
            isLoading={isLoadingKeywords}
            onGenerate={handleGenerateWithKeywords}
            onBack={() => setCurrentStep('level')}
            isGenerating={generateMutation.isPending}
          />
          {generateMutation.isError && (
            <p style={{ color: 'red', marginTop: '15px', textAlign: 'center' }}>
              Erro: {generateMutation.error.message}
            </p>
          )}
        </div>
      )}

      {/* ── STEP: RESULT ───────────────────────────────── */}
      {currentStep === 'result' && generatedData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="resume-toolbar glass-panel">
            <div className="resume-info">
              <h3>Sucesso!</h3>
              <p>Foram gerados 2 modelos otimizados para sua vaga.</p>
            </div>
            <div className="resume-toolbar-actions">
              <div className="layout-toggle" role="group" aria-label="Escolha o modelo do currículo">
                {Object.entries(RESUME_LAYOUTS).map(([layout, config]) => (
                  <button
                    key={layout}
                    type="button"
                    className={`layout-toggle-button ${selectedLayout === layout ? 'active' : ''}`}
                    aria-pressed={selectedLayout === layout}
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
                <Edit3 size={16} /> Editar Manual
              </button>
              <button 
                className={`btn-secondary ${interactionMode === 'ai' ? 'active' : ''}`} 
                onClick={() => setInteractionMode(interactionMode === 'ai' ? 'none' : 'ai')}
                style={{ background: interactionMode === 'ai' ? '#8b5cf6' : '', color: interactionMode === 'ai' ? 'white' : '', borderColor: interactionMode === 'ai' ? '#8b5cf6' : '' }}
              >
                <Sparkles size={16} /> Modificar com IA
              </button>
              <button className="btn-secondary" onClick={handleStartOver}>
                Fazer Outro
              </button>
              <button className="btn-secondary" onClick={handleExportJson}>
                <Download size={16} /> Exportar JSON
              </button>
              {latexData && (
                <button className="btn-secondary" onClick={handleCopyLatex}>
                  <Code size={16} /> Copiar LaTeX
                </button>
              )}
              <button className="btn-primary" onClick={() => window.print()}>
                <Download size={16} /> Salvar PDF
              </button>
            </div>
          </div>

          {/* Score Comparison — Before vs After */}
          <div style={{ maxWidth: '900px', margin: '0 auto 24px' }}>
            <ScoreComparison before={analysisData} after={postAnalysisData} />
          </div>

          <div className="resume-paper-container">
            <div className={`resume-paper ${RESUME_LAYOUTS[selectedLayout].className}`}>
              {selectedLayout === 'heritage' ? (
                <HeritageTheme data={selectedResume} onEdit={interactionMode !== 'none' ? (path, value) => setEditModal({ path, value, type: interactionMode }) : null} />
              ) : (
                <ProfessionalTheme data={selectedResume} onEdit={interactionMode !== 'none' ? (path, value) => setEditModal({ path, value, type: interactionMode }) : null} />
              )}
            </div>
          </div>

          {/* Cover Letter Panel — Pilar 4 */}
          <div style={{ maxWidth: '900px', margin: '40px auto 0' }}>
            <CoverLetterPanel
              resumeText={resumeTextForCoverLetter}
              jobDescription={jobDescText}
            />
          </div>

          {/* LaTeX Expandable */}
          {latexData && (
            <div style={{ maxWidth: '900px', margin: '24px auto 60px' }}>
              <button
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setShowLatex(!showLatex)}
              >
                <Code size={16} />
                {showLatex ? 'Ocultar' : 'Exibir'} Código LaTeX ({selectedLayout === 'heritage' ? 'Heritage' : 'Profissional'})
              </button>
              {showLatex && (
                <div style={{ marginTop: '12px', background: '#1e1e2e', borderRadius: '0', padding: '20px', border: '1px solid var(--secondary)' }}>
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
              <div className="modal-content glass-panel" style={{ width: '500px', maxWidth: '90%', background: 'white', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {editModal.type === 'ai' ? <><Sparkles size={20} color="#8b5cf6" /> Modificar com IA</> : <><Edit3 size={20} /> Editar Manual</>}
                  </h3>
                  <button onClick={() => setEditModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                
                {editModal.type === 'edit' ? (
                  <textarea 
                    value={editModal.value}
                    onChange={(e) => setEditModal({ ...editModal, value: e.target.value })}
                    style={{ width: '100%', minHeight: '150px', padding: '12px', fontFamily: 'inherit', resize: 'vertical', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                ) : (
                  <>
                    <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.9rem', color: '#334155', maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0' }}>
                      <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Trecho Original:</strong>
                      {editModal.value}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Instrução para a IA:</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Adicione métricas e palavras-chave de gestão..." 
                        value={refiningText}
                        onChange={(e) => setRefiningText(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        onKeyDown={(e) => { if(e.key === 'Enter') handleRefine() }}
                      />
                      <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        A IA vai reescrever o trecho acima considerando a sua vaga de emprego.
                      </small>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <button className="btn-secondary" onClick={() => setEditModal(null)}>Cancelar</button>
                  {editModal.type === 'ai' ? (
                    <button className="btn-primary" onClick={handleRefine} disabled={isRefining} style={{ background: '#8b5cf6' }}>
                      {isRefining ? 'Processando...' : 'Gerar e Substituir'}
                    </button>
                  ) : (
                    <button className="btn-primary" onClick={() => updateDataByPath(editModal.path, editModal.value)}>Salvar</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </section>
  );
}

const dropzoneStyle = {
  border: '1px solid var(--secondary)',
  borderRadius: '0',
  padding: '40px',
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '150px'
};

const textareaStyle = {
  width: '100%',
  minHeight: '120px',
  padding: '16px',
  borderRadius: '0',
  border: '1px solid var(--secondary)',
  backgroundColor: 'transparent',
  resize: 'vertical',
  fontFamily: 'inherit',
  fontSize: '0.95rem',
  color: 'var(--primary)'
};
