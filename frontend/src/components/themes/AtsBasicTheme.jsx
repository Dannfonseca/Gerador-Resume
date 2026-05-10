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
    <div className="professional-theme-container">
      <E as="h1" path="name" value={data?.name} className="resume-name-header" />

      <div className="contact-line">
        {data?.email && <span><E path="email" value={data.email} /></span>}
        {data?.phone && <span> | <E path="phone" value={data.phone} /></span>}
        {data?.address && <span> | <E path="address" value={data.address} /></span>}
      </div>

      {data?.summary && (
        <div className="section-compact">
          <div className="section-title-compact">{t.summary}</div>
          <E as="div" className="summary-text" path="summary" value={data.summary} markdown />
        </div>
      )}

      {hasItems(experience) && (
        <div className="section-compact">
          <div className="section-title-compact">{t.experience}</div>
          {experience.map((exp, idx) => (
            <div key={`${exp.role}-${idx}`} className="experience-item-compact">
              <div className="item-header-compact">
                <E as="strong" className="role-title" path={`experience.${idx}.role`} value={exp.role} />
                <E as="span" className="item-date" path={`experience.${idx}.date`} value={exp.date} />
              </div>
              <div className="item-subheader-compact">
                <E as="span" className="company-name" path={`experience.${idx}.company`} value={exp.company} />
                <E as="span" className="item-location" path={`experience.${idx}.location`} value={exp.location} />
              </div>
              {hasItems(exp.responsibilities) && (
                <ul className="bullet-list-compact">
                  {exp.responsibilities.map((item, itemIdx) => (
                    <li key={`${item}-${itemIdx}`}>
                      <E as="span" path={`experience.${idx}.responsibilities.${itemIdx}`} value={item} markdown />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {hasItems(education) && (
        <div className="section-compact">
          <div className="section-title-compact">{t.education}</div>
          {education.map((edu, idx) => (
            <div key={`${edu.degree}-${idx}`} className="experience-item-compact">
              <div className="item-header-compact">
                <E as="strong" className="role-title" path={`education.${idx}.degree`} value={edu.degree} />
                <E as="span" className="item-date" path={`education.${idx}.date`} value={edu.date} />
              </div>
              <div className="item-subheader-compact">
                <E as="span" className="company-name" path={`education.${idx}.institution`} value={edu.institution} />
                <E as="span" className="item-location" path={`education.${idx}.location`} value={edu.location} />
              </div>
            </div>
          ))}
        </div>
      )}

      {hasItems(skillsGroup) && (
        <div className="section-compact">
          <div className="section-title-compact">{t.skills}</div>
          <div className="skills-container-compact">
            {skillsGroup.map((group, idx) => (
              <div key={`${group.category}-${idx}`} className="skill-group-compact">
                <strong>{group.category}: </strong>
                <span>{group.items?.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
