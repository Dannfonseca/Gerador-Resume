import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Copy, Edit3, Check, Loader2, Code } from 'lucide-react';
import { getApiKey } from '../lib/apiKey';

/**
 * CoverLetterPanel — Generates and displays a Cover Letter.
 * Inspired by apresentando.me's brutalist cover letter module.
 */
export default function CoverLetterPanel({ resumeText, jobDescription }) {
  const [coverLetter, setCoverLetter] = useState(null);
  const [latex, setLatex] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [showLatex, setShowLatex] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const geminiKey = getApiKey('gemini');
    const openaiKey = getApiKey('openai');
    try {
      const res = await fetch('http://localhost:3000/api/cover-letter', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(geminiKey ? { 'x-api-key': geminiKey } : {}),
          ...(openaiKey ? { 'x-openai-key': openaiKey } : {})
        },
        body: JSON.stringify({
          resumeText,
          jobDescription
        })
      });
      const data = await res.json();
      if (data.success) {
        setCoverLetter(data.text);
        setEditText(data.text);
        setLatex(data.latex || '');
      } else {
        alert("Erro ao gerar carta: " + data.error);
      }
    } catch (e) {
      alert("Erro na requisição.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!coverLetter && !isGenerating) {
    return (
      <div className="cover-letter-cta">
        <div className="cover-letter-cta-content">
          <FileText size={28} />
          <div>
            <h3>Carta de Apresentação</h3>
            <p>Gere uma Cover Letter persuasiva baseada no seu currículo e na vaga desejada.</p>
          </div>
        </div>
        <button className="btn-primary" onClick={handleGenerate}>
          Gerar Cover Letter
        </button>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="cover-letter-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Loader2 size={28} />
        </motion.div>
        <span>Gerando carta de apresentação estratégica...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="cover-letter-result"
    >
      <div className="cover-letter-header">
        <h3><FileText size={18} /> Cover Letter Gerada</h3>
        <div className="cover-letter-actions">
          <button
            className="btn-secondary btn-sm"
            onClick={() => {
              setIsEditing(!isEditing);
              if (isEditing) {
                setCoverLetter(editText);
              }
            }}
          >
            <Edit3 size={14} />
            {isEditing ? 'Salvar' : 'Editar'}
          </button>
          <button className="btn-secondary btn-sm" onClick={() => handleCopy(coverLetter)}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      {isEditing ? (
        <textarea
          className="cover-letter-editor"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          rows={12}
        />
      ) : (
        <div className="cover-letter-text">
          {coverLetter.split('\n\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      {/* LaTeX Collapsible */}
      {latex && (
        <div className="cover-letter-latex">
          <button
            className="cover-letter-latex-toggle"
            onClick={() => setShowLatex(!showLatex)}
          >
            <Code size={14} />
            <span>{showLatex ? 'Ocultar' : 'Exibir'} Código LaTeX</span>
          </button>
          {showLatex && (
            <div className="cover-letter-latex-content">
              <pre>{latex}</pre>
              <button className="btn-secondary btn-sm" onClick={() => handleCopy(latex)}>
                <Copy size={14} /> Copiar LaTeX
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
