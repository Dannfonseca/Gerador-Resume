# Local Resume Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the local master-resume and job-pipeline flow using `localStorage`, with modal-close background tailoring while the browser tab remains open.

**Architecture:** Keep the existing wizard intact. Add small frontend helpers for local pipeline state and generated resume editing, add backend AI helper endpoints for master generation and layout artifacts, then refactor `MasterResumeView` and `PipelineView` to use those helpers. Background work remains an in-memory browser request; stale `isProcessing` jobs are reset on reload.

**Tech Stack:** React 19, Vite, ElysiaJS, Bun, Zod, Gemini/OpenAI/Anthropic routing, browser `localStorage`, Node `node:test`.

---

## File Structure

- Modify: `backend/src/index.ts`
  - Add `MASTER_RESUME_SYSTEM_PROMPT`.
  - Add `/api/generate-master`.
  - Adjust `/api/analyze-master` so master-only analysis forces `matchScore`, `matchGrade`, and `matchAnalysis` to null.
  - Adjust `/api/tailor-resume` to return normalized dual-layout resume data plus LaTeX.
- Modify: `frontend/src/lib/resumePayload.js`
  - Add path update helpers and resume text conversion helpers shared by wizard, master, and pipeline modals.
- Modify: `frontend/src/lib/resumePayload.test.mjs`
  - Cover path edits and resume text conversion.
- Add: `frontend/src/lib/jobPipelineStorage.js`
  - Pure functions for job/resume creation, update, deletion, stale processing reset, and resume version updates.
- Add: `frontend/src/lib/jobPipelineStorage.test.mjs`
  - Tests for pipeline pure functions.
- Modify: `frontend/src/lib/useJobPipeline.js`
  - Use pure functions from `jobPipelineStorage.js`.
  - Reset stale processing jobs on hook initialization.
  - Expose `updateResumeForJob`.
- Add: `frontend/src/components/TailoredResumeModal.jsx`
  - Reusable modal for viewing/editing generated resumes in a job.
- Modify: `frontend/src/components/MasterResumeView.jsx`
  - Use `/api/generate-master` instead of `/api/generate`.
  - Send provider keys and selected model to `/api/analyze-master`.
  - Add AI/manual editing through existing editable resume theme behavior.
- Modify: `frontend/src/components/PipelineView.jsx`
  - Remove `window._targetJobId`.
  - Save jobs before keyword confirmation.
  - Keep background tailoring request alive when modal closes.
  - Show loading/error/result states from saved job state.
  - Use `TailoredResumeModal` for result actions.
- Modify: `frontend/src/components/themes/HeritageTheme.jsx`
  - Add `onEdit` support matching `AtsBasicTheme`.

---

### Task 1: Add Pure Resume Payload Helpers

**Files:**
- Modify: `frontend/src/lib/resumePayload.js`
- Modify: `frontend/src/lib/resumePayload.test.mjs`

- [ ] **Step 1: Add failing tests for nested path updates and resume text conversion**

Add these tests to `frontend/src/lib/resumePayload.test.mjs`:

```js
import {
  hasItems,
  normalizeGeneratedResumes,
  resumeToPlainText,
  setValueAtPath,
} from './resumePayload.js';

test('updates a nested resume value by dot path without mutating the original object', () => {
  const source = {
    professional: {
      summary: 'Old summary',
      experience: [
        { responsibilities: ['Old bullet'] }
      ]
    }
  };

  const next = setValueAtPath(source, 'professional.experience.0.responsibilities.0', 'New bullet');

  assert.equal(source.professional.experience[0].responsibilities[0], 'Old bullet');
  assert.equal(next.professional.experience[0].responsibilities[0], 'New bullet');
});

test('creates plain text from a structured resume for cover letters and AI refinement', () => {
  const text = resumeToPlainText({
    name: 'Daniel Fonseca',
    title: 'Full Stack Developer',
    email: 'daniel@example.com',
    phone: '+55 11 99999-9999',
    summary: 'Builds ATS tools.',
    experience: [
      {
        role: 'Developer',
        company: 'ATS Pro',
        responsibilities: ['Built resume parser', 'Improved job matching']
      }
    ],
    skillsGroup: [
      { category: 'Tech', items: ['React', 'Bun'] }
    ]
  });

  assert.match(text, /Daniel Fonseca/);
  assert.match(text, /Full Stack Developer/);
  assert.match(text, /Built resume parser/);
  assert.match(text, /React, Bun/);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
node --test frontend/src/lib/resumePayload.test.mjs
```

Expected: FAIL because `resumeToPlainText` and `setValueAtPath` are not exported.

- [ ] **Step 3: Implement the helpers**

Add these exports to `frontend/src/lib/resumePayload.js`:

```js
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
```

- [ ] **Step 4: Run the test and verify it passes**

Run:

```bash
node --test frontend/src/lib/resumePayload.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

Stage only these files:

```bash
git add frontend/src/lib/resumePayload.js frontend/src/lib/resumePayload.test.mjs
git commit -m "test: cover resume payload editing helpers"
```

---

### Task 2: Add Pipeline Storage Pure Functions

**Files:**
- Add: `frontend/src/lib/jobPipelineStorage.js`
- Add: `frontend/src/lib/jobPipelineStorage.test.mjs`
- Modify: `frontend/src/lib/useJobPipeline.js`

- [ ] **Step 1: Write failing tests for job pipeline state transitions**

Create `frontend/src/lib/jobPipelineStorage.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createJob,
  addJobToList,
  addResumeToJobList,
  deleteJobFromList,
  deleteResumeFromJobList,
  resetStaleProcessingJobs,
  updateJobInList,
  updateResumeInJobList,
} from './jobPipelineStorage.js';

