import { Elysia, t } from "elysia";
import { GeminiResponseSchema, AnalysisResponseSchema } from "./schemas/resumeSchema";
import { formatResumeToLatex, formatCoverLetterToLatex } from "./services/latexService";
import { getComboContext, getPublicCombos } from "./data/careerCombos";
import { cors } from "@elysiajs/cors";
import { resolve, extname } from "path";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const DEFAULT_GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const DEFAULT_OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const DEFAULT_ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const DEFAULT_AI_MODEL = "gemini-2.5-flash";

if (!DEFAULT_GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY is not set in the environment variables!");
}

function getGenAI(requestKey?: string | null) {
  const key = requestKey?.trim() || DEFAULT_GEMINI_API_KEY;
  if (!key) throw new Error("Gemini API key not configured");
  return new GoogleGenerativeAI(key);
}

const getOpenAI = (key?: string) => {
  const k = key?.trim() || DEFAULT_OPENAI_API_KEY;
  if (!k) return null;
  return new OpenAI({ apiKey: k });
};

const getAnthropic = (key?: string) => {
  const k = key?.trim() || DEFAULT_ANTHROPIC_API_KEY;
  if (!k) return null;
  return new Anthropic({ apiKey: k });
};

type ProviderName = "gemini" | "openai" | "anthropic";
type RequestKeys = { gemini?: string | null; openai?: string | null; anthropic?: string | null };

function getHeaderValue(headers: Record<string, string | undefined>, name: string): string | null {
  return headers[name]?.trim() || null;
}

function getRequestKeys(headers: Record<string, string | undefined>): RequestKeys {
  return {
    gemini: getHeaderValue(headers, "x-api-key"),
    openai: getHeaderValue(headers, "x-openai-key"),
    anthropic: getHeaderValue(headers, "x-anthropic-key")
  };
}

function getProviderForModel(modelId: string): ProviderName {
  if (modelId.startsWith("gpt-")) return "openai";
  if (modelId.startsWith("claude-")) return "anthropic";
  return "gemini";
}

async function fileToBase64(file?: File | null): Promise<{ data: string; mimeType: string } | null> {
  if (!file) return null;
  return {
    data: Buffer.from(await file.arrayBuffer()).toString("base64"),
    mimeType: file.type || "application/octet-stream"
  };
}

function stripCodeFences(text: string): string {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

function parseJsonFromModel(text: string): any {
  const cleaned = stripCodeFences(text);
  const candidates = [
    cleaned,
    cleaned.match(/\[[\s\S]*\]/)?.[0],
    cleaned.match(/\{[\s\S]*\}/)?.[0]
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next plausible JSON fragment.
    }
  }

  throw new Error("Model response was not valid JSON");
}

