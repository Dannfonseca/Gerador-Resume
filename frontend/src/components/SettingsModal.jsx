import { useState, useEffect } from 'react';
import { X, Key, Save, Trash2, Eye, EyeOff, CheckCircle, Sparkles, Settings, ShieldCheck, BrainCircuit, Box } from 'lucide-react';
import { getApiKey, saveApiKey, clearApiKey, saveAiModel, getAiModel } from '../lib/apiKey';
import { useLanguage } from '../i18n/LanguageContext';
import { motion } from 'framer-motion';

const PROVIDERS = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    models: [
      { id: 'gemini-1.5-flash-8b', key: 'flash8b' },
      { id: 'gemini-1.5-flash',    key: 'flash15' },
      { id: 'gemini-2.0-flash',    key: 'flash2' },
      { id: 'gemini-1.5-pro',      key: 'pro15' },
      { id: 'gemini-1.5-pro-002',  key: 'pro15v2' },
      { id: 'gemini-2.0-pro-exp',  key: 'pro2' }
    ]
  },
  {
    id: 'openai',
    label: 'OpenAI',
    models: [
      { id: 'gpt-3.5-turbo',    key: 'gpt35' },
      { id: 'gpt-4o-mini',      key: 'gpt4om' },
      { id: 'gpt-4-turbo',      key: 'gpt4t' },
      { id: 'gpt-4o',           key: 'gpt4o' },
      { id: 'o1-mini',          key: 'o1m' },
      { id: 'o1-preview',       key: 'o1p' }
    ]
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    models: [
      { id: 'claude-3-haiku-20240307',    key: 'haiku3' },
      { id: 'claude-3-5-haiku-20241022',  key: 'haiku35' },
      { id: 'claude-3-sonnet-20240229',   key: 'sonnet3' },
      { id: 'claude-3-5-sonnet-20241022', key: 'sonnet35' },
      { id: 'claude-3-opus-20240229',     key: 'opus3' },
      { id: 'claude-2.1',                 key: 'claude21' }
    ]
  }
];

export default function SettingsModal({ onClose }) {
  const { t } = useLanguage();
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-pro');
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const [hasGemini, setHasGemini] = useState(false);
  const [hasOpenai, setHasOpenai] = useState(false);
  const [hasAnthropic, setHasAnthropic] = useState(false);

  useEffect(() => {
    const savedGemini = getApiKey('gemini');
    const savedOpenai = getApiKey('openai');
    const savedAnthropic = getApiKey('anthropic');
    const savedModel = getAiModel();

    if (savedGemini) { setGeminiKey(savedGemini); setHasGemini(true); }
    if (savedOpenai) { setOpenaiKey(savedOpenai); setHasOpenai(true); }
    if (savedAnthropic) { setAnthropicKey(savedAnthropic); setHasAnthropic(true); }
    setSelectedModel(savedModel);
  }, []);

  const handleSave = () => {
    saveApiKey('gemini', geminiKey);
    saveApiKey('openai', openaiKey);
    saveApiKey('anthropic', anthropicKey);
    saveAiModel(selectedModel);

    setHasGemini(!!geminiKey);
    setHasOpenai(!!openaiKey);
    setHasAnthropic(!!anthropicKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
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
                    const modelT = t(`models.${provider.id}.${model.key}`);
                    const isRecommended = modelT.tag.includes('RECOMENDADO') || modelT.tag.includes('RECOMMENDED');
                    
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
                            {modelT.tag}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textAlign: 'left', width: '100%' }}>{modelT.name}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--secondary)', lineHeight: '1.2', textAlign: 'left', width: '100%', marginTop: '2px' }}>{modelT.desc}</div>
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
                <label style={labelStyle}><Sparkles size={12} color="#8b5cf6" /> Gemini</label>
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
                <label style={labelStyle}><Key size={12} color="#10a37f" /> OpenAI</label>
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
                <label style={labelStyle}><Box size={12} color="#d97706" /> Anthropic</label>
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
        </div>

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
const badgeStyle = { fontSize: '0.55rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 800 };