test('adds a job with default pipeline fields', () => {
  const job = createJob({
    company: 'Acme',
    title: 'Frontend Engineer',
    url: 'https://example.com/job',
    jdRaw: 'React role',
  }, { id: 'job-1', now: '2026-05-15T10:00:00.000Z' });
  const jobs = addJobToList([], job);

  assert.equal(jobs[0].id, 'job-1');
  assert.equal(jobs[0].status, 'A Avaliar');
  assert.equal(jobs[0].isProcessing, false);
  assert.deepEqual(jobs[0].resumes, []);
});

test('updates a job and appends a resume version', () => {
  const job = createJob({ company: 'Acme', title: 'Dev', jdRaw: 'Job' }, { id: 'job-1', now: '2026-05-15T10:00:00.000Z' });
  const start = addJobToList([], job);
  const processing = updateJobInList(start, 'job-1', { isProcessing: true });
  const withResume = addResumeToJobList(processing, 'job-1', {
    name: 'Versao 1',
    data: { professional: { name: 'Daniel' }, heritage: { name: 'Daniel' } },
  }, { id: 'resume-1', now: '2026-05-15T10:01:00.000Z' });

  assert.equal(withResume[0].isProcessing, true);
  assert.equal(withResume[0].resumes[0].id, 'resume-1');
  assert.equal(withResume[0].resumes[0].dateCreated, '2026-05-15T10:01:00.000Z');
});

test('updates and deletes one resume version without changing other jobs', () => {
  const jobs = [
    {
      id: 'job-1',
      resumes: [
        { id: 'resume-1', data: { professional: { summary: 'Old' } } },
        { id: 'resume-2', data: { professional: { summary: 'Keep' } } },
      ],
    },
    { id: 'job-2', resumes: [{ id: 'resume-3', data: {} }] },
  ];

  const updated = updateResumeInJobList(jobs, 'job-1', 'resume-1', { data: { professional: { summary: 'New' } } });
  const deleted = deleteResumeFromJobList(updated, 'job-1', 'resume-2');

  assert.equal(deleted[0].resumes.length, 1);
  assert.equal(deleted[0].resumes[0].data.professional.summary, 'New');
  assert.equal(deleted[1].resumes[0].id, 'resume-3');
});

test('resets stale processing jobs after a page reload', () => {
  const jobs = resetStaleProcessingJobs([
    { id: 'job-1', isProcessing: true, processingError: null },
    { id: 'job-2', isProcessing: false, processingError: null },
  ]);

  assert.equal(jobs[0].isProcessing, false);
  assert.match(jobs[0].processingError, /recarregamento/);
  assert.equal(jobs[1].processingError, null);
});

