import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { FileText, ImageIcon, Zap, Download, LayoutTemplate } from 'lucide-react';
import ProfessionalTheme from './themes/AtsBasicTheme';
import HeritageTheme from './themes/HeritageTheme';
import { RESUME_LAYOUTS, normalizeGeneratedResumes } from '../lib/resumePayload';
import '../styles/resume.css';

export default function AiGeneratorView() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescFile, setJobDescFile] = useState(null);
  const [jobDescText, setJobDescText] = useState('');
  const [selectedLayout, setSelectedLayout] = useState('professional');

  // Dropzone for Resume PDF/DOCX
  const { getRootProps: getResumeProps, getInputProps: getResumeInput } = useDropzone({
    accept: { 
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    onDrop: (accepted) => setResumeFile(accepted[0])
  });

  // Dropzone for Job Description Image
  const { getRootProps: getJobProps, getInputProps: getJobInput } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
    onDrop: (accepted) => setJobDescFile(accepted[0])
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      if (jobDescText) formData.append('jobDescriptionText', jobDescText);
      if (jobDescFile) formData.append('jobDescriptionFile', jobDescFile);

      const res = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro na geração');
      }

      return res.json();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resumeFile) return alert('Por favor, envie seu currículo em PDF.');
    if (!jobDescText && !jobDescFile) return alert('Por favor, informe a descrição da vaga (texto ou print).');
    
    mutation.mutate();
  };

  const generatedResumes = normalizeGeneratedResumes(mutation.data?.data);
  const generatedData = generatedResumes.professional;
  const selectedResume = generatedResumes[selectedLayout] ?? generatedResumes.professional;

  return (
    <section className="view-section active">
      {!generatedData ? (
        <div className="article-container glass-panel" style={{ maxWidth: '900px' }}>
          <header className="article-header">
            <span className="badge">Inteligência Artificial</span>
            <h1>Gerador de Currículo ATS</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Faça upload do seu currículo atual e dos dados da vaga que você quer. Nossa IA analisará ambos e reconstruirá seu CV com foco total em passar no filtro do ATS dessa vaga.
            </p>
          </header>

          <form onSubmit={handleSubmit} style={{ marginTop: '30px' }}>
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
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Zap size={20} />
                </motion.div>
              ) : (
                <Zap size={20} />
              )}
              {mutation.isPending ? 'Analisando e Gerando Currículo ATS...' : 'Gerar Currículo Otimizado'}
            </button>

            {mutation.isError && (
              <p style={{ color: 'red', marginTop: '15px', textAlign: 'center' }}>
                Erro: {mutation.error.message}
              </p>
            )}
          </form>
        </div>
      ) : (
        // SHOW GENERATED RESUME
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
              <button className="btn-secondary" onClick={() => { mutation.reset(); setSelectedLayout('professional'); }}>
                Fazer Outro
              </button>
              <button className="btn-primary" onClick={() => window.print()}>
                <Download size={16} />
                Salvar PDF
              </button>
            </div>
          </div>
          <div className="resume-paper-container">
            <div className={`resume-paper ${RESUME_LAYOUTS[selectedLayout].className}`}>
              {selectedLayout === 'heritage' ? (
                <HeritageTheme data={selectedResume} />
              ) : (
                <ProfessionalTheme data={selectedResume} />
              )}
            </div>
          </div>
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
