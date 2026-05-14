import { useState } from 'react';
import { X, Key, Save, Trash2, Eye, EyeOff, CheckCircle, Sparkles, Settings, ShieldCheck, BrainCircuit, Box, Info } from 'lucide-react';
import { getApiKey, saveApiKey, clearApiKey, saveAiModel, getAiModel } from '../lib/apiKey';
import { DEFAULT_AI_MODEL, PROVIDERS } from '../lib/aiModels';
import { useLanguage } from '../i18n/LanguageContext';
import { motion } from 'framer-motion';

export default function SettingsModal({ onClose, onSaved }) {
  const { t } = useLanguage();
  const [geminiKey, setGeminiKey] = useState(() => getApiKey('gemini') || '');
  const [openaiKey, setOpenaiKey] = useState(() => getApiKey('openai') || '');
  const [anthropicKey, setAnthropicKey] = useState(() => getApiKey('anthropic') || '');
  const [selectedModel, setSelectedModel] = useState(() => getAiModel() || DEFAULT_AI_MODEL);
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  const [hasGemini, setHasGemini] = useState(() => !!getApiKey('gemini'));
  const [hasOpenai, setHasOpenai] = useState(() => !!getApiKey('openai'));
  const [hasAnthropic, setHasAnthropic] = useState(() => !!getApiKey('anthropic'));

  const handleSave = () => {
    const normalized = {
      gemini: geminiKey.trim(),
      openai: openaiKey.trim(),
      anthropic: anthropicKey.trim(),
    };

    saveApiKey('gemini', normalized.gemini);
    saveApiKey('openai', normalized.openai);
    saveApiKey('anthropic', normalized.anthropic);
    saveAiModel(selectedModel);

    const wasPersisted =
      (getApiKey('gemini') || '') === normalized.gemini &&
      (getApiKey('openai') || '') === normalized.openai &&
      (getApiKey('anthropic') || '') === normalized.anthropic &&
      getAiModel() === selectedModel;

    if (!wasPersisted) {
      setSaveError('As configurações não foram confirmadas no armazenamento local.');
      return;
    }

    setHasGemini(!!normalized.gemini);
    setHasOpenai(!!normalized.openai);
    setHasAnthropic(!!normalized.anthropic);
    setSaveError('');
    setIsSaved(true);
    onSaved?.('Configurações salvas.');
    onClose();
  };

  const handleDelete = (service) => {
    if (confirm(t('nav.settings') + "?")) {
      clearApiKey(service);
      if (service === 'gemini') { setGeminiKey(''); setHasGemini(false); }
      if (service === 'openai') { setOpenaiKey(''); setHasOpenai(false); }
      if (service === 'anthropic') { setAnthropicKey(''); setHasAnthropic(false); }
    }
  };

  return (
    <div className="modal-overlay" style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(26, 28, 30, 0.8)', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', zIndex: 2000,
      backdropFilter: 'blur(8px)'
    }}>
      <div className="modal-content glass-panel" style={{ 
        width: '800px', maxWidth: '98%', background: 'white', 
        padding: '24px 32px', borderRadius: '12px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        border: '1px solid var(--primary)',
        maxHeight: '98vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem' }}>
            <Settings size={24} color="var(--primary)" /> {t('nav.settings')}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* AI Model Selection */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BrainCircuit size={18} color="var(--primary)" />
            <h4 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
              {t('models.title')}
            </h4>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {PROVIDERS.map((provider) => (
              <div key={provider.id}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '10px', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                   {provider.label}
                </div>
                <div className="model-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {provider.models.map((model) => {
                    const isSelected = selectedModel === model.id;
                    const isRecommended = model.recommended;
                    
                    return (
                      <button
                        key={model.id}
                        type="button"
                        className={`model-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedModel(model.id)}
                        style={{ 
                          padding: '8px 12px', 
                          minHeight: '70px', 
                          justifyContent: 'center',
                          border: isRecommended ? '1.5px solid rgba(220, 38, 38, 0.2)' : undefined
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '4px' }}>
                          <span className="model-card-tag" style={{ 
                            fontSize: '0.5rem', 
                            padding: '1px 4px', 
                            margin: 0,
                            backgroundColor: isRecommended ? 'var(--primary)' : undefined,
                            color: isRecommended ? 'white' : undefined
                          }}>
                            {model.tag}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textAlign: 'left', width: '100%' }}>{model.name}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--secondary)', lineHeight: '1.2', textAlign: 'left', width: '100%', marginTop: '2px' }}>{model.desc}</div>
                        {isSelected && (
                          <motion.div layoutId="setting-model-indicator" className="lang-option-indicator" style={{ background: 'var(--primary)', height: '2px' }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
          {/* API Keys */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {/* Gemini */}
            <div>
              <div style={labelRowStyle}>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={linkStyle} title="Criar API Key no Google AI Studio">
                  <Sparkles size={12} color="#8b5cf6" /> Gemini
                </a>
                {hasGemini && <span style={badgeStyle}><ShieldCheck size={10} /> OK</span>}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input type={showGemini ? "text" : "password"} placeholder="Key" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} style={inputStyle} />
                  <button type="button" onClick={() => setShowGemini(!showGemini)} style={eyeButtonStyle}>
                    {showGemini ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button className="btn-secondary" style={deleteButtonStyle} onClick={() => handleDelete('gemini')} disabled={!geminiKey}><Trash2 size={14} /></button>
              </div>
            </div>

            {/* OpenAI */}
            <div>
              <div style={labelRowStyle}>
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={linkStyle} title="Criar API Key na OpenAI">
                  <Key size={12} color="#10a37f" /> OpenAI
                </a>
                {hasOpenai && <span style={badgeStyle}><ShieldCheck size={10} /> OK</span>}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input type={showOpenai ? "text" : "password"} placeholder="Key" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} style={inputStyle} />
                  <button type="button" onClick={() => setShowOpenai(!showOpenai)} style={eyeButtonStyle}>
                    {showOpenai ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button className="btn-secondary" style={deleteButtonStyle} onClick={() => handleDelete('openai')} disabled={!openaiKey}><Trash2 size={14} /></button>
              </div>
            </div>

            {/* Anthropic */}
            <div>
              <div style={labelRowStyle}>
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={linkStyle} title="Criar API Key na Anthropic">
                  <Box size={12} color="#d97706" /> Anthropic
                </a>
                {hasAnthropic && <span style={badgeStyle}><ShieldCheck size={10} /> OK</span>}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input type={showAnthropic ? "text" : "password"} placeholder="Key" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} style={inputStyle} />
                  <button type="button" onClick={() => setShowAnthropic(!showAnthropic)} style={eyeButtonStyle}>
                    {showAnthropic ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button className="btn-secondary" style={deleteButtonStyle} onClick={() => handleDelete('anthropic')} disabled={!anthropicKey}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>

          {/* Cost Warning */}
          <div style={{ marginTop: '24px', padding: '14px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '0.8rem', color: '#92400e', display: 'flex', gap: '10px', alignItems: 'flex-start', lineHeight: '1.4' }}>
            <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '0.85rem' }}>Atenção sobre Custos de API:</strong>
              <p style={{ margin: '4px 0 8px 0' }}>
                O uso de chaves de API próprias remove limites de geração do sistema, mas pode gerar cobranças diretamente com os provedores dependendo do seu plano. O <strong>Google Gemini</strong> possui uma excelente camada 100% gratuita.
              </p>
              <div style={{ fontWeight: 600, marginBottom: '2px' }}>Estimativa média de custo por currículo gerado:</div>
              <ul style={{ margin: '0', paddingLeft: '20px' }}>
                <li><strong>Modelos Rápidos</strong> (Gemini Flash, GPT-4o-mini, Haiku): ~$0.002 a $0.005</li>
                <li><strong>Modelos Robustos</strong> (Gemini Pro, GPT-4o, Claude Sonnet): ~$0.02 a $0.08</li>
              </ul>
            </div>
          </div>
        </div>

        {saveError && (
          <div role="alert" style={{ marginTop: '18px', color: '#b91c1c', fontSize: '0.82rem', fontWeight: 700 }}>
            {saveError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '32px' }}>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '10px 20px' }}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={handleSave} style={{ padding: '10px 24px', minWidth: '140px', justifyContent: 'center' }}>
            {isSaved ? <><CheckCircle size={18} /> {t('common.save')}!</> : <><Save size={18} /> {t('common.save')}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 30px 8px 8px', 
  borderRadius: '4px', border: '1px solid #e2e8f0',
  fontFamily: 'monospace', fontSize: '0.8rem',
  backgroundColor: '#f8fafc',
};

const eyeButtonStyle = {
  position: 'absolute', right: '8px', top: '50%', 
  transform: 'translateY(-50%)', background: 'none', 
  border: 'none', cursor: 'pointer', color: '#94a3b8' 
};

const deleteButtonStyle = {
  padding: '8px', color: '#ef4444', borderColor: '#fee2e2', background: 'white',
  borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'
};

const labelRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' };
const labelStyle = { display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' };
const linkStyle = { ...labelStyle, color: 'var(--primary)', textDecoration: 'none', cursor: 'pointer', borderBottom: '1px dashed var(--primary)' };
const badgeStyle = { fontSize: '0.55rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 800 };
