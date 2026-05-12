import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiKey } from '../lib/apiKey';
import { normalizeGeneratedResumes } from '../lib/resumePayload';
import { useLanguage } from '../i18n/LanguageContext';
import WizardProgressBar from './WizardProgressBar';
import WizardStepUpload from './wizard-steps/WizardStepUpload';
import WizardStepAnalysis from './wizard-steps/WizardStepAnalysis';
import WizardStepLevel from './wizard-steps/WizardStepLevel';
import WizardStepKeywords from './wizard-steps/WizardStepKeywords';
import WizardStepResult from './wizard-steps/WizardStepResult';
import '../styles/wizard.css';
import '../styles/resume.css';

const STEP_ORDER = ['upload', 'analysis', 'level', 'keywords', 'result'];

/**
 * WizardEngine — Orchestrates all wizard steps with animated transitions.
 * Manages shared state, API mutations, and step navigation.
 */
export default function WizardEngine({ currentStep, setCurrentStep }) {
  const { language, t } = useLanguage();
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // ── Shared State ─────────────────────────────
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescFile, setJobDescFile] = useState(null);
  const [jobDescText, setJobDescText] = useState('');
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [aggressivenessLevel, setAggressivenessLevel] = useState('balanced');
  const [latexData, setLatexData] = useState(null);
  const [postAnalysisData, setPostAnalysisData] = useState(null);
  const [importedData, setImportedData] = useState(null);
  const [selectedLayout, setSelectedLayout] = useState('professional');
  const [keywordSuggestions, setKeywordSuggestions] = useState([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  const [activeBoostedKeywords, setActiveBoostedKeywords] = useState([]);
  const [isRefining, setIsRefining] = useState(false);

  // ── API Headers ──────────────────────────────
  const getHeaders = (extra = {}) => {
    const geminiKey = getApiKey('gemini');
    const openaiKey = getApiKey('openai');
    return {
      ...(geminiKey ? { 'x-api-key': geminiKey } : {}),
      ...(openaiKey ? { 'x-openai-key': openaiKey } : {}),
      ...extra
    };
  };

  // ── Navigation ───────────────────────────────
  const navigateTo = useCallback((stepId) => {
    const currentIdx = STEP_ORDER.indexOf(currentStep);
    const targetIdx = STEP_ORDER.indexOf(stepId);
    setDirection(targetIdx > currentIdx ? 1 : -1);
    setCurrentStep(stepId);
  }, [currentStep, setCurrentStep]);

  // ── Mutations ────────────────────────────────
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      if (jobDescText) formData.append('jobDescriptionText', jobDescText);
      if (jobDescFile) formData.append('jobDescriptionFile', jobDescFile);
      if (selectedCombo) formData.append('careerCombo', selectedCombo);
      formData.append('language', language);

      const res = await fetch('/api/analyze', {
        method: 'POST', headers: getHeaders(), body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details ? `${err.error} (${err.details})` : (err.error || 'Analysis error'));
      }
      return res.json();
    },
    onSuccess: (data) => {
      setAnalysisData(data.data);
      navigateTo('analysis');
    }
  });

  const generateMutation = useMutation({
    mutationFn: async (boostedKeywords = []) => {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      if (jobDescText) formData.append('jobDescriptionText', jobDescText);
      if (jobDescFile) formData.append('jobDescriptionFile', jobDescFile);
      formData.append('level', aggressivenessLevel);
      if (boostedKeywords.length > 0) formData.append('boostedKeywords', boostedKeywords.join(', '));
      if (selectedCombo) formData.append('careerCombo', selectedCombo);
      formData.append('language', language);

      const res = await fetch('/api/generate', {
        method: 'POST', headers: getHeaders(), body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details ? `${err.error} (${err.details})` : (err.error || 'Generation error'));
      }
      return res.json();
    },
    onSuccess: (data) => {
      setLatexData(data.latex);
      setPostAnalysisData(data.postAnalysis || null);
      navigateTo('result');
    }
  });

  // ── Handlers ─────────────────────────────────
  const handleAnalyze = (e) => {
    e.preventDefault();
    if (!resumeFile) return alert(t('upload.alertNoResume'));
    if (!jobDescText && !jobDescFile) return alert(t('upload.alertNoJob'));
    analyzeMutation.mutate();
  };

  const handleGoToKeywords = async () => {
    navigateTo('keywords');
    setIsLoadingKeywords(true);
    try {
      const resumeSummary = analysisData
        ? `Strengths: ${(analysisData.strengths || []).map(s => s.title).join(', ')}. Keywords found: ${(analysisData.foundKeywords || []).join(', ')}.`
        : '';
      const requestBody = {
        resumeText: resumeSummary || 'Resume uploaded for analysis',
        jobDescription: jobDescText || (jobDescFile ? 'Job provided as image' : ''),
        missingKeywords: (analysisData?.missingKeywords || []).join(', '),
        language: language,
      };
      if (selectedCombo) requestBody.careerCombo = selectedCombo;

      const res = await fetch('/api/suggest-keywords', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(requestBody)
      });
      const data = await res.json();
      if (data.success) setKeywordSuggestions(data.suggestions);
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
    setSelectedCombo(null);
    setKeywordSuggestions([]);
    navigateTo('upload');
  };

  const handleImportJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setImportedData(json);
        navigateTo('result');
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleExportJson = () => {
    const dataToExport = importedData || generateMutation.data?.data;
    if (!dataToExport) return;
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cv-as-code-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefine = async (editModal, instruction) => {
    setIsRefining(true);
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          text: editModal.value,
          jobDescription: jobDescText,
          instruction,
        })
      });
      const data = await res.json();
      if (data.success) {
        // Update the data at the given path
        const newData = JSON.parse(JSON.stringify(importedData || generateMutation.data?.data));
        const layoutData = newData[selectedLayout];
        const keys = editModal.path.split('.');
        let current = layoutData;
        for (let i = 0; i < keys.length - 1; i++) {
          if (current[keys[i]] === undefined) current[keys[i]] = {};
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = data.text;
        setImportedData(newData);
      } else {
        alert('AI Error: ' + data.error);
      }
    } catch {
      alert('Request error.');
    } finally {
      setIsRefining(false);
    }
  };

  // ── Derived Data ─────────────────────────────
  const activeData = importedData || generateMutation.data?.data;
  const generatedResumes = activeData ? normalizeGeneratedResumes(activeData) : {};
  const error = analyzeMutation.error || generateMutation.error;

  // ── Animation Variants ───────────────────────
  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  // ── Render Current Step ──────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <WizardStepUpload
            resumeFile={resumeFile} setResumeFile={setResumeFile}
            jobDescFile={jobDescFile} setJobDescFile={setJobDescFile}
            jobDescText={jobDescText} setJobDescText={setJobDescText}
            selectedCombo={selectedCombo} setSelectedCombo={setSelectedCombo}
            onAnalyze={handleAnalyze}
            onImportJson={handleImportJson}
            isAnalyzing={analyzeMutation.isPending}
            error={error}
          />
        );
      case 'analysis':
        return (
          <WizardStepAnalysis
            analysis={analysisData}
            onOptimize={() => navigateTo('level')}
          />
        );
      case 'level':
        return (
          <WizardStepLevel
            aggressivenessLevel={aggressivenessLevel}
            setAggressivenessLevel={setAggressivenessLevel}
            onBack={() => navigateTo('analysis')}
            onNext={handleGoToKeywords}
          />
        );
      case 'keywords':
        return (
          <WizardStepKeywords
            suggestions={keywordSuggestions}
            isLoading={isLoadingKeywords}
            onGenerate={handleGenerateWithKeywords}
            onBack={() => navigateTo('level')}
            isGenerating={generateMutation.isPending}
            activeCombo={selectedCombo}
          />
        );
      case 'result':
        return (
          <WizardStepResult
            generatedResumes={generatedResumes}
            selectedLayout={selectedLayout} setSelectedLayout={setSelectedLayout}
            latexData={latexData}
            analysisData={analysisData}
            postAnalysisData={postAnalysisData}
            jobDescText={jobDescText}
            onStartOver={handleStartOver}
            onExportJson={handleExportJson}
            onRefine={handleRefine}
            isRefining={isRefining}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile Progress Bar */}
      <WizardProgressBar
        currentStep={currentStep}
        onNavigate={navigateTo}
      />

      {/* Step Content with Animated Transitions */}
      <div className="wizard-step-container">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.25 }
            }}
            className="wizard-step-content"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
