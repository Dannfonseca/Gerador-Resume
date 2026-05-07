import React from 'react';

export default function StandardTheme({ data }) {
  return (
    <>
      <h1>{data.name}</h1>
      <div className="resume-title">{data.title}</div>
      <div className="contact-info">
        {data.email} • {data.phone}<br />
        {data.address}
      </div>
      
      <p>{data.summary}</p>

      <h2 className="section-title">Experiência Profissional</h2>
      {data.experience.map((exp, idx) => (
        <div className="exp-item" key={idx}>
          <div className="exp-header">
            <span className="exp-role">{exp.role}</span>
            <span className="exp-date">{exp.date}</span>
          </div>
          <div className="exp-company">{exp.company}</div>
          <ul>
            {exp.responsibilities.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      ))}

      <h2 className="section-title">Formação</h2>
      {data.education.map((edu, idx) => (
        <div className="edu-item" key={idx}>
          <div className="exp-role">{edu.degree}</div>
          <div className="exp-company">{edu.institution}</div>
        </div>
      ))}

      {data.skills && (
        <>
          <h2 className="section-title">Proficiências técnicas</h2>
          <ul>
            {data.skills.map((skill, idx) => (
              <li key={idx}>{skill}</li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
