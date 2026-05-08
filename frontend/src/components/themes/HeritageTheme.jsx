import { Link as LinkIcon, Mail, MapPin, Phone } from 'lucide-react';
import { hasItems } from '../../lib/resumePayload';

export default function HeritageTheme({ data }) {
  const isPt = data?.language === 'pt-BR' || data?.language === 'pt';

  const t = {
    summary: isPt ? 'Resumo' : 'Summary',
    skills: isPt ? 'Habilidades' : 'Skills',
    experience: isPt ? 'Experiência' : 'Experience',
    projects: isPt ? 'Projetos' : 'Projects',
    education: isPt ? 'Formação' : 'Education',
  };

  const links = Array.isArray(data?.links) ? data.links : [];
  const skillsGroup = Array.isArray(data?.skillsGroup) ? data.skillsGroup : [];
  const experience = Array.isArray(data?.experience) ? data.experience : [];
  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const education = Array.isArray(data?.education) ? data.education : [];
  const summary = data?.summary?.trim();

  return (
    <>
      <div className="db-header">
        <h1>{data?.name}</h1>
        <div className="db-contact">
          {data?.email && (
            <span className="db-contact-item">
              <Mail size={14} /> {data.email}
            </span>
          )}
          {data?.phone && (
            <span className="db-contact-item">
              <Phone size={14} /> {data.phone}
            </span>
          )}
          {data?.address && (
            <span className="db-contact-item">
              <MapPin size={14} /> {data.address}
            </span>
          )}
        </div>

        {hasItems(links) && (
          <div className="db-contact db-links">
            {links.map((link, idx) => (
              <span key={`${link.url}-${idx}`} className="db-contact-item">
                <LinkIcon size={14} /> {link.label || link.url}
              </span>
            ))}
          </div>
        )}
      </div>

      {summary && (
        <>
          <div className="db-section-title">{t.summary}</div>
          <div className="db-summary">{summary}</div>
        </>
      )}

      {hasItems(skillsGroup) && (
        <>
          <div className="db-section-title">{t.skills}</div>
          <div className="db-skills">
            {skillsGroup.map((group, idx) => (
              <div key={`${group.category}-${idx}`} className="db-skill-row">
                <div className="db-skill-category">{group.category}:</div>
                <div className="db-skill-items">{group.items?.join(', ')}.</div>
              </div>
            ))}
          </div>
        </>
      )}

      {hasItems(experience) && (
        <>
          <div className="db-section-title">{t.experience}</div>
          <div className="db-experience-list">
            {experience.map((exp, idx) => (
              <div key={`${exp.role}-${idx}`} className="db-exp-item">
                <div className="db-exp-header">
                  <span className="db-company">{exp.company}</span>
                  <span className="db-location">{exp.location}</span>
                </div>
                <div className="db-exp-subheader">
                  <span className="db-role">{exp.role}</span>
                  <span className="db-date">{exp.date}</span>
                </div>
                {hasItems(exp.responsibilities) && (
                  <ul className="db-responsibilities">
                    {exp.responsibilities.map((item, itemIdx) => (
                      <li key={`${item}-${itemIdx}`}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {hasItems(projects) && (
        <>
          <div className="db-section-title">{t.projects}</div>
          <div className="db-projects-list">
            {projects.map((project, idx) => (
              <div key={`${project.name}-${idx}`} className="db-proj-item">
                <div className="db-proj-header">
                  <span className="db-proj-name">{project.name}</span>
                  <span className="db-proj-tech">{project.technologies}</span>
                </div>
                <div className="db-proj-desc">{project.description}</div>
                {project.url && (
                  <div className="db-proj-link">
                    <LinkIcon size={12} /> {project.url}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {hasItems(education) && (
        <>
          <div className="db-section-title">{t.education}</div>
          <div className="db-education-list">
            {education.map((edu, idx) => (
              <div key={`${edu.degree}-${idx}`} className="db-edu-item">
                <div className="db-exp-header">
                  <span className="db-company">{edu.institution}</span>
                  <span className="db-location">{edu.location}</span>
                </div>
                <div className="db-exp-subheader">
                  <span className="db-role">{edu.degree}</span>
                  <span className="db-date">{edu.date}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
