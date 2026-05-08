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