function getAnthropicText(res: Anthropic.Messages.Message): string {
  return res.content
    .map((block: any) => block?.type === "text" ? block.text : "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function generateTextWithSelectedModel(options: {
  modelId?: string | null;
  keys: RequestKeys;
  system?: string;
  userText: string;
  imageFile?: File | null;
  maxTokens?: number;
  asJson?: boolean;
  geminiSchema?: any;
  temperature?: number;
}): Promise<string> {
  const modelId = options.modelId || DEFAULT_AI_MODEL;
  const provider = getProviderForModel(modelId);
  const image = await fileToBase64(options.imageFile);

  if (provider === "gemini") {
    const generationConfig: any = {
      temperature: options.temperature ?? 0.2,
      ...(options.asJson ? { responseMimeType: "application/json" } : {}),
      ...(options.geminiSchema ? { responseSchema: options.geminiSchema } : {})
    };
    const model = getGenAI(options.keys.gemini).getGenerativeModel({ model: modelId, generationConfig });
    const parts: any[] = [];
    if (image) parts.push({ inlineData: { data: image.data, mimeType: image.mimeType } });
    parts.push(`${options.system ? `${options.system}\n\n` : ""}${options.userText}`);
    const result = await model.generateContent(parts);
    return result.response.text().trim();
  }

  if (provider === "openai") {
    const openai = getOpenAI(options.keys.openai);
    if (!openai) throw new Error("OpenAI API key not configured");
    const userContent: any = image
      ? [
          { type: "text", text: options.userText },
          { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.data}` } }
        ]
      : options.userText;
    const messages: any[] = [
      ...(options.system ? [{ role: "system", content: options.system }] : []),
      { role: "user", content: userContent }
    ];
    const res = await openai.chat.completions.create({
      model: modelId,
      messages,
      ...(options.asJson ? { response_format: { type: "json_object" as const } } : {})
    });
    return res.choices[0]?.message?.content?.trim() || "";
  }

  const anthropic = getAnthropic(options.keys.anthropic);
  if (!anthropic) throw new Error("Anthropic API key not configured");
  const content: any = image
    ? [
        { type: "image", source: { type: "base64", media_type: image.mimeType, data: image.data } },
        { type: "text", text: options.userText }
      ]
    : options.userText;
  const res = await anthropic.messages.create({
    model: modelId,
    max_tokens: options.maxTokens || 4096,
    ...(options.system ? { system: options.system } : {}),
    messages: [{ role: "user", content }]
  });
  return getAnthropicText(res);
}

async function generateJsonWithSelectedModel(options: Parameters<typeof generateTextWithSelectedModel>[0]): Promise<any> {
  const text = await generateTextWithSelectedModel({ ...options, asJson: true });
  return parseJsonFromModel(text);
}

function coerceArrayPayload(payload: any, keys: string[]): any[] {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  const nestedArray = Object.values(payload || {}).find(Array.isArray);
  if (Array.isArray(nestedArray)) return nestedArray;
  throw new Error("Model response did not contain a JSON array");
}

async function extractResumeText(resume: File, set: any): Promise<string | null> {
  if (resume && resume.type === "application/pdf") {
    const arrayBuffer = await resume.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parser = new PDFParse({ data: buffer });
    const pdfData = await parser.getText();
    return pdfData.text;
  } else if (resume && (resume.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || resume.name.endsWith(".docx"))) {
    const arrayBuffer = await resume.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else {
    set.status = 400;
    return null;
  }
}

// PROMPTS
const ANALYSIS_SYSTEM_PROMPT = `
Você é o motor de análise de currículos de uma plataforma de recrutamento de nível enterprise.
Sua função é executar DUAS análises SEPARADAS e INDEPENDENTES.

═══════════════════════════════════════════════════
## ANÁLISE 1: ATS SCORE (0 a 100 pontos)
═══════════════════════════════════════════════════

O ATS Score é composto por DUAS CAMADAS. Some os pontos de cada camada.

### CAMADA A — PARSEABILIDADE DO LAYOUT (máximo 60 pontos)
Avalia se o ATS conseguirá LER o currículo.
Comece com 60 e SUBTRAIA:

| Problema | Penalização |
|----------|-------------|
| Layout em DUAS COLUNAS ou mais | -30 pts |
| SIDEBAR com informações | -25 pts |
| FOTO/IMAGEM do candidato | -15 pts |
| Tabelas ou caixas de texto | -10 pts |
| Ícones ou elementos gráficos decorativos | -5 pts |

REGRA: Layout limpo, 1 coluna, sem gráficos → 60/60.

### CAMADA B — QUALIDADE DO CONTEÚDO ATS (máximo 40 pontos)
Comece com 0 e SOME conforme o que está presente:

| Critério | Pontos |
|----------|--------|
| Seção de Experiência com cargo + empresa/contexto + datas | +12 pts |
| Bullet points com resultados mensuráveis (números, %, métricas) | +8 pts |
| Resumo/Objetivo profissional com keywords relevantes | +7 pts |
| Contato completo (email + telefone) | +3 pts |
| Skills categorizadas e específicas | +4 pts |
| Verbos de ação no início dos bullet points | +4 pts |
| Formatação consistente e hierarquia clara | +2 pts |

Notas:
- Projetos pessoais bem descritos com tecnologias e resultados contam como experiência (até +10 dos 12 pts).
- Se NÃO há métricas mas os bullet points são descritivos e específicos, conceda até +4 dos 8 pts.
- Se o candidato não tem experiência formal (só projetos/acadêmico), a Camada B pode chegar até 28/40.

atsScore = Camada A + Camada B

### probability:
- "Alta" se atsScore >= 80
- "Média" se atsScore >= 55
- "Baixa" se atsScore < 55

Retorne também atsBreakdown com os valores de cada camada.

═══════════════════════════════════════════════════
## ANÁLISE 2: MATCH SCORE (0 a 100 pontos)
═══════════════════════════════════════════════════

⚠️ Se uma vaga foi fornecida, matchScore DEVE ser um número (0-100). NUNCA null.
⚠️ Se NÃO há vaga ("Não fornecida"), retorne null.

### CRITÉRIOS DE PONTUAÇÃO (pesos indicativos):
- **Keywords da vaga** (~30%): Quantas keywords relevantes da vaga aparecem no CV?
- **Experiência na área** (~25%): O candidato demonstra experiência prática (profissional ou projetos relevantes) na área da vaga?
- **Ferramentas e tecnologias** (~20%): As tecnologias/frameworks do CV coincidem com a vaga?
- **Nível de senioridade** (~10%): O perfil do candidato é compatível com o nível da vaga?
- **Formação** (~10%): A formação é relevante?
- **Soft skills** (~5%): Há soft skills alinhadas com a cultura da empresa?

### CALIBRAÇÃO (referência para consistência):
- Profissional experiente + keywords + tech certas = **80-95**
- Profissional com 2-3 anos + boa cobertura = **60-75**
- Recém-formado com tech certas + projetos relevantes = **45-60**
- Área diferente da vaga = **10-30**

### matchGrade:
Atribua uma nota final (A, B, C, D ou F) baseada na compatibilidade:
- A (Excepcional): 90-100
- B (Forte): 75-89
- C (Moderado): 60-74
- D (Fraco): 40-59
- F (Inadequado): 0-39

### missingQualifications:
Liste explicitamente 1 a 3 qualificações críticas exigidas pela vaga que o candidato NÃO possui. Se for aderente, liste como vazio ou omitido.

### matchAnalysis:
Escreva um RESUMO BREVE (2-3 frases) sobre a compatibilidade geral. NÃO detalhe a pontuação critério por critério.

═══════════════════════════════════════════════════
## OUTPUT JSON
═══════════════════════════════════════════════════

{
  "atsScore": number,
  "atsBreakdown": {
    "parseability": number,
    "contentQuality": number
  },
  "probability": "Alta" | "Média" | "Baixa",
  "screeningReason": "breve explicação do score ATS",
  "matchScore": number | null,
  "matchGrade": "A" | "B" | "C" | "D" | "F" | null,
  "matchAnalysis": "resumo breve da compatibilidade (2-3 frases) | null",
  "missingQualifications": ["O que está faltando no currículo para esta vaga"] | null,
  "foundKeywords": ["keywords da vaga encontradas no CV"],
  "missingKeywords": ["keywords da vaga NÃO encontradas no CV"],
  "strengths": [{ "title": "string", "description": "string" }],
  "keywordOps": ["oportunidades de melhoria"],
  "tips": ["dicas práticas"]
}
`;

const MASTER_RESUME_SYSTEM_PROMPT = `
You are the master resume engine for an ATS resume platform.

Your job is to convert the candidate's original resume into a structured master resume.
This is NOT a job-specific compatibility task. Do not calculate vacancy fit or ranking.

Rules:
- Preserve every real role, company, project, education item, date, tool, and skill that is supported by the source resume.
- Do not invent employers, titles, certifications, technologies, metrics, seniority, degrees, or achievements.
- Improve clarity, ATS readability, grammar, structure, and section organization.
- Use stronger action verbs only when they remain faithful to the original work.
- If a career focus is provided, tune vocabulary toward that focus without changing the candidate truth.
- Return only valid JSON matching the requested resume schema.
`;

const LEVEL_INSTRUCTIONS: Record<string, { name: string; focus: string; actions: string }> = {
  conservative: { name: "CONSERVADOR", focus: "Polimento", actions: "Corrigir gramática, padronizar formato." },
  balanced: { name: "EQUILIBRADO", focus: "Reescrita estratégica", actions: "Reescrever resumo, bullet points com verbos de ação, inserir keywords." },
  aggressive: { name: "AGRESSIVO", focus: "Transformação orientada a conversão", actions: "Reescrever tudo com tom persuasivo, maximizar keywords." }
};

const COVER_LETTER_SYSTEM_PROMPT = `Escreva uma Carta de Apresentação persuasiva focada no fit de valor. Retorne apenas o texto final.`;

// Gemini Schemas
const experienceSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      role: { type: SchemaType.STRING },
      company: { type: SchemaType.STRING },
      date: { type: SchemaType.STRING },
      location: { type: SchemaType.STRING },
      responsibilities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
    },
    required: ["role", "company", "date", "location", "responsibilities"]
  }
};

const commonResumeProperties = {
  language: { type: SchemaType.STRING },
  name: { type: SchemaType.STRING },
  title: { type: SchemaType.STRING },
  email: { type: SchemaType.STRING },
  phone: { type: SchemaType.STRING },
  address: { type: SchemaType.STRING },
  summary: { type: SchemaType.STRING },
  experience: experienceSchema,
  education: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { degree: { type: SchemaType.STRING }, institution: { type: SchemaType.STRING }, date: { type: SchemaType.STRING }, location: { type: SchemaType.STRING } }, required: ["degree", "institution", "date", "location"] } },
  skillsGroup: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { category: { type: SchemaType.STRING }, items: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } } }, required: ["category", "items"] } }
};

const professionalResumeSchema = { type: SchemaType.OBJECT, properties: commonResumeProperties, required: ["language", "name", "title", "email", "phone", "address", "summary", "experience", "education", "skillsGroup"] };
const heritageResumeSchema = { type: SchemaType.OBJECT, properties: { ...commonResumeProperties, links: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { url: { type: SchemaType.STRING }, label: { type: SchemaType.STRING } }, required: ["url", "label"] } }, projects: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { name: { type: SchemaType.STRING }, description: { type: SchemaType.STRING }, technologies: { type: SchemaType.STRING }, url: { type: SchemaType.STRING } }, required: ["name", "description", "technologies", "url"] } } }, required: ["language", "name", "title", "email", "phone", "address", "summary", "experience", "education", "skillsGroup", "links", "projects"] };

const DIST_DIR = resolve(import.meta.dir, "../../frontend/dist");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".webp": "image/webp",
};

const app = new Elysia()
  .use(cors())
  .get("/assets/*", ({ params }) => {
    const filePath = resolve(DIST_DIR, "assets", params["*"]);
    const ext = extname(filePath);
    return new Response(Bun.file(filePath), { headers: { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" } });
  })
  .get("/favicon.svg", () => Bun.file(resolve(DIST_DIR, "favicon.svg")))
  .get("/icons.svg", () => Bun.file(resolve(DIST_DIR, "icons.svg")))

  // Career Combos — lista de setores disponíveis
  .get("/api/career-combos", () => {
    return { success: true, combos: getPublicCombos() };
  })

  .post("/api/analyze", async ({ body, set, headers }) => {
    try {
      const { resume, jobDescriptionText, jobDescriptionFile, careerCombo } = body;
      const keys = getRequestKeys(headers as Record<string, string | undefined>);
      const resumeText = await extractResumeText(resume, set);
      if (!resumeText) return { error: "Currículo inválido." };

      const comboContext = getComboContext(careerCombo);

      const modelId = body.modelId || DEFAULT_AI_MODEL;
      const isOpenAI = modelId.startsWith('gpt-');
      const isClaude = modelId.startsWith('claude-');

      if (isOpenAI || isClaude) {
        const hasJobImage = jobDescriptionFile && jobDescriptionFile.type.startsWith("image/");
        const jobContext = jobDescriptionText || (hasJobImage ? "Extract the job description from the attached image." : "Not provided");
        const analysis = await generateJsonWithSelectedModel({
          modelId,
          keys,
          temperature: 0.1,
          maxTokens: 4096,
          imageFile: hasJobImage ? jobDescriptionFile : null,
          system: `${ANALYSIS_SYSTEM_PROMPT}\n\n${comboContext}\n\nIDIOMA DA ANALISE: ${body.language || 'Portugues (BR)'}`,
          userText: `CURRICULO:\n${resumeText}\n\nVAGA:\n${jobContext}\n\nReturn only valid JSON.`
        });
        return { success: true, data: AnalysisResponseSchema.parse(analysis) };
      }

      const runGemini = async () => {
        const model = getGenAI(keys.gemini).getGenerativeModel({ 
          model: modelId, 
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" } 
        });
        const contents: any[] = [];
        const hasJobImage = jobDescriptionFile && jobDescriptionFile.type.startsWith('image/');
        if (hasJobImage) {
          contents.push({ inlineData: { data: Buffer.from(await jobDescriptionFile.arrayBuffer()).toString("base64"), mimeType: jobDescriptionFile.type } });
        }
        let jobContext = jobDescriptionText || (hasJobImage ? "Extraia texto da imagem para análise." : "Não fornecida");
        contents.push(`${ANALYSIS_SYSTEM_PROMPT}\n\nIDIOMA DA ANÁLISE: ${body.language || 'Português (BR)'}\n\n${comboContext}\n\nCURRÍCULO:\n${resumeText}\n\nVAGA:\n${jobContext}`);
        const result = await model.generateContent(contents);
        return JSON.parse(result.response.text().trim());
      };

      const runOpenAI = async () => {
        const openai = getOpenAI(keys.openai);
        if (!openai) throw new Error("OpenAI not set");
        const res = await openai.chat.completions.create({ 
          model: modelId, 
          messages: [
            { role: "system", content: `${ANALYSIS_SYSTEM_PROMPT}\n\n${comboContext}\n\nIDIOMA DA ANÁLISE: ${body.language || 'Português (BR)'}` }, 
            { role: "user", content: `CURRÍCULO:\n${resumeText}\nVAGA:\n${jobDescriptionText || "Não fornecida"}` }
          ], 
          response_format: { type: "json_object" } 
        });
        return JSON.parse(res.choices[0].message.content || "{}");
      };

      const runClaude = async () => {
        const anthropic = getAnthropic(keys.anthropic);
        if (!anthropic) throw new Error("Anthropic not set");
        const res = await anthropic.messages.create({
          model: modelId,
          max_tokens: 4096,
          system: `${ANALYSIS_SYSTEM_PROMPT}\n\n${comboContext}\n\nIDIOMA DA ANÁLISE: ${body.language || 'Português (BR)'}`,
          messages: [{ role: "user", content: `Analise este currículo em relação à vaga fornecida e retorne APENAS o JSON.\n\nCURRÍCULO:\n${resumeText}\n\nVAGA:\n${jobDescriptionText || "Não fornecida"}` }]
        });
        const text = (res.content[0] as any).text;
        return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || text);
      };

      let analysis;
      if (isClaude) analysis = await runClaude();
      else if (isOpenAI) analysis = await runOpenAI();
      else analysis = await runGemini();

      return { success: true, data: AnalysisResponseSchema.parse(analysis) };
    } catch (e: any) { 
      console.error("💥 ERRO CRÍTICO NA ANÁLISE:", e);
      set.status = 500; 
      return { 
        error: "Erro interno no servidor durante a análise.",
        details: e.message || "Erro desconhecido"
      }; 
    }
  }, { body: t.Object({ resume: t.File(), jobDescriptionText: t.Optional(t.String()), jobDescriptionFile: t.Optional(t.File()), careerCombo: t.Optional(t.String()), language: t.Optional(t.String()), modelId: t.Optional(t.String()) }) })

  .post("/api/suggest-keywords", async ({ body, set, headers }) => {
    try {
      const { resumeText, jobDescription, missingKeywords, careerCombo } = body;
      const keys = getRequestKeys(headers as Record<string, string | undefined>);
      const comboContext = getComboContext(careerCombo);
      const systemPrompt = `Você é um especialista em ATS (Applicant Tracking Systems) e otimização de currículos.
Analise o currículo e a vaga fornecidos. Identifique palavras-chave e expressões que o candidato deveria incluir no currículo para aumentar a compatibilidade com a vaga.

${comboContext}

Retorne um JSON array com objetos no seguinte formato EXATO:
[
  {
    "keyword": "Nome da palavra-chave ou expressão",
    "priority": "high" | "medium" | "low",
    "category": "hard_skill" | "soft_skill" | "tool" | "methodology" | "certification" | "domain",
    "reason": "Explicação breve de por que esta keyword é importante para a vaga"
  }
]

Regras:
- Prioridade "high": keywords que aparecem explicitamente na vaga e estão ausentes no currículo
- Prioridade "medium": keywords inferidas da vaga ou do setor${comboContext ? ' (PRIORIZE as keywords do setor informado acima)' : ''}
- Prioridade "low": keywords complementares que agregam valor
- Retorne entre 15 e 40 keywords
- Inclua uma mistura de categorias
- O campo "reason" deve ter no máximo 2 frases
${comboContext ? '- Keywords genéricas de soft skills devem representar NO MÁXIMO 15-20% do total\n- PRIORIZE ferramentas, certificações e termos técnicos do setor informado' : ''}
- Retorne APENAS o JSON array, sem markdown, sem explicações adicionais`;
      const modelId = body.modelId || DEFAULT_AI_MODEL;
      const text = await generateTextWithSelectedModel({
        modelId,
        keys,
        temperature: 0.3,
        maxTokens: 2048,
        system: systemPrompt,
        userText: `IDIOMA PARA AS SUGESTÕES: ${body.language || 'Português (BR)'}

CURRÍCULO DO CANDIDATO:
${resumeText}

DESCRIÇÃO DA VAGA:
${jobDescription || "Não fornecida"}

KEYWORDS FALTANTES IDENTIFICADAS NA ANÁLISE:
${missingKeywords || "Nenhuma"}

Retorne APENAS o JSON array, sem markdown.`
      });
      return { success: true, suggestions: coerceArrayPayload(parseJsonFromModel(text), ["suggestions", "keywords"]) };
    } catch (e) { console.error(e); set.status = 500; return { error: "Erro keywords." }; }
  }, { body: t.Object({ resumeText: t.String(), jobDescription: t.Optional(t.String()), missingKeywords: t.Optional(t.String()), careerCombo: t.Optional(t.String()), language: t.Optional(t.String()), modelId: t.Optional(t.String()) }) })

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

  .post("/api/generate", async ({ body, set, headers }) => {
    try {
      const { resume, jobDescriptionText, level, boostedKeywords, careerCombo, language } = body;
      const keys = getRequestKeys(headers as Record<string, string | undefined>);
      const resumeText = await extractResumeText(resume, set);
      const levelInfo = LEVEL_INSTRUCTIONS[level || "balanced"];
      const comboContext = getComboContext(careerCombo);
      const prompt = `Gere currículo professional e heritage em JSON no idioma ${language || 'Português (BR)'}. 
Nível de Intervenção: ${levelInfo.name} (${levelInfo.focus}).
Instrução Importante: PRESERVE todos os cargos e projetos do currículo original. Para CADA cargo/projeto, gere OBRIGATORIAMENTE de 3 a 4 bullet points LONGOS e DETALHADOS. Nunca resuma demais a experiência. Cada bullet point deve ter profundidade técnica e seguir a estrutura: [Verbo de Ação] + [Contexto/Tecnologia] + [Resultado/Propósito] (ex: "Liderou o ciclo completo de desenvolvimento de quatro aplicações web, desde a concepção até a implantação, garantindo entregas de valor..."). Incorpore as keywords de forma natural e honesta.

Keywords a Otimizar: ${boostedKeywords}. 
Setor: ${comboContext ? comboContext : 'Geral'}.

CONTEÚDO ORIGINAL DO CV: 
${resumeText}

DESCRIÇÃO DA VAGA: 
${jobDescriptionText || 'Não fornecida'}`;

      const modelId = body.modelId || DEFAULT_AI_MODEL;
      const isOpenAI = modelId.startsWith('gpt-');
      const isClaude = modelId.startsWith('claude-');

      const runGemini = async () => {
        const model = getGenAI(keys.gemini).getGenerativeModel({ model: modelId, generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: { type: SchemaType.OBJECT, properties: { professional: professionalResumeSchema, heritage: heritageResumeSchema }, required: ["professional", "heritage"] } } });
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
      };

      const runOpenAI = async () => {
        const openai = getOpenAI(keys.openai);
        if (!openai) throw new Error("OpenAI not set");
        const res = await openai.chat.completions.create({ 
          model: modelId, 
          messages: [{ role: "user", content: prompt }], 
          response_format: { type: "json_object" } 
        });
        return JSON.parse(res.choices[0].message.content || "{}");
      };

      const runClaude = async () => {
        const anthropic = getAnthropic(keys.anthropic);
        if (!anthropic) throw new Error("Anthropic not set");
        const res = await anthropic.messages.create({
          model: modelId,
          max_tokens: 4096,
          messages: [{ role: "user", content: `Gere o currículo otimizado no formato JSON conforme solicitado abaixo:\n\n${prompt}` }]
        });
        const text = (res.content[0] as any).text;
        return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || text);
      };

      const data = isClaude ? await runClaude() : (isOpenAI ? await runOpenAI() : await runGemini());
      const validated = GeminiResponseSchema.parse(data);
      const latex = { professional: formatResumeToLatex(validated.professional as any), heritage: formatResumeToLatex(validated.heritage as any) };

      // Optional Post-analysis
      let postAnalysis = null;
      try {
        const analysis = await generateJsonWithSelectedModel({
          modelId,
          keys,
          temperature: 0.1,
          maxTokens: 4096,
          system: `${ANALYSIS_SYSTEM_PROMPT}\n\n${comboContext}`,
          userText: `IDIOMA DA ANÁLISE: ${body.language || 'Português (BR)'}

IMPORTANTE: O campo matchScore DEVE ser preenchido com um número de 0 a 100. NUNCA retorne null para matchScore quando uma vaga foi fornecida.

CURRÍCULO GERADO:
${JSON.stringify(validated.professional)}

VAGA:
${jobDescriptionText || "Não fornecida"}

Retorne APENAS JSON válido.`
        });
        postAnalysis = AnalysisResponseSchema.parse(analysis);
      } catch (e) { console.error("Post-analysis error:", e); }

      return { success: true, data: validated, latex, postAnalysis };
    } catch (e) { console.error(e); set.status = 500; return { error: "Erro geração." }; }
  }, { body: t.Object({ resume: t.File(), jobDescriptionText: t.Optional(t.String()), jobDescriptionFile: t.Optional(t.File()), level: t.Optional(t.String()), boostedKeywords: t.Optional(t.String()), careerCombo: t.Optional(t.String()), language: t.Optional(t.String()), modelId: t.Optional(t.String()) }) })

  .post("/api/cover-letter", async ({ body, set, headers }) => {
    try {
      const { resumeText, jobDescription, language } = body;
      const keys = getRequestKeys(headers as Record<string, string | undefined>);
      const text = await generateTextWithSelectedModel({
        modelId: body.modelId || DEFAULT_AI_MODEL,
        keys,
        maxTokens: 2048,
        system: COVER_LETTER_SYSTEM_PROMPT,
        userText: `IDIOMA: ${language || "Português (BR)"}\nCV:\n${resumeText}\nVaga:\n${jobDescription || "Não fornecida"}`
      });
      return { success: true, text, latex: formatCoverLetterToLatex(text, true) };
    } catch (e) { set.status = 500; return { error: "Erro cover letter." }; }
  }, { body: t.Object({ resumeText: t.String(), jobDescription: t.Optional(t.String()), language: t.Optional(t.String()), modelId: t.Optional(t.String()) }) })

  .post("/api/refine", async ({ body, set, headers }) => {
    try {
      const { text, jobDescription, instruction } = body;
      const keys = getRequestKeys(headers as Record<string, string | undefined>);
      const refined = await generateTextWithSelectedModel({
        modelId: body.modelId || DEFAULT_AI_MODEL,
        keys,
        maxTokens: 2048,
        userText: `Refine este trecho de currículo: ${text}. Vaga: ${jobDescription || "Não fornecida"}. Instrução: ${instruction || "Melhore clareza, impacto e aderência à vaga."}`
      });
      return { success: true, text: refined };
    } catch (e) { set.status = 500; return { error: "Erro refino." }; }
  }, { body: t.Object({ text: t.String(), jobDescription: t.Optional(t.String()), instruction: t.Optional(t.String()), modelId: t.Optional(t.String()) }) })

  .post("/api/tailor-resume", async ({ body, set, headers }) => {
    try {
      const { resume, jobDescription, careerCombo, language, boostedKeywords } = body;
      const keys = getRequestKeys(headers as Record<string, string | undefined>);
      const comboContext = getComboContext(careerCombo);
      
      const prompt = `Você é um especialista em ATS. Seu objetivo é adaptar um currículo mestre para uma vaga específica.
MANTENHA todas as experiências, formações e projetos originais. Para cada experiência, você DEVE gerar de 3 a 4 bullet points LONGOS e DETALHADOS, exatamente como um profissional sênior escreveria. NUNCA resuma demais as informações.
Cada bullet point deve demonstrar profundidade técnica, usando a estrutura: [Verbo de Ação] + [Contexto/Tecnologias] + [Resultado/Propósito]. Reescreva-os para destacar ao máximo as tecnologias exigidas pela vaga abaixo, sendo honesto.

${boostedKeywords ? `\nINSTRUÇÃO CRÍTICA: Você DEVE incluir as seguintes palavras-chave no currículo (no resumo ou nas experiências): ${boostedKeywords}\n` : ''}

IDIOMA: ${language || 'Português (BR)'}
VAGA:
${jobDescription}

CURRÍCULO MESTRE:
${JSON.stringify(resume)}

Retorne APENAS JSON valido no formato:
{
  "professional": ProfessionalResumeSchema,
  "heritage": HeritageResumeSchema
}`;

      const modelId = body.modelId || DEFAULT_AI_MODEL;
      const json = await generateJsonWithSelectedModel({
        modelId,
        keys,
        temperature: 0.2,
        maxTokens: 4096,
        userText: prompt
      });

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
    } catch (e) {
      console.error(e);
      set.status = 500;
      return { error: "Erro ao adaptar currículo." };
    }
  }, { body: t.Object({ resume: t.Any(), jobDescription: t.String(), careerCombo: t.Optional(t.String()), language: t.Optional(t.String()), boostedKeywords: t.Optional(t.String()), modelId: t.Optional(t.String()) }) })

  .post("/api/extract-job", async ({ body, set, headers }) => {
    try {
      const { url, modelId } = body;
      const keys = getRequestKeys(headers as Record<string, string | undefined>);
      
      if (url.includes('linkedin.com')) {
        set.status = 400;
        return { error: "LinkedIn bloqueia extração automatizada. Por favor, cole o texto manualmente." };
      }

      // 1. Fetch HTML
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Falha ao acessar o site: ${res.status} ${res.statusText}`);
      }
      
      const html = await res.text();
      
      // 2. Strip script, style, and html tags
      const cleanText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s\s+/g, ' ')
        .substring(0, 15000); // limit payload size

      // 3. Ask AI to extract metadata and Job Description
      const prompt = `Você é um extrator de dados inteligente. Abaixo está o texto bruto extraído de uma página web de vagas de emprego.
Por favor, identifique e extraia:
1. O NOME DA EMPRESA (ex: Google, Gupy, Localiza)
2. O CARGO DA VAGA (ex: Desenvolvedor Fullstack Sênior)
3. A DESCRIÇÃO COMPLETA DA VAGA (incluindo requisitos e responsabilidades)

TEXTO DO SITE:
${cleanText}

Retorne APENAS um JSON válido no formato:
{
  "company": "Nome da Empresa",
  "title": "Título da Vaga",
  "description": "Texto completo da descrição formatado com markdown"
}`;

      const aiModel = modelId || DEFAULT_AI_MODEL;
      const jsonResponse = await generateJsonWithSelectedModel({
        modelId: aiModel,
        keys,
        temperature: 0.1,
        maxTokens: 4096,
        userText: prompt
      });

      return { success: true, ...jsonResponse };
    } catch (e: any) {
      console.error("Erro na extração:", e);
      set.status = 500;
      return { error: e.message || "Erro interno ao tentar ler a URL da vaga." };
    }
  }, { body: t.Object({ url: t.String(), modelId: t.Optional(t.String()) }) })

  .post("/api/analyze-master", async ({ body, set, headers }) => {
    try {
      const { resumeJson, jobDescription, language, modelId } = body;
      const keys = getRequestKeys(headers as Record<string, string | undefined>);
      
      const resumeText = JSON.stringify(resumeJson, null, 2);
      
      const prompt = `Você é um motor de análise ATS. Faça uma leitura do seguinte currículo (em formato estruturado) e forneça o ATS Score base.
${jobDescription ? 'COMO UMA VAGA FOI FORNECIDA, você DEVE calcular o Match Score (0-100) e o matchGrade (A-F).' : 'Como não há vaga específica, o Match Score e matchGrade devem ser null.'}
      
IDIOMA: ${language || 'Português (BR)'}
CURRÍCULO:
${resumeText}

${jobDescription ? `VAGA:\n${jobDescription}\n` : ''}
Retorne APENAS um JSON válido no formato solicitado.`;

      const aiModel = modelId || DEFAULT_AI_MODEL;
      const json = await generateJsonWithSelectedModel({
        modelId: aiModel,
        keys,
        temperature: 0.1,
        maxTokens: 4096,
        system: ANALYSIS_SYSTEM_PROMPT,
        userText: prompt
      });

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
    } catch (e: any) {
      console.error("Erro na análise mestre:", e);
      set.status = 500;
      return { error: e.message || "Erro interno na análise ATS." };
    }
  }, { body: t.Object({ resumeJson: t.Any(), jobDescription: t.Optional(t.String()), language: t.Optional(t.String()), modelId: t.Optional(t.String()) }) })

  .get("*", () => Bun.file(resolve(DIST_DIR, "index.html")))
  .listen(process.env.PORT || 3000);

console.log(`🦊 Backend rodando em http://${app.server?.hostname}:${app.server?.port}`);
