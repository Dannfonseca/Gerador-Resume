# Local Resume Pipeline Design

## Context

The current product already has three related areas:

- The existing wizard for one-off resume analysis and generation.
- A partial `MasterResumeView` that stores a master resume in `localStorage`.
- A partial `PipelineView` that stores jobs in `localStorage` and can start a tailored resume request.

The requested change is not to remove the current analysis wizard. The product should add a clearer second path:

1. Build and maintain a master resume.
2. Save job opportunities by URL/manual text.
3. Generate tailored resumes from the master resume for each saved job.

This first version intentionally stays browser-local. `localStorage` is the source of truth. If the user closes or refreshes the browser while a generation request is in progress, the in-flight request is lost. If the user only closes the modal while the tab stays open, the request continues and the result is saved when it returns.

## Goals

- Keep the current resume analysis wizard working.
- Add a master resume flow that uses a prompt similar in rigor to resume analysis, but without job match scoring.
- Ensure the master prompt preserves the real candidate history and does not invent experience.
- Let the user manually edit the master resume or refine master resume fields with AI.
- Let the user add a job by pasting a URL, with light scraping for company, title, and job description.
- Save the job in `localStorage`.
- Let the user open the job modal, review suggested keywords, confirm which keywords apply, and start background tailoring.
- Let the user close the modal while tailoring continues in the current browser tab.
- Show loading again if the user reopens the same job modal while tailoring is still running.
- When tailoring finishes, show the generated resume inside the job modal.
- Support viewing, manual editing, AI editing, CV-as-code export, Professional/Heritage layout switching, PDF print/download, and cover letter generation from the tailored resume.

## Non-Goals

- No backend database.
- No durable background queue.
- No resume generation that survives browser refresh or browser close.
- No login or multi-user isolation in this version.
- No automatic job application submission.
- No heavy anti-bot scraping. If a site blocks scraping, the user can paste the job text manually.
- Word/DOCX export is optional for a later pass unless an existing library is already available and the implementation cost is low.

## Architecture

The first version keeps the frontend as the owner of pipeline state.

- `ats_master_resume` in `localStorage` stores the master resume JSON.
- `ats_job_pipeline` in `localStorage` stores saved jobs and generated resume versions.
- `PipelineView` owns in-memory active requests for the current tab.
- Backend endpoints remain stateless AI helpers:
  - extract job metadata and description from a URL.
  - create a master resume from an uploaded PDF/DOCX.
  - analyze master resume against a job to suggest match keywords.
  - tailor a resume from the master resume and confirmed keywords.
  - refine selected resume text.
  - generate cover letters.
  - generate LaTeX for resume layouts if needed by the frontend result modal.

The important constraint is that "background" means background relative to the modal, not background relative to the browser process.

## Master Resume Flow

### Empty State

If no master resume exists, the master resume page shows an upload flow:

- Upload PDF/DOCX.
- Optional target role or career focus.
- Optional rewrite intensity, defaulting to balanced.
- Generate master resume.
- Preview generated master resume.
- Save as master.

### Master Prompt

The master generation prompt must be separate from the vacancy-tailoring prompt.

It should:

- Produce a structured resume JSON compatible with the existing resume schema.
- Improve ATS readability and content clarity.
- Preserve every real role, project, education item, and known skill from the original resume.
- Avoid job-specific match scoring.
- Avoid claiming skills, tools, certifications, companies, titles, metrics, or seniority not supported by the source resume.
- Prefer neutral improvements: clearer summary, consistent dates, categorized skills, stronger action verbs, and better bullet structure.
- If career focus is supplied, tune vocabulary and section ordering toward that focus without changing the candidate truth.

### Existing Master Resume State

If a master resume exists, show:

- Candidate name, title, contact summary.
- View resume.
- Edit manually.
- Edit/refine with AI.
- Replace from file.
- Run base ATS analysis without job match fields.

Manual editing should not require editing raw JSON as the only path. The first implementation can still keep JSON editing for speed, but the target design is field-level editing using the existing editable resume components.

## Job Pipeline Flow

### Add Job

The user clicks "Nova Vaga" and can provide:

- URL only.
- Or company, title, URL, and manual job description text.

If URL is present and manual job text is empty:

- Call `/api/extract-job`.
- Store returned `company`, `title`, `description`, and original `url`.
- If extraction fails, keep the modal open and ask for manual paste.

After the job description is available:

- Save the job immediately to `localStorage`.
- Open the job modal for that job.
- Run match analysis from master resume against the job.
- Show missing/found keywords and suggested keywords for confirmation.

### Job Object Shape

Each job should store enough state to reopen its modal safely:

```js
{
  id: "string",
  dateAdded: "iso datetime",
  company: "string",
  title: "string",
  url: "string",
  jdRaw: "string",
  status: "A Avaliar" | "Para Aplicar" | "Aplicado" | "Entrevista" | "Rejeitado" | "Oferta",
  analysisData: null,
  keywordSelection: [],
  isProcessing: false,
  processingError: null,
  resumes: []
}
```

