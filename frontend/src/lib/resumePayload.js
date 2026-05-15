export const RESUME_LAYOUTS = {
  professional: {
    label: 'Profissional',
    className: 'professional-theme',
  },
  heritage: {
    label: 'Heritage',
    className: 'heritage-theme',
  },
};

export function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

export function normalizeGeneratedResumes(payload) {
  if (!payload) {
    return {
      professional: null,
      heritage: null,
    };
  }

  const hasSeparatedPayload = payload.professional || payload.traditional || payload.heritage;

  if (!hasSeparatedPayload) {
    return {
      professional: payload,
      heritage: payload,
    };
  }

  const professional = payload.professional ?? payload.traditional ?? payload.heritage ?? null;
  const heritage = payload.heritage ?? professional;

  return {
    professional,
    heritage,
  };
}

export function setValueAtPath(source, path, value) {
  const keys = path.split('.');
  const clone = structuredClone(source);
  let current = clone;

  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (current[key] === undefined || current[key] === null) {
      const nextKey = keys[i + 1];
      current[key] = Number.isInteger(Number(nextKey)) ? [] : {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return clone;
}

export function resumeToPlainText(resume) {
  if (!resume) return '';

  const lines = [
    resume.name,
    resume.title,
    [resume.email, resume.phone, resume.address].filter(Boolean).join(' | '),
    '',
    resume.summary,
  ].filter((line) => line !== undefined && line !== null);

  if (hasItems(resume.experience)) {
    lines.push('', 'Experience');
    for (const item of resume.experience) {
      lines.push([item.role, item.company, item.date].filter(Boolean).join(' - '));
      for (const bullet of item.responsibilities || []) {
        lines.push(`- ${bullet}`);
      }
    }
  }

  if (hasItems(resume.projects)) {
    lines.push('', 'Projects');
    for (const project of resume.projects) {
      lines.push([project.name, project.technologies].filter(Boolean).join(' - '));
      if (project.description) lines.push(project.description);
    }
  }

  if (hasItems(resume.education)) {
    lines.push('', 'Education');
    for (const item of resume.education) {
      lines.push([item.degree, item.institution, item.date].filter(Boolean).join(' - '));
    }
  }

  if (hasItems(resume.skillsGroup)) {
    lines.push('', 'Skills');
    for (const group of resume.skillsGroup) {
      lines.push(`${group.category}: ${(group.items || []).join(', ')}`);
    }
  }

  return lines.filter(Boolean).join('\n');
}
