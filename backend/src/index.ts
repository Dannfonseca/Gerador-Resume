import { Elysia, t } from "elysia";
import { GeminiResponseSchema, AnalysisResponseSchema } from "./schemas/resumeSchema";
import { formatResumeToLatex, formatCoverLetterToLatex } from "./services/latexService";
import { cors } from "@elysiajs/cors";
import { resolve, extname } from "path";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import OpenAI from "openai";
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const DEFAULT_GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const DEFAULT_OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

if (!DEFAULT_GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY is not set in the environment variables!");
}

function getGenAI(requestKey?: string | null) {
  const key = requestKey || DEFAULT_GEMINI_API_KEY;
  if (!key) console.error("❌ Erro: Nenhuma GEMINI_API_KEY encontrada!");
  else console.log("✅ Usando GEMINI_API_KEY (iniciada com: " + key.substring(0, 4) + "...)");
  return new GoogleGenerativeAI(key);
}

function getOpenAI(requestKey?: string | null) {
  const key = requestKey || DEFAULT_OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

async function withFallback<T>(
  geminiFn: () => Promise<T>,
  openaiFn: () => Promise<T>,
  hasOpenAIKey: boolean
): Promise<T> {
  try {
    return await geminiFn();
  } catch (error) {
    console.error("Gemini failed, trying fallback...", error);
    if (hasOpenAIKey || DEFAULT_OPENAI_API_KEY) {
      return await openaiFn();
    }
    throw error;
  }
}

async function extractResumeText(resume: File, set: any): Promise<string | null> {
  if (resume && resume.type === "application/pdf") {
    const arrayBuffer = await resume.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
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
Sua função é executar DUAS análises SEPARADAS e INDEPENDENTES:

## ANÁLISE 1: ATS SCORE (Compatibilidade Técnica com Sistemas ATS)
Esta análise avalia se o currículo será PARSEADO CORRETAMENTE por sistemas ATS.
IMPORTANTE: Sistemas ATS reais NÃO conseguem ler layouts complexos, duas colunas, fotos ou sidebars.

### PONTUAÇÃO BASE: Comece com 100 pontos e SUBTRAIA conforme problemas encontrados:

**PENALIZAÇÕES CRÍTICAS (layout que QUEBRA parsing do ATS):**
- Layout em DUAS COLUNAS ou mais: **-30 pontos**
- Possui FOTO/IMAGEM do candidato: **-15 pontos**
- SIDEBAR com informações: **-20 pontos**
- Tabelas ou caixas de texto: **-15 pontos**
- Ícones ou elementos gráficos decorativos: **-10 pontos**

**PENALIZAÇÕES MODERADAS (conteúdo subótimo):**
- Falta seção de Resumo/Objetivo: **-8 pontos**
- Falta seção de Experiência clara: **-10 pontos**
- Falta informações de contato (email/telefone): **-8 pontos**

REGRA DE OURO: Se o currículo tem LAYOUT EM DUAS COLUNAS ou SIDEBAR, o score NUNCA pode ser acima de 55.

## ANÁLISE 2: MATCH SCORE (Compatibilidade com a Vaga)
Retorne matchScore, matchAnalysis, foundKeywords e missingKeywords baseado na vaga.

OUTPUT JSON:
{
  "atsScore": number,
  "probability": "Alta" | "Média" | "Baixa",
  "screeningReason": "string",
  "matchScore": number | null,
  "matchAnalysis": "string | null",
  "foundKeywords": ["string"],
  "missingKeywords": ["string"],
  "strengths": [{ "title": "string", "description": "string" }],
  "keywordOps": ["string"],
  "tips": ["string"]
}
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
  ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".webp": "image/webp",
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

  .post("/api/analyze", async ({ body, set, headers }) => {
    try {
      const { resume, jobDescriptionText, jobDescriptionFile } = body;
      const requestGeminiKey = headers["x-api-key"];
      const requestOpenaiKey = headers["x-openai-key"];
      const resumeText = await extractResumeText(resume, set);
      if (!resumeText) return { error: "Currículo inválido." };

      const runGemini = async () => {
        const model = getGenAI(requestGeminiKey).getGenerativeModel({ 
          model: "gemini-1.5-flash-latest", 
          generationConfig: { 
            temperature: 0.1,
            responseMimeType: "application/json"
          } 
        });
        const contents: any[] = [];
        if (jobDescriptionFile && jobDescriptionFile.type.startsWith('image/')) {
          contents.push({ inlineData: { data: Buffer.from(await jobDescriptionFile.arrayBuffer()).toString("base64"), mimeType: jobDescriptionFile.type } });
        }
        contents.push(`${ANALYSIS_SYSTEM_PROMPT}\n\nCURRÍCULO:\n${resumeText}\n\nVAGA:\n${jobDescriptionText || "Não fornecida"}`);
        const result = await model.generateContent(contents);
        const text = result.response.text().trim();
        return JSON.parse(text);
      };

      const runOpenAI = async () => {
        const openai = getOpenAI(requestOpenaiKey);
        if (!openai) throw new Error("OpenAI not set");
        const res = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "system", content: ANALYSIS_SYSTEM_PROMPT }, { role: "user", content: `CURRÍCULO:\n${resumeText}\nVAGA:\n${jobDescriptionText || "Não fornecida"}` }], response_format: { type: "json_object" } });
        return JSON.parse(res.choices[0].message.content || "{}");
      };

      const analysis = await withFallback(runGemini, runOpenAI, !!requestOpenaiKey);
      return { success: true, data: AnalysisResponseSchema.parse(analysis) };
    } catch (e: any) { 
      console.error("💥 ERRO CRÍTICO NA ANÁLISE:", e);
      set.status = 500; 
      return { 
        error: "Erro interno no servidor durante a análise.",
        details: e.message || "Erro desconhecido"
      }; 
    }
  }, { body: t.Object({ resume: t.File(), jobDescriptionText: t.Optional(t.String()), jobDescriptionFile: t.Optional(t.File()) }) })

  .post("/api/suggest-keywords", async ({ body, set, headers }) => {
    try {
      const { resumeText, jobDescription, missingKeywords } = body;
      const requestGeminiKey = headers["x-api-key"];
      const systemPrompt = `Sugira keywords ATS. Retorne JSON array.`;
      const model = getGenAI(requestGeminiKey).getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const result = await model.generateContent(`${systemPrompt}\nCV: ${resumeText}\nVaga: ${jobDescription}\nFaltantes: ${missingKeywords}`);
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const match = text.match(/\[[\s\S]*\]/);
      return { success: true, suggestions: JSON.parse(match ? match[0] : text) };
    } catch (e) { set.status = 500; return { error: "Erro keywords." }; }
  }, { body: t.Object({ resumeText: t.String(), jobDescription: t.Optional(t.String()), missingKeywords: t.Optional(t.String()) }) })

  .post("/api/generate", async ({ body, set, headers }) => {
    try {
      const { resume, jobDescriptionText, level, boostedKeywords } = body;
      const requestGeminiKey = headers["x-api-key"];
      const requestOpenaiKey = headers["x-openai-key"];
      const resumeText = await extractResumeText(resume, set);
      const levelInfo = LEVEL_INSTRUCTIONS[level || "balanced"];
      const prompt = `Gere currículo professional e heritage em JSON. Nível: ${levelInfo.name}. Keywords: ${boostedKeywords}. CV: ${resumeText}. Vaga: ${jobDescriptionText}`;

      const runGemini = async () => {
        const model = getGenAI(requestGeminiKey).getGenerativeModel({ model: "gemini-1.5-flash-latest", generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: { type: SchemaType.OBJECT, properties: { professional: professionalResumeSchema, heritage: heritageResumeSchema }, required: ["professional", "heritage"] } } });
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
      };

      const runOpenAI = async () => {
        const openai = getOpenAI(requestOpenaiKey);
        if (!openai) throw new Error("OpenAI not set");
        const res = await openai.chat.completions.create({ model: "gpt-4o", messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } });
        return JSON.parse(res.choices[0].message.content || "{}");
      };

      const data = await withFallback(runGemini, runOpenAI, !!requestOpenaiKey);
      const validated = GeminiResponseSchema.parse(data);
      const latex = { professional: formatResumeToLatex(validated.professional as any), heritage: formatResumeToLatex(validated.heritage as any) };

      // Optional Post-analysis
      let postAnalysis = null;
      try {
        const model = getGenAI(requestGeminiKey).getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const res = await model.generateContent(`${ANALYSIS_SYSTEM_PROMPT}\n\nCURRÍCULO GERADO:\n${JSON.stringify(validated.professional)}\nVAGA:\n${jobDescriptionText}`);
        const text = res.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const match = text.match(/\{[\s\S]*\}/);
        postAnalysis = AnalysisResponseSchema.parse(JSON.parse(match ? match[0] : text));
      } catch (e) {}

      return { success: true, data: validated, latex, postAnalysis };
    } catch (e) { console.error(e); set.status = 500; return { error: "Erro geração." }; }
  }, { body: t.Object({ resume: t.File(), jobDescriptionText: t.Optional(t.String()), jobDescriptionFile: t.Optional(t.File()), level: t.Optional(t.String()), boostedKeywords: t.Optional(t.String()) }) })

  .post("/api/cover-letter", async ({ body, set, headers }) => {
    try {
      const { resumeText, jobDescription } = body;
      const model = getGenAI(headers["x-api-key"]).getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const result = await model.generateContent(`${COVER_LETTER_SYSTEM_PROMPT}\nCV: ${resumeText}\nVaga: ${jobDescription}`);
      const text = result.response.text().trim();
      return { success: true, text, latex: formatCoverLetterToLatex(text, true) };
    } catch (e) { set.status = 500; return { error: "Erro cover letter." }; }
  }, { body: t.Object({ resumeText: t.String(), jobDescription: t.Optional(t.String()) }) })

  .post("/api/refine", async ({ body, set, headers }) => {
    try {
      const { text, jobDescription, instruction } = body;
      const model = getGenAI(headers["x-api-key"]).getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const result = await model.generateContent(`Refine este trecho: ${text}. Vaga: ${jobDescription}. Instrução: ${instruction}`);
      return { success: true, text: result.response.text().trim() };
    } catch (e) { set.status = 500; return { error: "Erro refino." }; }
  }, { body: t.Object({ text: t.String(), jobDescription: t.Optional(t.String()), instruction: t.Optional(t.String()) }) })

  .get("*", () => Bun.file(resolve(DIST_DIR, "index.html")))
  .listen(process.env.PORT || 3000);

console.log(`🦊 Backend rodando em http://${app.server?.hostname}:${app.server?.port}`);
