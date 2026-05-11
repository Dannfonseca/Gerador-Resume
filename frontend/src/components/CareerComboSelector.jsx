import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, Building2, Megaphone, Wrench, HeartPulse, 
  Scale, DollarSign, GraduationCap, X, Sparkles, Info 
} from 'lucide-react';

// Map icon string names to Lucide components
const ICON_MAP = {
  Code,
  Building2,
  Megaphone,
  Wrench,
  HeartPulse,
  Scale,
  DollarSign,
  GraduationCap,
};

/**
 * CareerComboSelector — Pre-selection of industry context for ATS optimization.
 * Biases all AI analysis, keyword suggestions, and generation toward the selected sector.
 */
export default function CareerComboSelector({ value, onChange }) {
  const [combos, setCombos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCombo, setExpandedCombo] = useState(null);

  // Fetch combos from backend on mount
  useEffect(() => {
    fetch('/api/career-combos')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCombos(data.combos);
        }
      })
      .catch(() => {
        // Fallback: use hardcoded combo list if API fails
        setCombos(FALLBACK_COMBOS);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelect = (comboId) => {
    // Toggle: if already selected, deselect
    onChange(value === comboId ? null : comboId);
    setExpandedCombo(null);
  };

  const selectedCombo = combos.find(c => c.id === value);

  if (isLoading) {
    return (
      <div className="combo-selector-loading">
        <div className="combo-selector-shimmer" />
      </div>
    );
  }

  return (
    <div className="combo-selector">
      <div className="combo-selector-header">
        <div className="combo-selector-title">
          <Sparkles size={18} className="combo-title-icon" />
          <h3>Setor da Vaga</h3>
          <span className="combo-optional-badge">opcional</span>
        </div>
        <p className="combo-selector-desc">
          Selecione o setor para otimizar as keywords e o tom do currículo para sua área de atuação.
        </p>
      </div>

      <div className="combo-grid">
        {combos.map((combo) => {
          const IconComponent = ICON_MAP[combo.icon] || Code;
          const isSelected = value === combo.id;
          const isExpanded = expandedCombo === combo.id;

          return (
            <motion.button
              key={combo.id}
              type="button"
              className={`combo-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelect(combo.id)}
              onMouseEnter={() => setExpandedCombo(combo.id)}
              onMouseLeave={() => setExpandedCombo(null)}
              style={{
                '--combo-color': combo.color,
                borderColor: isSelected ? combo.color : undefined,
              }}
              whileTap={{ scale: 0.97 }}
              layout
            >
              <div className="combo-card-icon" style={{ color: isSelected ? combo.color : undefined }}>
                <IconComponent size={20} />
              </div>
              <div className="combo-card-info">
                <span className="combo-card-label">{combo.label}</span>
                <span className="combo-card-desc">{combo.description}</span>
              </div>
              {isSelected && (
                <motion.div 
                  className="combo-card-check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ backgroundColor: combo.color }}
                >
                  ✓
                </motion.div>
              )}

              {/* Tooltip with sample keywords */}
              <AnimatePresence>
                {isExpanded && !isSelected && combo.sampleKeywords && (
                  <motion.div
                    className="combo-tooltip"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span className="combo-tooltip-title">Keywords prioritárias:</span>
                    <div className="combo-tooltip-keywords">
                      {combo.sampleKeywords.map((kw, i) => (
                        <span key={i} className="combo-tooltip-kw">{kw}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Active combo info banner */}
      <AnimatePresence>
        {selectedCombo && (
          <motion.div
            className="combo-active-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ borderLeftColor: selectedCombo.color }}
          >
            <div className="combo-banner-content">
              <Info size={16} style={{ color: selectedCombo.color, flexShrink: 0 }} />
              <div>
                <strong style={{ color: selectedCombo.color }}>{selectedCombo.label}</strong>
                <span> — A IA vai priorizar keywords como </span>
                <span className="combo-banner-keywords">
                  {selectedCombo.sampleKeywords?.join(', ')}
                </span>
                <span> e ferramentas como </span>
                <span className="combo-banner-keywords">
                  {selectedCombo.sampleTools?.join(', ')}
                </span>
              </div>
            </div>
            <button 
              className="combo-banner-clear"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              title="Remover seleção"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Fallback data in case API is unreachable
const FALLBACK_COMBOS = [
  { id: 'tech', label: 'Tecnologia & T.I.', icon: 'Code', color: '#2563eb', description: 'Desenvolvimento, infraestrutura, dados e DevOps', sampleKeywords: ['JavaScript', 'React', 'AWS', 'Docker', 'CI/CD', 'Microservices'], sampleTools: ['GitHub', 'AWS', 'Docker', 'Kubernetes'] },
  { id: 'architecture', label: 'Arquitetura & Urbanismo', icon: 'Building2', color: '#78716c', description: 'Projeto arquitetônico, BIM, sustentabilidade e gestão de obras', sampleKeywords: ['BIM', 'Revit', 'AutoCAD', 'LEED', 'Construction Documentation', 'Schematic Design'], sampleTools: ['Autodesk Revit', 'AutoCAD', 'SketchUp Pro', 'Rhino 3D'] },
  { id: 'marketing', label: 'Marketing & Comunicação', icon: 'Megaphone', color: '#ec4899', description: 'Marketing digital, SEO/SEM, branding e growth', sampleKeywords: ['SEO', 'SEM', 'PPC', 'Google Analytics', 'CRO', 'A/B Testing'], sampleTools: ['Google Ads', 'HubSpot', 'SEMRush', 'Meta Ads'] },
  { id: 'engineering', label: 'Engenharia', icon: 'Wrench', color: '#f59e0b', description: 'Civil, mecânica, elétrica, produção e correlatas', sampleKeywords: ['AutoCAD', 'Lean Manufacturing', 'Six Sigma', 'ISO 9001', 'MS Project', 'ABNT'], sampleTools: ['AutoCAD', 'SolidWorks', 'SAP2000', 'Primavera P6'] },
  { id: 'healthcare', label: 'Saúde', icon: 'HeartPulse', color: '#ef4444', description: 'Medicina, enfermagem, farmácia, biomedicina e odontologia', sampleKeywords: ['BLS', 'ACLS', 'EMR', 'Prontuário Eletrônico', 'Avaliação de Pacientes', 'Controle de Infecção'], sampleTools: ['Tasy', 'MV Soul', 'PACS', 'SAP Healthcare'] },
  { id: 'legal', label: 'Direito & Compliance', icon: 'Scale', color: '#6366f1', description: 'Advocacia, compliance, LGPD, contratos e regulatório', sampleKeywords: ['Due Diligence', 'Compliance', 'LGPD', 'M&A', 'Contratos', 'Governança Corporativa'], sampleTools: ['Thomson Reuters', 'Projuris', 'eSAJ', 'PJe'] },
  { id: 'finance', label: 'Finanças & Contabilidade', icon: 'DollarSign', color: '#059669', description: 'Controladoria, auditoria, FP&A, mercado financeiro', sampleKeywords: ['FP&A', 'IFRS', 'Auditoria', 'Controladoria', 'DRE', 'Modelagem Financeira'], sampleTools: ['SAP FI/CO', 'Bloomberg', 'Power BI', 'Excel VBA'] },
  { id: 'education', label: 'Educação & Docência', icon: 'GraduationCap', color: '#8b5cf6', description: 'Ensino, pedagogia, EAD, coordenação acadêmica', sampleKeywords: ['Planejamento Curricular', 'Metodologias Ativas', 'BNCC', 'EAD', 'Design Instrucional', 'Avaliação Formativa'], sampleTools: ['Moodle', 'Google Classroom', 'Canvas', 'Blackboard'] },
];
