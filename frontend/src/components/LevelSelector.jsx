import { Shield, Scale, Zap } from 'lucide-react';

const LEVELS = {
  conservative: {
    icon: Shield,
    title: 'Conservador',
    desc: 'Correções precisas de gramática e formatação. Mantém a essência original do seu texto, apenas polindo para profissionalismo.',
    color: '#16a34a',
  },
  balanced: {
    icon: Scale,
    title: 'Equilibrado',
    desc: 'Reescrita estratégica de pontos-chave e sumário. Aumenta o impacto das suas conquistas e alinha habilidades com a vaga.',
    color: '#ca8a04',
  },
  aggressive: {
    icon: Zap,
    title: 'Agressivo',
    desc: 'Transformação total focada em conversão. Reescreve narrativa e tom para vender você como a única escolha possível.',
    color: '#dc2626',
  },
};

/**
 * LevelSelector — Lets the user choose how aggressively the AI rewrites their CV.
 * Inspired by apresentando.me's OptimizationView aggressiveness selector.
 */
export default function LevelSelector({ value, onChange }) {
  return (
    <div className="level-selector">
      <div className="level-selector-header">
        <h3>Nível de Intervenção da IA</h3>
        <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
          Defina o quão agressiva será a reescrita do seu currículo.
        </p>
      </div>
      <div className="level-cards">
        {Object.entries(LEVELS).map(([key, config]) => {
          const isSelected = value === key;
          const Icon = config.icon;
          return (
            <button
              key={key}
              type="button"
              className={`level-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onChange(key)}
              style={{
                '--level-color': config.color,
                borderColor: isSelected ? config.color : undefined,
              }}
            >
              <div className="level-card-icon" style={{ color: isSelected ? config.color : 'var(--secondary)' }}>
                <Icon size={24} />
              </div>
              <div className="level-card-title" style={{ color: isSelected ? config.color : 'var(--primary)' }}>
                {config.title}
              </div>
              <p className="level-card-desc">{config.desc}</p>
              {isSelected && (
                <div className="level-card-badge" style={{ backgroundColor: config.color }}>
                  Selecionado
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
