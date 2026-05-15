import { Link as LinkIcon, Mail, MapPin, Phone } from 'lucide-react';
import { hasItems } from '../../lib/resumePayload';

function EditableText({ onEdit, path, value, as: Tag = 'span', className = '' }) {
  if (!value) return null;

  if (!onEdit) {
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <Tag
      className={`${className} editable-field`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onEdit(path, value);
      }}
      title="Clique para editar"
    >
      {value}
    </Tag>
  );
}

export default function HeritageTheme({ data, onEdit }) {
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
        <EditableText onEdit={onEdit} as="h1" path="name" value={data?.name} />
        <div className="db-contact">
          {data?.email && (
            <span className="db-contact-item">
              <Mail size={14} /> <EditableText onEdit={onEdit} path="email" value={data.email} />
            </span>
          )}
          {data?.phone && (
            <span className="db-contact-item">
              <Phone size={14} /> <EditableText onEdit={onEdit} path="phone" value={data.phone} />
            </span>
          )}
          {data?.address && (
            <span className="db-contact-item">
              <MapPin size={14} /> <EditableText onEdit={onEdit} path="address" value={data.address} />
            </span>
          )}
        </div>

        {hasItems(links) && (
          <div className="db-contact db-links">
            {links.map((link, idx) => (
              <span key={`${link.url}-${idx}`} className="db-contact-item">
                <LinkIcon size={14} />{' '}
                <EditableText
                  onEdit={onEdit}
                  path={link.label ? `links.${idx}.label` : `links.${idx}.url`}
                  value={link.label || link.url}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {summary && (
        <>
          <div className="db-section-title">{t.summary}</div>
          <EditableText onEdit={onEdit} as="div" className="db-summary" path="summary" value={summary} />
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
                  <EditableText onEdit={onEdit} as="span" className="db-company" path={`experience.${idx}.company`} value={exp.company} />
                  <EditableText onEdit={onEdit} as="span" className="db-location" path={`experience.${idx}.location`} value={exp.location} />
                </div>
                <div className="db-exp-subheader">
                  <EditableText onEdit={onEdit} as="span" className="db-role" path={`experience.${idx}.role`} value={exp.role} />
                  <EditableText onEdit={onEdit} as="span" className="db-date" path={`experience.${idx}.date`} value={exp.date} />
                </div>
                {hasItems(exp.responsibilities) && (
                  <ul className="db-responsibilities">
                    {exp.responsibilities.map((item, itemIdx) => (
                      <li key={`${item}-${itemIdx}`}>
                        <EditableText onEdit={onEdit} path={`experience.${idx}.responsibilities.${itemIdx}`} value={item} />
                      </li>
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
                  <EditableText onEdit={onEdit} as="span" className="db-proj-name" path={`projects.${idx}.name`} value={project.name} />
                  <EditableText onEdit={onEdit} as="span" className="db-proj-tech" path={`projects.${idx}.technologies`} value={project.technologies} />
                </div>
                <EditableText onEdit={onEdit} as="div" className="db-proj-desc" path={`projects.${idx}.description`} value={project.description} />
                {project.url && (
                  <div className="db-proj-link">
                    <LinkIcon size={12} /> <EditableText onEdit={onEdit} path={`projects.${idx}.url`} value={project.url} />
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
                  <EditableText onEdit={onEdit} as="span" className="db-company" path={`education.${idx}.institution`} value={edu.institution} />
                  <EditableText onEdit={onEdit} as="span" className="db-location" path={`education.${idx}.location`} value={edu.location} />
                </div>
                <div className="db-exp-subheader">
                  <EditableText onEdit={onEdit} as="span" className="db-role" path={`education.${idx}.degree`} value={edu.degree} />
                  <EditableText onEdit={onEdit} as="span" className="db-date" path={`education.${idx}.date`} value={edu.date} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