test('deletes jobs by id', () => {
  const jobs = deleteJobFromList([{ id: 'job-1' }, { id: 'job-2' }], 'job-1');
  assert.deepEqual(jobs, [{ id: 'job-2' }]);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
node --test frontend/src/lib/jobPipelineStorage.test.mjs
```

Expected: FAIL because `jobPipelineStorage.js` does not exist.

- [ ] **Step 3: Implement `jobPipelineStorage.js`**

Create `frontend/src/lib/jobPipelineStorage.js`:

```js
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
```

- [ ] **Step 4: Refactor `useJobPipeline.js` to use pure helpers**

Replace `frontend/src/lib/useJobPipeline.js` with:

```js
import { useState, useEffect } from 'react';
import {
  JOB_PIPELINE_STORAGE_KEY,
  addJobToList,
  addResumeToJobList,
  createJob,
  deleteJobFromList,
  deleteResumeFromJobList,
  resetStaleProcessingJobs,
  updateJobInList,
  updateResumeInJobList,
} from './jobPipelineStorage';

export function useJobPipeline() {
  const [jobs, setJobs] = useState(() => {
    try {
      const item = window.localStorage.getItem(JOB_PIPELINE_STORAGE_KEY);
      return resetStaleProcessingJobs(item ? JSON.parse(item) : []);
    } catch (error) {
      console.warn('Error reading localStorage', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(JOB_PIPELINE_STORAGE_KEY, JSON.stringify(jobs));
    } catch (error) {
      console.warn('Error saving to localStorage', error);
    }
  }, [jobs]);

  const addJob = (job) => {
    const created = createJob(job);
    setJobs((prev) => addJobToList(prev, created));
    return created.id;
  };

  const updateJob = (id, updates) => {
    setJobs((prev) => updateJobInList(prev, id, updates));
  };

  const deleteJob = (id) => {
    setJobs((prev) => deleteJobFromList(prev, id));
  };

  const addResumeToJob = (jobId, resume) => {
    setJobs((prev) => addResumeToJobList(prev, jobId, resume));
  };

  const updateResumeForJob = (jobId, resumeId, updates) => {
    setJobs((prev) => updateResumeInJobList(prev, jobId, resumeId, updates));
  };

  const deleteResumeFromJob = (jobId, resumeId) => {
    setJobs((prev) => deleteResumeFromJobList(prev, jobId, resumeId));
  };

  return {
    jobs,
    addJob,
    updateJob,
    deleteJob,
    addResumeToJob,
    updateResumeForJob,
    deleteResumeFromJob,
  };
}
```

- [ ] **Step 5: Run storage tests**

Run:

```bash
node --test frontend/src/lib/jobPipelineStorage.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/jobPipelineStorage.js frontend/src/lib/jobPipelineStorage.test.mjs frontend/src/lib/useJobPipeline.js
git commit -m "feat: add local job pipeline storage helpers"
```

---

### Task 3: Add Backend Master Generation And Tailor Artifacts

**Files:**
- Modify: `backend/src/index.ts`
- Modify: `backend/src/providerRouting.test.mjs`

- [ ] **Step 1: Add source tests for new endpoint and prompt behavior**

Append to `backend/src/providerRouting.test.mjs`:

```js
test('backend exposes a dedicated master generation endpoint without match score language', () => {
  assert.match(backendSource, /MASTER_RESUME_SYSTEM_PROMPT/);
  assert.match(backendSource, /\.post\("\/api\/generate-master"/);
  const masterPrompt = backendSource.match(/const MASTER_RESUME_SYSTEM_PROMPT = `([\s\S]*?)`;/)?.[1] || '';
  assert.doesNotMatch(masterPrompt, /Match Score/i);
  assert.match(masterPrompt, /preserve/i);
});

test('tailor resume returns latex artifacts for saved job versions', () => {
  const tailorBlock = backendSource.match(/\.post\("\/api\/tailor-resume"[\s\S]*?\}, \{ body:/)?.[0] || '';
  assert.match(tailorBlock, /formatResumeToLatex/);
  assert.match(tailorBlock, /latex/);
});
```

- [ ] **Step 2: Run backend source tests and verify they fail**

Run:

```bash
node --test backend/src/providerRouting.test.mjs
```

Expected: FAIL because `/api/generate-master`, `MASTER_RESUME_SYSTEM_PROMPT`, and tailor LaTeX output are missing.

- [ ] **Step 3: Add `MASTER_RESUME_SYSTEM_PROMPT`**

Add this near the existing prompt constants in `backend/src/index.ts`:

```ts
const MASTER_RESUME_SYSTEM_PROMPT = `
You are the master resume engine for an ATS resume platform.

Your job is to convert the candidate's original resume into a structured master resume.
This is NOT a job-match task. Do not calculate compatibility, match score, or job fit.

Rules:
- Preserve every real role, company, project, education item, date, tool, and skill that is supported by the source resume.
- Do not invent employers, titles, certifications, technologies, metrics, seniority, degrees, or achievements.
- Improve clarity, ATS readability, grammar, structure, and section organization.
- Use stronger action verbs only when they remain faithful to the original work.
- If a career focus is provided, tune vocabulary toward that focus without changing the candidate truth.
- Return only valid JSON matching the requested resume schema.
`;
```

- [ ] **Step 4: Add `/api/generate-master`**

Add this endpoint before `/api/generate`:

```ts
.post("/api/generate-master", async ({ body, set, headers }) => {
  try {
    const { resume, level, careerFocus, language } = body;
    const keys = getRequestKeys(headers as Record<string, string | undefined>);
    const resumeText = await extractResumeText(resume, set);
    if (!resumeText) return { error: "Curriculo invalido." };

    const levelInfo = LEVEL_INSTRUCTIONS[level || "balanced"];
    const prompt = `IDIOMA: ${language || 'Portugues (BR)'}
NIVEL DE REESCRITA: ${levelInfo.name} (${levelInfo.focus})
FOCO DE CARREIRA OPCIONAL: ${careerFocus || 'Nao informado'}

CURRICULO ORIGINAL:
${resumeText}

Return JSON in this exact shape:
{
  "professional": ProfessionalResumeSchema,
  "heritage": HeritageResumeSchema
}`;

    const modelId = body.modelId || DEFAULT_AI_MODEL;
    const data = await generateJsonWithSelectedModel({
      modelId,
      keys,
      temperature: 0.2,
      maxTokens: 4096,
      system: MASTER_RESUME_SYSTEM_PROMPT,
      userText: prompt,
      geminiSchema: {
        type: SchemaType.OBJECT,
        properties: {
          professional: professionalResumeSchema,
          heritage: heritageResumeSchema
        },
        required: ["professional", "heritage"]
      }
    });

    const validated = GeminiResponseSchema.parse(data);
    const latex = {
      professional: formatResumeToLatex(validated.professional as any),
      heritage: formatResumeToLatex(validated.heritage as any)
    };

    return { success: true, data: validated, latex };
  } catch (e: any) {
    console.error("Erro geracao mestre:", e);
    set.status = 500;
    return { error: e.message || "Erro ao gerar curriculo mestre." };
  }
}, { body: t.Object({ resume: t.File(), level: t.Optional(t.String()), careerFocus: t.Optional(t.String()), language: t.Optional(t.String()), modelId: t.Optional(t.String()) }) })
```

- [ ] **Step 5: Adjust `/api/analyze-master` to force ATS-only fields when there is no job**

Inside `/api/analyze-master`, after parsing `json`, replace the direct return with:

```ts
const parsed = AnalysisResponseSchema.parse(json);
const data = jobDescription ? parsed : {
  ...parsed,
  matchScore: null,
  matchGrade: null,
  matchAnalysis: null,
  missingQualifications: null,
  foundKeywords: parsed.foundKeywords || [],
  missingKeywords: parsed.missingKeywords || [],
};

return { success: true, data };
```

Keep the existing return shape.

- [ ] **Step 6: Adjust `/api/tailor-resume` to return dual-layout data plus LaTeX**

In `/api/tailor-resume`, replace the final success return with logic that normalizes the AI result:

```ts
const professional = json.professional || json;
const heritage = json.heritage || {
  ...professional,
  links: professional.links || [],
  projects: professional.projects || []
};
const validated = GeminiResponseSchema.parse({ professional, heritage });
const latex = {
  professional: formatResumeToLatex(validated.professional as any),
  heritage: formatResumeToLatex(validated.heritage as any)
};

return { success: true, data: validated, latex };
```

Also update the prompt ending to request both layouts:

```ts
Retorne APENAS JSON valido no formato:
{
  "professional": ProfessionalResumeSchema,
  "heritage": HeritageResumeSchema
}
```

- [ ] **Step 7: Run backend source tests**

Run:

```bash
node --test backend/src/providerRouting.test.mjs
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/index.ts backend/src/providerRouting.test.mjs
git commit -m "feat: add master resume backend flow"
```

---

### Task 4: Add Editable Heritage Theme Support

**Files:**
- Modify: `frontend/src/components/themes/HeritageTheme.jsx`

- [ ] **Step 1: Add the same edit callback pattern used by `AtsBasicTheme`**

Update the component signature and add a small local editable field helper:

```jsx
function EditableText({ onEdit, path, value, as: Tag = 'span', className = '' }) {
  if (!value) return null;
  if (!onEdit) return <Tag className={className}>{value}</Tag>;

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
```

- [ ] **Step 2: Wrap editable text nodes**

Replace direct text in important fields with `EditableText`, for example:

```jsx
<EditableText onEdit={onEdit} as="h1" path="name" value={data?.name} />
<EditableText onEdit={onEdit} path="email" value={data.email} />
<EditableText onEdit={onEdit} path={`experience.${idx}.responsibilities.${itemIdx}`} value={item} />
```

Apply this to:

- name
- email
- phone
- address
- summary
- skill group category and items as a comma-separated string path
- experience role, company, location, date, responsibilities
- projects name, technologies, description, url
- education degree, institution, location, date

Leave `skillsGroup` item lists non-editable in this pass because the current theme renders each group as a joined string and editing that string would require a separate parser. Experience, project, education, contact, and summary fields remain editable.

- [ ] **Step 3: Run build after edit**

Run:

```bash
npm run build --workspace=frontend
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/themes/HeritageTheme.jsx
git commit -m "feat: make heritage resume fields editable"
```

---

### Task 5: Add Tailored Resume Result Modal

**Files:**
- Add: `frontend/src/components/TailoredResumeModal.jsx`
- Modify: `frontend/src/lib/resumePayload.js` if a small helper is needed

- [ ] **Step 1: Create `TailoredResumeModal.jsx`**

Create `frontend/src/components/TailoredResumeModal.jsx` with this structure:

```jsx
import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Download, Edit3, LayoutTemplate, Save, Sparkles, X } from 'lucide-react';
import CoverLetterPanel from './CoverLetterPanel';
import HeritageTheme from './themes/HeritageTheme';
import ProfessionalTheme from './themes/AtsBasicTheme';
import { getApiKey, getAiModel } from '../lib/apiKey';
import {
  RESUME_LAYOUTS,
  normalizeGeneratedResumes,
  resumeToPlainText,
  setValueAtPath,
} from '../lib/resumePayload';
import { useLanguage } from '../i18n/LanguageContext';

function getHeaders(extra = {}) {
  const gemini = getApiKey('gemini');
  const openai = getApiKey('openai');
  const anthropic = getApiKey('anthropic');
  return {
    ...(gemini ? { 'x-api-key': gemini } : {}),
    ...(openai ? { 'x-openai-key': openai } : {}),
    ...(anthropic ? { 'x-anthropic-key': anthropic } : {}),
    ...extra,
  };
}

export default function TailoredResumeModal({
  job,
  resumeVersion,
  onClose,
  onSaveVersion,
}) {
  const { t } = useLanguage();
  const [selectedLayout, setSelectedLayout] = useState(resumeVersion.selectedLayout || 'professional');
  const [interactionMode, setInteractionMode] = useState('none');
  const [editModal, setEditModal] = useState(null);
  const [instruction, setInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [showLatex, setShowLatex] = useState(false);

  const layouts = useMemo(() => normalizeGeneratedResumes(resumeVersion.data), [resumeVersion.data]);
  const selectedResume = layouts[selectedLayout] || layouts.professional;
  const selectedLatex = resumeVersion.latex?.[selectedLayout] || resumeVersion.latex?.professional || '';
  const resumeText = resumeToPlainText(selectedResume);

  const saveData = useCallback((nextData, extra = {}) => {
    onSaveVersion({
      ...resumeVersion,
      ...extra,
      selectedLayout,
      data: nextData,
    });
  }, [onSaveVersion, resumeVersion, selectedLayout]);

  const handleFieldClick = (path, value) => {
    if (interactionMode === 'none') return;
    setEditModal({ path: `${selectedLayout}.${path}`, value, type: interactionMode });
  };

  const handleManualSave = () => {
    const nextData = setValueAtPath(resumeVersion.data, editModal.path, editModal.value);
    saveData(nextData);
    setEditModal(null);
  };

  const handleAiSave = async () => {
    setIsRefining(true);
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          text: editModal.value,
          jobDescription: job.jdRaw,
          instruction,
          modelId: getAiModel(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erro ao refinar trecho.');
      const nextData = setValueAtPath(resumeVersion.data, editModal.path, data.text);
      saveData(nextData);
      setEditModal(null);
      setInstruction('');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsRefining(false);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(resumeVersion.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cv_${job.company || 'vaga'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyLatex = () => {
    if (!selectedLatex) return;
    navigator.clipboard.writeText(selectedLatex);
    alert(t('result.latexCopied'));
  };

  return (
    <div className="modal-overlay no-print" style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="modal-content"
        style={{ background: 'var(--bg)', width: 'min(1200px, 96vw)', height: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div className="resume-toolbar glass-panel no-print" style={{ margin: 0, borderRadius: 0 }}>
          <div className="resume-info">
            <h3>{resumeVersion.name}</h3>
            <p>{job.company} - {job.title}</p>
          </div>
          <div className="resume-toolbar-actions result-toolbar-grid">
            <div className="layout-toggle" role="group">
              {Object.entries(RESUME_LAYOUTS).map(([layout, config]) => (
                <button key={layout} type="button" className={`layout-toggle-button ${selectedLayout === layout ? 'active' : ''}`} onClick={() => setSelectedLayout(layout)}>
                  <LayoutTemplate size={16} /> {config.label}
                </button>
              ))}
            </div>
            <button className="btn-secondary" onClick={() => setInteractionMode(interactionMode === 'edit' ? 'none' : 'edit')}><Edit3 size={16} /> {t('result.editManual')}</button>
            <button className="btn-secondary" onClick={() => setInteractionMode(interactionMode === 'ai' ? 'none' : 'ai')}><Sparkles size={16} /> {t('result.editAi')}</button>
            <button className="btn-secondary" onClick={exportJson}><Download size={16} /> {t('result.exportJson')}</button>
            {selectedLatex && <button className="btn-secondary" onClick={copyLatex}><Code size={16} /> {t('result.copyLatex')}</button>}
            <button className="btn-primary" onClick={() => window.print()}><Download size={16} /> {t('result.savePdf')}</button>
            <button className="btn-secondary" onClick={onClose}><X size={16} /> Fechar</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <div className="resume-paper-container">
            <div className={`resume-paper ${RESUME_LAYOUTS[selectedLayout].className}`}>
              {selectedLayout === 'heritage'
                ? <HeritageTheme data={selectedResume} onEdit={interactionMode !== 'none' ? handleFieldClick : null} />
                : <ProfessionalTheme data={selectedResume} onEdit={interactionMode !== 'none' ? handleFieldClick : null} />}
            </div>
          </div>

          <div className="no-print" style={{ maxWidth: '900px', margin: '32px auto 0' }}>
            <CoverLetterPanel resumeText={resumeText} jobDescription={job.jdRaw} />
          </div>

          {selectedLatex && (
            <div className="no-print" style={{ maxWidth: '900px', margin: '24px auto 60px' }}>
              <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowLatex(!showLatex)}>
                <Code size={16} /> {showLatex ? t('result.hideLatex') : t('result.showLatex')} {t('result.latexCode')}
              </button>
              {showLatex && <pre style={{ marginTop: '12px', background: '#1e1e2e', color: '#cdd6f4', padding: '20px', whiteSpace: 'pre-wrap' }}>{selectedLatex}</pre>}
            </div>
          )}
        </div>

        {editModal && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal-content glass-panel" style={{ width: '520px', maxWidth: '92vw', background: 'white', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>{editModal.type === 'ai' ? t('result.modalAiTitle') : t('result.modalEditTitle')}</h3>
                <button className="icon-btn" onClick={() => setEditModal(null)}><X size={18} /></button>
              </div>
              {editModal.type === 'edit' ? (
                <textarea value={editModal.value} onChange={(event) => setEditModal({ ...editModal, value: event.target.value })} style={{ width: '100%', minHeight: '160px' }} />
              ) : (
                <>
                  <div style={{ padding: '12px', background: '#f1f5f9', marginBottom: '12px' }}>{editModal.value}</div>
                  <input value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder={t('result.modalAiPlaceholder')} style={{ width: '100%', padding: '12px' }} />
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button className="btn-secondary" onClick={() => setEditModal(null)}>{t('result.modalCancel')}</button>
                <button className="btn-primary" onClick={editModal.type === 'ai' ? handleAiSave : handleManualSave} disabled={isRefining}>
                  <Save size={16} /> {isRefining ? t('result.modalProcessing') : t('result.modalSave')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Run build**

Run:

```bash
npm run build --workspace=frontend
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/TailoredResumeModal.jsx
git commit -m "feat: add tailored resume result modal"
```

---

### Task 6: Refactor Master Resume View

**Files:**
- Modify: `frontend/src/components/MasterResumeView.jsx`

- [ ] **Step 1: Update master generation to call `/api/generate-master`**

In `handleGenerateMaster`, replace:

```js
if (combo) formData.append('careerCombo', combo);
```

with:

```js
if (combo) formData.append('careerFocus', combo);
```

Replace the fetch URL:

```js
const res = await fetch('/api/generate-master', {
```

Store the whole response preview:

```js
const professionalResume = data.data.professional || data.data;
setPreviewResume(professionalResume);
```

This keeps the master saved as a professional single-layout resume, matching the pipeline source expected by `/api/tailor-resume`.

- [ ] **Step 2: Send provider keys and selected model to `/api/analyze-master`**

Add a local `getHeaders` helper near `handleAnalyze`:

```js
const getHeaders = (extra = {}) => {
  const gemini = getApiKey('gemini');
  const openai = getApiKey('openai');
  const anthropic = getApiKey('anthropic');
  return {
    ...(gemini ? { 'x-api-key': gemini } : {}),
    ...(openai ? { 'x-openai-key': openai } : {}),
    ...(anthropic ? { 'x-anthropic-key': anthropic } : {}),
    ...extra,
  };
};
```

Update `handleAnalyze` fetch:

```js
const res = await fetch('/api/analyze-master', {
  method: 'POST',
  headers: getHeaders({ 'Content-Type': 'application/json' }),
  body: JSON.stringify({ resumeJson: resume, language, modelId: getAiModel() })
});
```

- [ ] **Step 3: Show correct ATS base analysis fields**

Replace the score display in the analysis card:

```jsx
<div className="mac-score">{analysis.atsScore}/100</div>
```

Replace the reason:

```jsx
<p className="mac-reason">{analysis.screeningReason || 'Analise concluida.'}</p>
```

- [ ] **Step 4: Add field-level manual and AI editing for the master preview**

Update imports:

```jsx
import { FileText, Edit2, Check, X, Shield, Loader2, AlertTriangle, Save, Upload, Settings, Eye, RefreshCw, Sparkles } from 'lucide-react';
import { setValueAtPath } from '../lib/resumePayload';
```

Add state near the existing edit state:

```js
const [interactionMode, setInteractionMode] = useState('none');
const [editModal, setEditModal] = useState(null);
const [refineInstruction, setRefineInstruction] = useState('');
const [isRefining, setIsRefining] = useState(false);
```

Add these handlers:

```js
const persistResume = (nextResume) => {
  localStorage.setItem('ats_master_resume', JSON.stringify(nextResume));
  setResume(nextResume);
  setEditJson(JSON.stringify(nextResume, null, 2));
};

const handleMasterFieldClick = (path, value) => {
  if (interactionMode === 'none') return;
  setEditModal({ path, value, type: interactionMode });
};

const handleManualFieldSave = () => {
  const nextResume = setValueAtPath(resume, editModal.path, editModal.value);
  persistResume(nextResume);
  setEditModal(null);
};

const handleAiFieldSave = async () => {
  setIsRefining(true);
  try {
    const res = await fetch('/api/refine', {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        text: editModal.value,
        instruction: refineInstruction || 'Melhore clareza, impacto e aderencia ATS sem inventar informacoes.',
        modelId: getAiModel(),
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Erro ao refinar trecho.');
    const nextResume = setValueAtPath(resume, editModal.path, data.text);
    persistResume(nextResume);
    setEditModal(null);
    setRefineInstruction('');
  } catch (err) {
    setError(err.message);
  } finally {
    setIsRefining(false);
  }
};
```

Change `handleSave` to use `persistResume(parsed)` instead of duplicating localStorage writes:

```js
persistResume(parsed);
setIsEditing(false);
setError('');
```

In the `isViewing` branch, add a small toolbar before the paper:

```jsx
<div style={{ marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
  <button className="btn-secondary" onClick={() => setIsViewing(false)}>
    <X size={16} /> Fechar Visualizacao
  </button>
  <div style={{ display: 'flex', gap: '10px' }}>
    <button className="btn-secondary" onClick={() => setInteractionMode(interactionMode === 'edit' ? 'none' : 'edit')}>
      <Edit2 size={16} /> Editar campos
    </button>
    <button className="btn-secondary" onClick={() => setInteractionMode(interactionMode === 'ai' ? 'none' : 'ai')}>
      <Sparkles size={16} /> Refinar com IA
    </button>
  </div>
</div>
```

Pass the edit callback to the preview:

```jsx
<ProfessionalTheme data={resume} onEdit={interactionMode !== 'none' ? handleMasterFieldClick : null} />
```

Render this modal near the end of the component return branches that can show the master:

```jsx
{editModal && (
  <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal-content glass-panel" style={{ width: '520px', maxWidth: '92vw', background: 'white', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>{editModal.type === 'ai' ? 'Refinar com IA' : 'Editar campo'}</h3>
        <button className="icon-btn" onClick={() => setEditModal(null)}><X size={18} /></button>
      </div>
      {editModal.type === 'edit' ? (
        <textarea value={editModal.value} onChange={(event) => setEditModal({ ...editModal, value: event.target.value })} style={{ width: '100%', minHeight: '160px' }} />
      ) : (
        <>
          <div style={{ padding: '12px', background: '#f1f5f9', marginBottom: '12px' }}>{editModal.value}</div>
          <input value={refineInstruction} onChange={(event) => setRefineInstruction(event.target.value)} placeholder="Ex: deixe mais objetivo e com verbos de acao" style={{ width: '100%', padding: '12px' }} />
        </>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
        <button className="btn-secondary" onClick={() => setEditModal(null)}>Cancelar</button>
        <button className="btn-primary" onClick={editModal.type === 'ai' ? handleAiFieldSave : handleManualFieldSave} disabled={isRefining}>
          <Save size={16} /> {isRefining ? 'Processando...' : 'Salvar'}
        </button>
      </div>
    </motion.div>
  </div>
)}
```

- [ ] **Step 5: Run build**

Run:

```bash
npm run build --workspace=frontend
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/MasterResumeView.jsx
git commit -m "feat: use dedicated master resume generation"
```

---

### Task 7: Refactor Pipeline View For Modal-Close Background Tailoring

**Files:**
- Modify: `frontend/src/components/PipelineView.jsx`

- [ ] **Step 1: Replace imports**

Change imports at the top:

```jsx
import React, { useMemo, useState } from 'react';
import { Briefcase, ExternalLink, Trash2, Plus, Loader2, Download, AlertCircle, Eye, Check, X, RotateCcw } from 'lucide-react';
import { normalizeGeneratedResumes } from '../lib/resumePayload';
import TailoredResumeModal from './TailoredResumeModal';
```

Remove unused imports:

- `Target`
- `Edit2`
- `Save`
- `ProfessionalTheme`
- `t` if it remains unused
- `tailorModal` state

- [ ] **Step 2: Add modal state that does not use `window._targetJobId`**

Replace `viewResumeModal` state with:

```js
const [selectedResumeModal, setSelectedResumeModal] = useState({
  isOpen: false,
  jobId: null,
  resumeId: null,
});
```

Add:

```js
const [keywordFlow, setKeywordFlow] = useState({
  isOpen: false,
  jobId: null,
  selectedKeywords: [],
});
```

- [ ] **Step 3: Derive selected job and resume**

Add after state declarations:

```js
const selectedJob = useMemo(
  () => jobs.find((job) => job.id === jobDetailModal.jobId) || null,
  [jobs, jobDetailModal.jobId]
);

const selectedResumeJob = useMemo(
  () => jobs.find((job) => job.id === selectedResumeModal.jobId) || null,
  [jobs, selectedResumeModal.jobId]
);

const selectedResumeVersion = useMemo(
  () => selectedResumeJob?.resumes?.find((resume) => resume.id === selectedResumeModal.resumeId) || null,
  [selectedResumeJob, selectedResumeModal.resumeId]
);
```

- [ ] **Step 4: Fix add-job flow to save the job before keyword confirmation**

In `handleAddStart`, after successful extraction and master analysis, create or update a job immediately:

```js
const existingJob = {
  company: company || 'Empresa nao identificada',
  title: title || 'Cargo nao identificado',
  url: job.url,
  jdRaw: jd,
  analysisData: dAna.data,
  keywordSelection: [],
  isProcessing: false,
  processingError: null,
};

const jobId = addJob(existingJob);

setAddModal({
  isOpen: false,
  step: 1,
  job: { company: '', title: '', url: '', jdText: '' },
  analysis: null,
  selectedKeywords: [],
  loadingMsg: ''
});
setJobDetailModal({ isOpen: true, jobId });
setKeywordFlow({ isOpen: true, jobId, selectedKeywords: [] });
```

Remove the old `setAddModal(... step: 3 ...)` path for new jobs.

- [ ] **Step 5: Replace `handleAddConfirm` with job-id based tailoring**

Implement:

```js
const startTailoring = (jobId, selectedKeywords = []) => {
  const job = jobs.find((item) => item.id === jobId);
  const masterStr = localStorage.getItem('ats_master_resume');

  if (!job) return;
  if (!masterStr) {
    updateJob(jobId, { processingError: 'Configure o Curriculo Mestre antes de adaptar uma vaga.' });
    return;
  }

  updateJob(jobId, {
    isProcessing: true,
    processingError: null,
    keywordSelection: selectedKeywords,
  });
  setKeywordFlow({ isOpen: false, jobId: null, selectedKeywords: [] });

  processTailoringBackground(jobId, job.jdRaw, masterStr, selectedKeywords.join(', '));
};
```

Delete `handleAddConfirm` and any `window._targetJobId` logic.

- [ ] **Step 6: Normalize tailored result before saving**

Inside `processTailoringBackground`, after `dTailor.success`:

```js
const generatedData = dTailor.data;
const normalizedData = normalizeGeneratedResumes(generatedData);
```

Use `normalizedData` in the saved resume version:

```js
const resumeEntry = {
  data: normalizedData,
  latex: dTailor.latex || null,
  analysis: dAna.success ? dAna.data : null,
  boostedKeywords,
  name: `Versao ${(jobs.find((job) => job.id === jobId)?.resumes?.length || 0) + 1}`
};
```

Update job completion:

```js
addResumeToJob(jobId, resumeEntry);
updateJob(jobId, { isProcessing: false, status: 'Para Aplicar', processingError: null });
```

On catch:

```js
updateJob(jobId, { isProcessing: false, processingError: e.message || 'Erro ao adaptar curriculo.' });
```

- [ ] **Step 7: Render keyword confirmation inside the job detail modal**

In the right panel, before the resume list, render this when `keywordFlow.isOpen && keywordFlow.jobId === job.id`:

```jsx
<div className="doc-card" style={{ padding: '20px', background: 'white' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
    <h4 className="wizard-title" style={{ margin: 0 }}>Confirmar keywords</h4>
    <span style={{ background: 'var(--primary)', color: 'white', padding: '4px 10px', fontWeight: 700 }}>
      {job.analysisData?.matchScore ?? 0}% MATCH
    </span>
  </div>
  <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', lineHeight: 1.5 }}>
    {job.analysisData?.matchAnalysis || job.analysisData?.screeningReason || 'Selecione apenas keywords que fazem sentido para seu historico real.'}
  </p>
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
    {(job.analysisData?.missingKeywords || []).map((kw) => {
      const active = keywordFlow.selectedKeywords.includes(kw);
      return (
        <button
          key={kw}
          className={`nav-item ${active ? 'active' : ''}`}
          onClick={() => setKeywordFlow((prev) => ({
            ...prev,
            selectedKeywords: active
              ? prev.selectedKeywords.filter((item) => item !== kw)
              : [...prev.selectedKeywords, kw],
          }))}
          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
        >
          {active && <Check size={14} />} {kw}
        </button>
      );
    })}
  </div>
  <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
    <button className="btn-secondary" onClick={() => setKeywordFlow({ isOpen: false, jobId: null, selectedKeywords: [] })}>Cancelar</button>
    <button className="btn-primary" onClick={() => startTailoring(job.id, keywordFlow.selectedKeywords)}>Gerar curriculo</button>
  </div>
</div>
```

- [ ] **Step 8: Update "Adaptar Nova" button**

Replace its click handler with:

```jsx
onClick={() => setKeywordFlow({ isOpen: true, jobId: job.id, selectedKeywords: job.keywordSelection || [] })}
```

- [ ] **Step 9: Show processing and retry from saved job state**

When `job.isProcessing`, keep the existing loading card, but use copy that makes modal-close behavior explicit:

```jsx
<div style={{ fontSize: '0.7rem', color: 'var(--secondary)' }}>
  Voce pode fechar este modal enquanto a aba continuar aberta.
</div>
```

When `job.processingError`, render:

```jsx
<div className="doc-card" style={{ padding: '20px', borderColor: '#dc2626', background: '#fef2f2' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#991b1b', fontWeight: 800 }}>
    <AlertCircle size={18} /> Falha na geracao
  </div>
  <p style={{ fontSize: '0.85rem', color: '#7f1d1d' }}>{job.processingError}</p>
  <button className="btn-secondary" onClick={() => setKeywordFlow({ isOpen: true, jobId: job.id, selectedKeywords: job.keywordSelection || [] })}>
    <RotateCcw size={14} /> Tentar novamente
  </button>
</div>
```

- [ ] **Step 10: Open `TailoredResumeModal` from resume cards**

Replace visualizer button handler:

```jsx
onClick={() => setSelectedResumeModal({ isOpen: true, jobId: job.id, resumeId: res.id })}
```

Render the modal near the bottom of `PipelineView`:

```jsx
{selectedResumeModal.isOpen && selectedResumeJob && selectedResumeVersion && (
  <TailoredResumeModal
    job={selectedResumeJob}
    resumeVersion={selectedResumeVersion}
    onClose={() => setSelectedResumeModal({ isOpen: false, jobId: null, resumeId: null })}
    onSaveVersion={(nextVersion) => updateResumeForJob(selectedResumeJob.id, selectedResumeVersion.id, nextVersion)}
  />
)}
```

- [ ] **Step 11: Remove old resume modal code**

Delete the old `viewResumeModal` JSX block and the old JSON-only edit save path that writes `tailoredResume`.

- [ ] **Step 12: Run build**

Run:

```bash
npm run build --workspace=frontend
```

Expected: PASS.

- [ ] **Step 13: Commit**

```bash
git add frontend/src/components/PipelineView.jsx
git commit -m "feat: keep pipeline tailoring running after modal close"
```

---

### Task 8: Add Pipeline Regression Tests By Source Inspection

**Files:**
- Add: `frontend/src/components/PipelineView.test.mjs`

- [ ] **Step 1: Create source-level regression tests**

Create `frontend/src/components/PipelineView.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const pipelineSource = readFileSync(join(currentDir, 'PipelineView.jsx'), 'utf8');

test('pipeline no longer uses global target job state', () => {
  assert.doesNotMatch(pipelineSource, /window\._targetJobId/);
});

test('pipeline renders saved processing state and retry errors', () => {
  assert.match(pipelineSource, /job\.isProcessing/);
  assert.match(pipelineSource, /job\.processingError/);
  assert.match(pipelineSource, /Tentar novamente/);
});

test('pipeline uses tailored resume modal for saved resume versions', () => {
  assert.match(pipelineSource, /TailoredResumeModal/);
  assert.match(pipelineSource, /updateResumeForJob/);
});
```

- [ ] **Step 2: Run the regression test**

Run:

```bash
node --test frontend/src/components/PipelineView.test.mjs
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PipelineView.test.mjs
git commit -m "test: cover pipeline modal background behavior"
```

---

### Task 9: Final Verification

**Files:**
- No planned edits unless a verification failure exposes a bug.

- [ ] **Step 1: Run all focused Node tests**

Run:

```bash
node --test frontend/src/lib/resumePayload.test.mjs frontend/src/lib/jobPipelineStorage.test.mjs frontend/src/components/PipelineView.test.mjs frontend/src/lib/providerHeaders.test.mjs frontend/src/lib/aiModels.test.mjs frontend/src/components/Sidebar.test.mjs frontend/src/styles/resumePrint.test.mjs backend/src/providerRouting.test.mjs
```

Expected: PASS.

- [ ] **Step 2: Run frontend build**

Run:

```bash
npm run build --workspace=frontend
```

Expected: PASS.

- [ ] **Step 3: Run backend syntax check through Bun**

Run:

```bash
cd backend && bun run src/index.ts
```

Expected: backend starts and logs its local URL. Stop the process after it starts.

- [ ] **Step 4: Run manual browser verification**

Run the app:

```bash
bun run dev
```

Manual checks:

- Existing wizard opens.
- Existing wizard can still move through upload, analysis, keyword, and result screens with a valid PDF/DOCX and job text.
- Master page creates a master resume through `/api/generate-master`.
- Master page ATS base analysis shows `atsScore`, not match score.
- Pipeline adds a job from manual text.
- Pipeline adds a job from a Gupy-like URL when the site allows scraping.
- Keyword confirmation opens in the job modal.
- Clicking generate sets the job as processing.
- Closing and reopening the job modal shows the processing card while the request is still pending.
- When the request completes, a resume version appears under that job.
- Opening the resume version shows the tailored result modal.
- Manual field edit persists to `localStorage`.
- AI field edit persists to `localStorage`.
- Professional/Heritage toggle works.
- CV-as-code JSON export downloads.
- LaTeX copy works when available.
- Browser print opens the PDF print flow.
- Cover letter generation works from the tailored resume.

- [ ] **Step 5: Commit any verification fixes**

If verification required code changes:

```bash
git add <changed-files>
git commit -m "fix: stabilize local resume pipeline"
```

If no fixes were needed, do not create an empty commit.

---

## Self-Review

- Spec coverage: master generation, local storage, modal-close background tailoring, stale refresh behavior, result actions, and existing wizard preservation are covered by tasks.
- Placeholder scan passed: tasks contain concrete file paths, commands, expected outcomes, and helper definitions.
- Type consistency: job ids are strings, resume version ids are strings, job resume data is normalized to `{ professional, heritage }`, and edit paths include layout prefixes.
- Risk: backend AI output can still vary by provider. The plan validates generated resume payloads with the existing Zod schema before returning them to the frontend.
