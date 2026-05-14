import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { FileText, ImageIcon, Search, Upload } from 'lucide-react';
import CareerComboSelector from '../CareerComboSelector';
import LanguageSwitcher from '../LanguageSwitcher';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * WizardStepUpload — Step 1: Upload resume + job description.
 */
export default function WizardStepUpload({
  resumeFile, setResumeFile,
  jobDescFile, setJobDescFile,
  jobDescText, setJobDescText,
  selectedCombo, setSelectedCombo,
  onAnalyze,
  onImportJson,
  isAnalyzing,
  error,
}) {
  const { t } = useLanguage();

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

  return (
    <div className="article-container glass-panel" style={{ maxWidth: '900px' }}>
      <header className="article-header">
        <span className="badge">{t('upload.badge')}</span>
        <h1>{t('upload.title')}</h1>
        <p style={{ color: 'var(--secondary)' }}>{t('upload.subtitle')}</p>
      </header>

      {/* Language Switcher */}
      <div style={{ marginTop: '24px' }}>
        <LanguageSwitcher />
      </div>

      <form onSubmit={onAnalyze} style={{ marginTop: '6px' }}>
        {/* Career Combo */}
        <CareerComboSelector value={selectedCombo} onChange={setSelectedCombo} />

        {/* Resume Upload */}
        <div className="wizard-input-section">
          <h3>{t('upload.resumeLabel')}</h3>
          <div {...getResumeProps()} className={`dropzone-area ${resumeFile ? 'has-file' : ''}`}>
            <input {...getResumeInput()} />
            <FileText size={36} color="var(--primary)" style={{ marginBottom: '10px' }} />
            {resumeFile ? (
              <p><span className="file-name">{resumeFile.name}</span> {t('upload.resumeUploaded')}</p>
            ) : (
              <p>{t('upload.resumePlaceholder')}</p>
            )}
          </div>
        </div>

        {/* Job Description */}
        <div className="wizard-input-section">
          <h3>{t('upload.jobLabel')}</h3>
          <p className="wizard-input-hint">{t('upload.jobHint')}</p>

          <textarea
            className="wizard-textarea"
            placeholder={t('upload.jobPlaceholder')}
            value={jobDescText}
            onChange={(e) => setJobDescText(e.target.value)}
          />

          <div {...getJobProps()} className={`dropzone-area ${jobDescFile ? 'has-file' : ''}`} style={{ marginTop: '10px', minHeight: '100px' }}>
            <input {...getJobInput()} />
            <ImageIcon size={28} color="var(--primary)" style={{ marginBottom: '10px' }} />
            {jobDescFile ? (
              <p><span className="file-name">{jobDescFile.name}</span> {t('upload.resumeUploaded')}</p>
            ) : (
              <p>{t('upload.jobImagePlaceholder')}</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn-primary btn-shimmer"
          style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1.05rem' }}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
              <Search size={20} />
            </motion.div>
          ) : (
            <Search size={20} />
          )}
          {isAnalyzing ? t('upload.analyzing') : t('upload.analyze')}
        </button>

        {error && (
          <p style={{ color: 'red', marginTop: '15px', textAlign: 'center' }}>
            {t('common.error')}: {error.message}
          </p>
        )}

        {/* Import JSON */}
        <div className="wizard-import-section">
          <p className="wizard-import-hint">{t('upload.importHint')}</p>
          <label className="wizard-import-label">
            <Upload size={16} /> {t('upload.importBtn')}
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={onImportJson} />
          </label>
        </div>
      </form>
    </div>
  );
}
