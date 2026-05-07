import React from 'react';

export default function AtsBasicTheme({ data }) {
  const isPt = data.language === 'pt-BR' || data.language === 'pt';
  
  const t = {
    personal: isPt ? 'Informações Pessoais' : 'Personal Information',
    address: isPt ? 'Endereço:' : 'Address:',
    phone: isPt ? 'Telefone:' : 'Phone number:',
    email: isPt ? 'E-mail:' : 'Email address:',
    summary: isPt ? 'Resumo Profissional' : 'Resume Summary',
    education: isPt ? 'Formação Acadêmica' : 'Education',
    experience: isPt ? 'Experiência Profissional' : 'Work Experience',
    skills: isPt ? 'Habilidades' : 'Skills'
  };

  return (
    <>
      <h1>{data.name}</h1>
      <div className="section-title">{t.personal}</div>
      <div className="contact-container">
        <div className="contact-info"><strong>{t.address}</strong> {data.address}</div>
        <div className="contact-info"><strong>{t.phone}</strong> {data.phone}</div>
        <div className="contact-info"><strong>{t.email}</strong> {data.email}</div>
      </div>

      <div className="section-title">{t.summary}</div>
      <p style={{ marginTop: '15px', marginBottom: '25px' }}>{data.summary}</p>

      <div className="section-title">{t.education}</div>
      <div style={{ marginTop: '15px', marginBottom: '25px' }}>
        {data.education.map((edu, idx) => (
          <div key={idx} className="exp-header" style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: '20px' }}>
            <div className="exp-date-loc" style={{ width: '150px' }}>
              <div className="exp-date">{edu.date}</div>
              <div className="exp-date">{edu.location}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="exp-role">{edu.degree}</div>
              <div className="exp-company">{edu.institution}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">{t.experience}</div>
      <div style={{ marginTop: '15px', marginBottom: '25px' }}>
        {data.experience.map((exp, idx) => (
          <div key={idx} className="exp-header" style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: '20px' }}>
            <div className="exp-date-loc" style={{ width: '150px' }}>
              <div className="exp-date">{exp.date}</div>
              <div className="exp-date">{exp.location}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="exp-role">{exp.role}</div>
              <div className="exp-company">{exp.company}</div>
              <ul style={{ marginTop: '5px', listStyleType: 'none', paddingLeft: 0 }}>
                {exp.responsibilities.map((r, i) => (
                  <li key={i} style={{ marginBottom: '3px' }}>• {r}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">{t.skills}</div>
      <div className="skills-grid">
        {data.skillsGroup.map((group, idx) => (
          <div key={idx}>
            <div className="skill-category">- {group.category}</div>
            {group.items.map((item, i) => {
              const parts = item.split(' (');
              if(parts.length > 1) {
                return (
                  <div key={i} className="skill-item">
                    <span style={{ display: 'inline-block', width: '100px' }}>{parts[0]}</span> 
                    <strong>{parts[1].replace(')', '')}</strong>
                  </div>
                );
              }
              return <div key={i} className="skill-item">{item}</div>;
            })}
          </div>
        ))}
      </div>
    </>
  );
}