### Tailored Resume Version Shape

```js
{
  id: "string",
  dateCreated: "iso datetime",
  name: "Versao 1",
  selectedLayout: "professional",
  data: {
    professional: {},
    heritage: {}
  },
  latex: {
    professional: "string",
    heritage: "string"
  },
  analysis: null,
  boostedKeywords: "comma separated string",
  coverLetter: null
}
```

If the backend initially returns only a single resume object, the frontend should normalize it to both layouts using the existing `normalizeGeneratedResumes` helper.

## Background Modal Behavior

When the user confirms keywords:

1. Update the job with:
   - `isProcessing: true`
   - `processingError: null`
   - `keywordSelection`
2. Close the modal if the user chooses.
3. Keep the request running in the current tab.
4. When the request resolves:
   - Append a resume version to the job.
   - Set `isProcessing: false`.
   - Set `status: "Para Aplicar"` if the job is still in the initial state.
5. When the request fails:
   - Set `isProcessing: false`.
   - Set `processingError` to a user-readable message.

If the job modal is opened while `isProcessing` is true, it should show the loading state. This loading state is based on saved job state, not on whether the original modal component is still mounted.

If the page refreshes while `isProcessing` is true, the request is gone. On reload, the UI should not pretend it is still actually processing. It can either:

- reset stale processing jobs to `processingError: "Geracao interrompida por recarregamento da pagina."`, or
- show a retry state for jobs that were marked processing but have no active in-memory request.

The simpler first implementation should reset stale processing jobs to a retryable error on app load.

## Tailored Resume Result Modal

When a resume version exists, the job modal should support:

- Resume preview.
- Layout toggle between Professional and Heritage.
- Manual field editing.
- AI field refinement.
- CV-as-code JSON export.
- LaTeX view/copy if available.
- Browser print to PDF.
- Cover letter generation using the tailored resume and saved job description.
- Delete resume version.

The existing `WizardStepResult`, `CoverLetterPanel`, `AtsBasicTheme`, and `HeritageTheme` should be reused where practical, but the job modal needs state updates that write back into `ats_job_pipeline`.

## Backend Endpoints

### Existing Endpoints To Keep

- `POST /api/analyze`
- `POST /api/generate`
- `POST /api/suggest-keywords`
- `POST /api/refine`
- `POST /api/cover-letter`

### Endpoints To Adjust Or Add

`POST /api/generate-master`

- Accepts PDF/DOCX resume, optional career focus, rewrite level, language, and model.
- Returns structured resume data for the master resume.
- Does not calculate match score.

`POST /api/analyze-master`

- If no job description is provided, returns ATS-only analysis with match fields null.
- If a job description is provided, can return match fields for keyword confirmation in the pipeline.
- Must use the same schema, but the prompt should explicitly follow the no-match behavior for master-only analysis.

`POST /api/tailor-resume`

- Accepts master resume JSON, job description, confirmed keywords, language, and model.
- Returns generated resume data and preferably LaTeX for both layouts.
- Must preserve candidate truth and only emphasize supported experience.

`POST /api/extract-job`

- Accepts URL.
- Fetches page HTML.
- Extracts light text.
- Uses AI to return company, title, and description.
- For blocked sites, returns an error that asks the user to paste text manually.

## Error Handling

- Missing master resume: pipeline blocks tailoring and directs user to create a master resume.
- URL extraction failure: keep job form open with manual paste option.
- AI failure during tailoring: save `processingError` on the job and show retry.
- Invalid JSON manual edit: block save and show syntax error.
- Stale processing state after refresh: convert to retryable error.

## Testing

Frontend tests should cover:

- Job pipeline storage helpers: add, update, add resume, delete resume, reset stale processing.
- Resume payload normalization for single-layout and dual-layout responses.
- Pipeline behavior that keeps a job marked processing when the modal closes.
- Result editing writes back to the matching job/resume version.

Backend tests should cover source-level or unit-level behavior already used in the project:

- Provider headers/model routing remain wired for new endpoints.
- Master generation prompt does not include match scoring requirements.
- Tailor endpoint accepts master JSON rather than file upload.
- Extract-job rejects or handles blocked URLs with a useful error.

Manual verification should cover:

- Existing wizard still works.
- Create master from PDF/DOCX.
- Edit master manually and with AI.
- Add Gupy-like job URL.
- Confirm keywords and close modal.
- Reopen modal while generation is running and see loading.
- See generated resume after completion.
- Switch Professional/Heritage.
- Print to PDF.
- Generate cover letter.

## Open Decisions Resolved

- Durable backend jobs are not included.
- Browser refresh/close during generation is allowed to lose in-flight work.
- Each person uses their own browser-stored API keys.
- No login or shared database in this version.
