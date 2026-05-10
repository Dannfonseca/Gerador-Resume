import { useState, useEffect } from 'react';
import { X, Key, Save, Trash2, Eye, EyeOff, CheckCircle, Sparkles, Settings, ShieldCheck } from 'lucide-react';
import { getApiKey, saveApiKey, clearApiKey } from '../lib/apiKey';

export default function SettingsModal({ onClose }) {
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasGemini, setHasGemini] = useState(false);
  const [hasOpenai, setHasOpenai] = useState(false);

  useEffect(() => {
    const savedGemini = getApiKey('gemini');
    const savedOpenai = getApiKey('openai');
    if (savedGemini) {
      setGeminiKey(savedGemini);
      setHasGemini(true);
    }
    if (savedOpenai) {
      setOpenaiKey(savedOpenai);
      setHasOpenai(true);
    }
  }, []);

  const handleSave = () => {
    saveApiKey('gemini', geminiKey);
    saveApiKey('openai', openaiKey);
    setHasGemini(!!geminiKey);
    setHasOpenai(!!openaiKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDelete = (service) => {
    if (confirm(`Tem certeza que deseja excluir sua chave ${service === 'gemini' ? 'Gemini' : 'OpenAI'}?`)) {
      clearApiKey(service);
      if (service === 'gemini') {
        setGeminiKey('');
        setHasGemini(false);
      }
      if (service === 'openai') {
        setOpenaiKey('');
        setHasOpenai(false);
      }
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
        width: '500px', maxWidth: '90%', background: 'white', 
        padding: '32px', borderRadius: '12px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        border: '1px solid var(--primary)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem' }}>
            <Settings size={24} color="var(--primary)" /> Configurações de IA
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <p style={{ fontSize: '0.95rem', color: 'var(--secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
          Suas chaves são armazenadas de forma <strong>encriptada</strong> localmente. 
          O sistema tentará usar o Gemini primeiro e mudará para o OpenAI se necessário.
        </p>

        {/* Gemini Key */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Sparkles size={14} color="#8b5cf6" /> Google Gemini Key
            </label>
            {hasGemini && (
              <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                <ShieldCheck size={12} /> CONFIGURADO
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input 
                type={showGemini ? "text" : "password"} 
                placeholder={hasGemini ? "••••••••••••••••••••••••" : "Cole sua chave aqui..."}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowGemini(!showGemini)} style={eyeButtonStyle}>
                {showGemini ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button className="btn-secondary" style={deleteButtonStyle} onClick={() => handleDelete('gemini')} disabled={!geminiKey} title="Excluir chave">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* OpenAI Key */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Key size={14} color="#10a37f" /> OpenAI API Key (Fallback)
            </label>
            {hasOpenai && (
              <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                <ShieldCheck size={12} /> CONFIGURADO
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input 
                type={showOpenai ? "text" : "password"} 
                placeholder={hasOpenai ? "••••••••••••••••••••••••" : "Cole sua chave aqui..."}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowOpenai(!showOpenai)} style={eyeButtonStyle}>
                {showOpenai ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button className="btn-secondary" style={deleteButtonStyle} onClick={() => handleDelete('openai')} disabled={!openaiKey} title="Excluir chave">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '12px 24px' }}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} style={{ padding: '12px 32px', minWidth: '160px', justifyContent: 'center' }}>
            {isSaved ? <><CheckCircle size={18} /> Salvo!</> : <><Save size={18} /> Salvar Chaves</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '14px 44px 14px 14px', 
  borderRadius: '4px', border: '2px solid #e2e8f0',
  fontFamily: 'monospace', fontSize: '1rem',
  backgroundColor: '#f8fafc',
  transition: 'border-color 0.2s'
};

const eyeButtonStyle = {
  position: 'absolute', right: '14px', top: '50%', 
  transform: 'translateY(-50%)', background: 'none', 
  border: 'none', cursor: 'pointer', color: '#94a3b8' 
};

const deleteButtonStyle = {
  padding: '12px', color: '#ef4444', borderColor: '#fee2e2', background: 'white',
  borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'
};
