export const JOB_PIPELINE_STORAGE_KEY = 'ats_job_pipeline';

const interruptedMessage = 'Geracao interrompida por recarregamento da pagina. Abra a vaga e tente novamente.';

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createNow() {
  return new Date().toISOString();
}

export function createJob(job, options = {}) {
  const id = options.id || createId();
  const now = options.now || createNow();

  return {
    id,
    dateAdded: now,
    status: 'A Avaliar',
    url: '',
    jdRaw: '',
    analysisData: null,
    keywordSelection: [],
    isProcessing: false,
    processingError: null,
    resumes: [],
    ...job,
  };
}

export function addJobToList(jobs, job) {
  return [
    job,
    ...jobs,
  ];
}

export function updateJobInList(jobs, id, updates) {
  return jobs.map((job) => (job.id === id ? { ...job, ...updates } : job));
}

export function deleteJobFromList(jobs, id) {
  return jobs.filter((job) => job.id !== id);
}

export function addResumeToJobList(jobs, jobId, resume, options = {}) {
  const id = options.id || createId();
  const now = options.now || createNow();

  return jobs.map((job) => {
    if (job.id !== jobId) return job;
    return {
      ...job,
      resumes: [
        {
          id,
          dateCreated: now,
          selectedLayout: 'professional',
          coverLetter: null,
          ...resume,
        },
        ...(job.resumes || []),
      ],
    };
  });
}

export function updateResumeInJobList(jobs, jobId, resumeId, updates) {
  return jobs.map((job) => {
    if (job.id !== jobId) return job;
    return {
      ...job,
      resumes: (job.resumes || []).map((resume) => (
        resume.id === resumeId ? { ...resume, ...updates } : resume
      )),
    };
  });
}

export function deleteResumeFromJobList(jobs, jobId, resumeId) {
  return jobs.map((job) => {
    if (job.id !== jobId) return job;
    return {
      ...job,
      resumes: (job.resumes || []).filter((resume) => resume.id !== resumeId),
    };
  });
}

export function resetStaleProcessingJobs(jobs) {
  return jobs.map((job) => {
    if (!job.isProcessing) return job;
    return {
      ...job,
      isProcessing: false,
      processingError: job.processingError || interruptedMessage,
    };
  });
}
