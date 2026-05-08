import { hasItems } from '../../lib/resumePayload';

export default function ProfessionalTheme({ data }) {
  const isPt = data?.language === 'pt-BR' || data?.language === 'pt';

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
      <h1>{data?.name}</h1>

      <div className="section-title">{t.personal}</div>
      <div className="contact-container">
        {data?.address && (
          <div className="contact-info">
            <strong>{t.address}</strong> {data.address}
          </div>
        )}
        {data?.phone && (
          <div className="contact-info">
            <strong>{t.phone}</strong> {data.phone}
          </div>
        )}
        {data?.email && (
          <div className="contact-info">
            <strong>{t.email}</strong> {data.email}
          </div>
        )}
      </div>

      {data?.summary && (
        <>
          <div className="section-title">{t.summary}</div>
          <p className="professional-summary">{data.summary}</p>
        </>
      )}

      {hasItems(education) && (
        <>
          <div className="section-title">{t.education}</div>
          <div className="professional-section-content">
            {education.map((edu, idx) => (
              <div key={`${edu.degree}-${idx}`} className="professional-row">
                <div className="exp-date-loc">
                  <div className="exp-date">{edu.date}</div>
                  <div className="exp-date">{edu.location}</div>
                </div>
                <div className="professional-row-main">
                  <div className="exp-role">{edu.degree}</div>
                  <div className="exp-company">{edu.institution}</div>
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
                  <div className="exp-date">{exp.date}</div>
                  <div className="exp-date">{exp.location}</div>
                </div>
                <div className="professional-row-main">
                  <div className="exp-role">{exp.role}</div>
                  <div className="exp-company">{exp.company}</div>
                  {hasItems(exp.responsibilities) && (
                    <ul className="professional-responsibilities">
                      {exp.responsibilities.map((item, itemIdx) => (
                        <li key={`${item}-${itemIdx}`}>
                          <span className="professional-bullet">•</span>
                          {item}
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
