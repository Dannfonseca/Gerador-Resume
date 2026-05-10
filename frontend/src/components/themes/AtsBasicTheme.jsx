import { hasItems } from '../../lib/resumePayload';
import ReactMarkdown from 'react-markdown';
import React from 'react';

export default function ProfessionalTheme({ data, onEdit }) {
  const isPt = data?.language === 'pt-BR' || data?.language === 'pt';

  const E = ({ path, value, as: Tag = 'span', className = '', markdown = false }) => {
    if (!value) return null;
    const content = markdown ? (
      <ReactMarkdown components={{ p: Tag === 'span' ? 'span' : React.Fragment }}>{value}</ReactMarkdown>
    ) : value;

    if (!onEdit) {
      return Tag === 'span' && !className ? <>{content}</> : <Tag className={className}>{content}</Tag>;
    }

    return (
      <Tag 
        className={`${className} editable-field`} 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(path, value); }}
        title="Clique para editar"
      >
        {content}
      </Tag>
    );
  };

  const t = {
    personal: isPt ? 'Informações Pessoais' : 'Personal Information',
    address: isPt ? 'Endereço:' : 'Address:',
    phone: isPt ? 'Telefone:' : 'Phone number:',
    email: isPt ? 'E-mail:' : 'Email address:',
    summary: isPt ? 'Resumo Profissional' : 'Resume Summary',
    education: isPt ? 'Formação Acadêmica' : 'Education',
    experience: isPt ? 'Experiência Profissional' : 'Work Experience',
    skills: isPt ? 'Habilidades' : 'Skills',
    skillsFallback: isPt ? 'Competências' : 'Skills',
  };

  const experience = Array.isArray(data?.experience) ? data.experience : [];
  const education = Array.isArray(data?.education) ? data.education : [];
  const skillsGroup = Array.isArray(data?.skillsGroup)
    ? data.skillsGroup
    : Array.isArray(data?.skills)
      ? [{ category: t.skillsFallback, items: data.skills }]
      : [];

  return (
    <>
      <E as="h1" path="name" value={data?.name} />

      <div className="section-title">{t.personal}</div>
      <div className="contact-container">
        {data?.address && (
          <div className="contact-info">
            <strong>{t.address}</strong> <E path="address" value={data.address} />
          </div>
        )}
        {data?.phone && (
          <div className="contact-info">
            <strong>{t.phone}</strong> <E path="phone" value={data.phone} />
          </div>
        )}
        {data?.email && (
          <div className="contact-info">
            <strong>{t.email}</strong> <E path="email" value={data.email} />
          </div>
        )}
      </div>

      {data?.summary && (
        <>
          <div className="section-title">{t.summary}</div>
          <E as="div" className="professional-summary" path="summary" value={data.summary} markdown />
        </>
      )}

      {hasItems(education) && (
        <>
          <div className="section-title">{t.education}</div>
          <div className="professional-section-content">
            {education.map((edu, idx) => (
              <div key={`${edu.degree}-${idx}`} className="professional-row">
                <div className="exp-date-loc">
                  <E as="div" className="exp-date" path={`education.${idx}.date`} value={edu.date} />
                  <E as="div" className="exp-date" path={`education.${idx}.location`} value={edu.location} />
                </div>
                <div className="professional-row-main">
                  <E as="div" className="exp-role" path={`education.${idx}.degree`} value={edu.degree} />
                  <E as="div" className="exp-company" path={`education.${idx}.institution`} value={edu.institution} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {hasItems(experience) && (
        <>
          <div className="section-title">{t.experience}</div>
          <div className="professional-section-content">
            {experience.map((exp, idx) => (
              <div key={`${exp.role}-${idx}`} className="professional-row">
                <div className="exp-date-loc">
                  <E as="div" className="exp-date" path={`experience.${idx}.date`} value={exp.date} />
                  <E as="div" className="exp-date" path={`experience.${idx}.location`} value={exp.location} />
                </div>
                <div className="professional-row-main">
                  <E as="div" className="exp-role" path={`experience.${idx}.role`} value={exp.role} />
                  <E as="div" className="exp-company" path={`experience.${idx}.company`} value={exp.company} />
                  {hasItems(exp.responsibilities) && (
                    <ul className="professional-responsibilities">
                      {exp.responsibilities.map((item, itemIdx) => (
                        <li key={`${item}-${itemIdx}`}>
                          <span className="professional-bullet">•</span>
                          <E as="span" path={`experience.${idx}.responsibilities.${itemIdx}`} value={item} markdown />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {hasItems(skillsGroup) && (
        <>
          <div className="section-title">{t.skills}</div>
          <div className="skills-grid">
            {skillsGroup.map((group, idx) => (
              <div key={`${group.category}-${idx}`}>
                <div className="skill-category">- {group.category}</div>
                {group.items?.map((item, itemIdx) => {
                  const parts = item.split(' (');
                  if (parts.length > 1) {
                    return (
                      <div key={`${item}-${itemIdx}`} className="skill-item">
                        <span className="skill-name">{parts[0]}</span>
                        <strong>{parts[1].replace(')', '')}</strong>
                      </div>
                    );
                  }

                  return (
                    <div key={`${item}-${itemIdx}`} className="skill-item">
                      {item}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
