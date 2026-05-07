import React from 'react';
import { Download } from 'lucide-react';
import { resumesData } from '../data';
import StandardTheme from './themes/StandardTheme';
import AtsBasicTheme from './themes/AtsBasicTheme';
import '../styles/resume.css';

export default function ResumeView({ activeResume }) {
  const data = resumesData.find((r) => r.id === activeResume);

  if (!data) return null;

  return (
    <section className="view-section active">
      <div className="resume-toolbar glass-panel">
        <div className="resume-info">
          <h3>Visualização de Currículo</h3>
          <p>Modelo otimizado para legibilidade.</p>
        </div>
        <button className="btn-primary" onClick={() => window.print()}>
          <Download size={16} />
          Imprimir / Salvar PDF
        </button>
      </div>
      
      <div className="resume-paper-container">
        <div className={`resume-paper ${data.theme}`}>
          {data.theme === 'ats-basic-theme' ? (
            <AtsBasicTheme data={data} />
          ) : (
            <StandardTheme data={data} />
          )}
        </div>
      </div>
    </section>
  );
}
