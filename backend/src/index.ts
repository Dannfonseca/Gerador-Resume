import { Elysia, t } from "elysia";
import { GeminiResponseSchema, AnalysisResponseSchema, AggressivenessLevel } from "./schemas/resumeSchema";
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

/**
 * Helper to get Gemini Generative AI instance with a specific key or default.
 */
function getGenAI(requestKey?: string | null) {
  const key = requestKey || DEFAULT_GEMINI_API_KEY;
  return new GoogleGenerativeAI(key);
}

/**
 * Helper to get OpenAI instance with a specific key or default.
 */
function getOpenAI(requestKey?: string | null) {
  const key = requestKey || DEFAULT_OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

/**
 * Executes a function with Gemini and falls back to OpenAI if it fails.
 */
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

// ========================================================================
// Helper: Extract text from uploaded resume file (PDF or DOCX)
// ========================================================================
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

// ========================================================================
// PROMPTS: Analysis System Prompt (inspired by apresentando.me)
// ========================================================================
const ANALYSIS_SYSTEM_PROMPT = `
Você é o motor de análise de currículos de uma plataforma de recrutamento de nível enterprise.
Sua função é executar DUAS análises SEPARADAS e INDEPENDENTES:

## ANÁLISE 1: ATS SCORE (Compatibilidade Técnica com Sistemas ATS)
Esta análise avalia se o currículo será PARSEADO CORRETAMENTE por sistemas ATS.
IMPORTANTE: Sistemas ATS reais NÃO conseguem ler layouts complexos, duas colunas, fotos ou sidebars.

### PONTUAÇÃO BASE: Comece com 100 pontos e SUBTRAIA conforme problemas encontrados:

**PENALIZAÇÕES CRÍTICAS (layout que QUEBRA parsing do ATS):**
- Layout em DUAS COLUNAS ou mais: **-30 pontos** (ATS lê linha por linha, colunas misturam texto)
- Possui FOTO/IMAGEM do candidato: **-15 pontos** (ocupa espaço e pode confundir OCR)
- SIDEBAR com informações: **-20 pontos** (ATS não sabe ler barras laterais)
- Tabelas ou caixas de texto: **-15 pontos** (estrutura não-linear)
- Ícones ou elementos gráficos decorativos: **-10 pontos** (não são texto)
- Headers/footers complexos: **-5 pontos**

**PENALIZAÇÕES MODERADAS (conteúdo subótimo):**
- Falta seção de Resumo/Objetivo: **-8 pontos**
- Falta seção de Experiência clara: **-10 pontos**
- Falta seção de Formação: **-6 pontos**
- Falta seção de Habilidades: **-6 pontos**
- Falta informações de contato (email/telefone): **-8 pontos**
- Não usa bullet points nas experiências: **-5 pontos**
- Parágrafos muito longos (blocos de texto): **-5 pontos**
- Não usa verbos de ação: **-5 pontos**
- Não quantifica resultados: **-5 pontos**

### INTERPRETAÇÃO DO SCORE:
- **85-100**: Formato ideal para ATS. Coluna única, estrutura limpa.
- **70-84**: Bom formato com pequenos ajustes recomendados.
- **50-69**: Formato problemático. Pode ter parsing parcial.
- **0-49**: Formato RUIM. Alto risco de rejeição automática por falha de parsing.

### PROBABILIDADE DE LEITURA ATS:
- **Alta (≥75)**: Estrutura em coluna única, sem elementos visuais, seções claras.
- **Média (50-74)**: Alguns elementos problemáticos, parsing parcial provável.
- **Baixa (<50)**: Layout complexo (duas colunas, sidebar, foto) que ATS não consegue ler.

**REGRA DE OURO**: Se o currículo tem LAYOUT EM DUAS COLUNAS ou SIDEBAR, o score NUNCA pode ser acima de 55.

---

## ANÁLISE 2: MATCH SCORE (Compatibilidade com a Vaga)
Esta análise avalia APENAS se o candidato atende aos requisitos da vaga (SE fornecida).
Se não houver vaga, retorne matchScore, matchAnalysis, foundKeywords e missingKeywords como NULL.

Critérios (quando há vaga):
- Requisitos obrigatórios atendidos
- Requisitos desejáveis atendidos
- Keywords encontradas vs faltantes
- Alinhamento de senioridade

---

## LIMITES DE CARACTERES (RESPEITE RIGOROSAMENTE):
- screeningReason: máximo 350 caracteres (fale APENAS sobre formato/estrutura, NÃO sobre vaga)
- matchAnalysis: máximo 400 caracteres
- foundKeywords: máximo 10 itens
- missingKeywords: máximo 10 itens
- keywordOps: máximo 10 itens
- tips: máximo 5 itens, cada um com máximo 120 caracteres
- strengths: máximo 3 itens

## OUTPUT JSON (estrutura obrigatória):
{
  "atsScore": (0-100, baseado APENAS na qualidade de formato do currículo),
  "probability": "Alta" | "Média" | "Baixa" (probabilidade de LEITURA correta pelo ATS, não de aprovação na vaga),
  "screeningReason": "(máx 350 chars) Explique a qualidade do FORMATO: seções presentes/ausentes, estrutura, legibilidade. NÃO mencione a vaga aqui.",
  "matchScore": (0-100, compatibilidade com a vaga - NULL se não houver vaga),
  "matchAnalysis": "(máx 400 chars) Análise de compatibilidade com a VAGA. Requisitos atendidos vs gaps. NULL se não houver vaga.",
  "foundKeywords": ["Keywords da VAGA encontradas no currículo - NULL se não houver vaga"],
  "missingKeywords": ["Keywords da VAGA não encontradas - NULL se não houver vaga"],
  "strengths": [
    { "title": "(máx 50 chars)", "description": "(máx 100 chars)" }
  ],
  "keywordOps": ["Termos que o candidato deveria adicionar para melhorar"],
  "tips": ["Ações práticas para melhorar o currículo"]
}

## REGRAS CRÍTICAS:
- atsScore = qualidade de FORMATO. matchScore = compatibilidade com VAGA.
- Se não houver vaga, matchScore/matchAnalysis/foundKeywords/missingKeywords = null.
- Seja CRÍTICO e REALISTA. Não infle scores.
- Use Português do Brasil.
`;

// ========================================================================
// PROMPTS: Aggressiveness level instructions (inspired by apresentando.me)
// ========================================================================
const LEVEL_INSTRUCTIONS: Record<string, { name: string; focus: string; actions: string }> = {
  conservative: {
    name: "CONSERVADOR",
    focus: "Polimento e correções mínimas",
    actions: `
      - Corrigir erros gramaticais e ortográficos
      - Padronizar formatação (datas, títulos, bullet points)
      - Melhorar clareza sem alterar significado
      - Adicionar keywords da vaga APENAS onde já existe contexto compatível
      - NÃO inventar experiências ou habilidades
      - NÃO reescrever bullet points significativamente
      - Manter tom e voz originais do candidato
    `
  },
  balanced: {
    name: "EQUILIBRADO",
    focus: "Reescrita estratégica com alinhamento à vaga",
    actions: `
      - TUDO do nível conservador, MAIS:
      - Reescrever o resumo profissional para destacar fit com a vaga
      - Reformular bullet points de experiência com verbos de ação fortes (liderou, implementou, otimizou, reduziu, aumentou)
      - Quantificar resultados onde possível (%, números, impacto)
      - Inserir keywords da vaga naturalmente nas descrições de experiência
      - Reordenar habilidades priorizando as mais relevantes para a vaga
      - Ajustar títulos de cargo para melhor match (se razoável)
      - Manter veracidade: não inventar, apenas reformular
    `
  },
  aggressive: {
    name: "AGRESSIVO",
    focus: "Transformação completa orientada a conversão",
    actions: `
      - TUDO dos níveis anteriores, MAIS:
      - Reescrever TODO o currículo com tom altamente persuasivo
      - Criar resumo profissional de alto impacto vendendo o candidato como a escolha ideal
      - Maximizar inserção de keywords da vaga em TODAS as seções
      - Reformular TODOS os bullet points para mostrar impacto e resultados
      - Reestruturar ordem das seções se beneficiar o match
      - Expandir descrições curtas para mostrar mais valor
      - Remover informações irrelevantes para a vaga
      - Usar linguagem que espelha a descrição da vaga
      - Objetivo: maximizar ATS score e impressionar recrutador
    `
  }
};

// ========================================================================
// PROMPTS: Cover Letter System Prompt (inspired by apresentando.me)
// ========================================================================
const COVER_LETTER_SYSTEM_PROMPT = `
Você é um redator de nível premium auxiliando um profissional a conquistar um emprego estratégico.

## SUA MISSÃO
Escreva uma Carta de Apresentação (Cover Letter) persuasiva focada no "fit" de valor, destacando o impacto do candidato.

## REGRAS DE REDAÇÃO
1. Tamanho: Máximo de 3 a 5 parágrafos curtos, diretos.
2. Tom: Confiante, profissional, indo direto ao ponto. Evite linguagem subserviente ou clichê.
3. Estrutura:
   - Gancho inicial focando no problema da vaga/empresa e sua solução.
   - 1 a 2 parágrafos provindo evidências das suas experiências passadas sem citar o currículo desnecessariamente.
   - Conclusão com call-to-action forte.
4. Detecte o idioma da vaga e escreva no mesmo idioma.
5. Retorne APENAS o texto formatado final.

Importante: Retorne o texto puro em parágrafos, sem metadados, títulos internos, ou markdown extras.
`;

// ========================================================================
// Gemini Schema Definitions (for Structured Output)
// ========================================================================
const experienceSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      role: { type: SchemaType.STRING },
      company: { type: SchemaType.STRING },
      date: { type: SchemaType.STRING },
      location: { type: SchemaType.STRING },
      responsibilities: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING }
      }
    },
    required: ["role", "company", "date", "location", "responsibilities"]
  }
};

const educationSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      degree: { type: SchemaType.STRING },
      institution: { type: SchemaType.STRING },
      date: { type: SchemaType.STRING },
      location: { type: SchemaType.STRING }
    },
    required: ["degree", "institution", "date", "location"]
  }
};

const skillsGroupSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      category: { type: SchemaType.STRING },
      items: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING }
      }
    },
    required: ["category", "items"]
  }
};

const commonResumeProperties = {
  language: { type: SchemaType.STRING, description: "pt-BR ou en-US" },
  name: { type: SchemaType.STRING },
  title: { type: SchemaType.STRING },
  email: { type: SchemaType.STRING },
  phone: { type: SchemaType.STRING },
  address: { type: SchemaType.STRING },
  summary: { type: SchemaType.STRING },
  experience: experienceSchema,
  education: educationSchema,
  skillsGroup: skillsGroupSchema
};

const commonRequiredFields = [
  "language", "name", "title", "email", "phone",
  "address", "summary", "experience", "education", "skillsGroup"
];

const professionalResumeSchema = {
  type: SchemaType.OBJECT,
  properties: commonResumeProperties,
  required: commonRequiredFields
};

const heritageResumeSchema = {
  type: SchemaType.OBJECT,
  properties: {
    ...commonResumeProperties,
    links: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          url: { type: SchemaType.STRING },
          label: { type: SchemaType.STRING }
        },
        required: ["url", "label"]
      }
    },
    projects: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          technologies: { type: SchemaType.STRING },
          url: { type: SchemaType.STRING }
        },
        required: ["name", "description", "technologies", "url"]
      }
    }
  },
  required: [...commonRequiredFields, "links", "projects"]
};

// ========================================================================
// Helper: Convert structured resume data back to plain text for analysis
// ========================================================================
function buildResumeText(data: any): string {
  const lines: string[] = [];
  if (data.name) lines.push(data.name);
  if (data.title) lines.push(data.title);
  const contact = [data.email, data.phone, data.address].filter(Boolean).join(' | ');
  if (contact) lines.push(contact);
  lines.push('');

  if (data.summary) {
    lines.push('RESUMO PROFISSIONAL');
    lines.push(data.summary.replace(/\*\*/g, ''));
    lines.push('');
  }

  if (data.experience?.length) {
    lines.push('EXPERIÊNCIA PROFISSIONAL');
    for (const exp of data.experience) {
      lines.push(`${exp.role} | ${exp.company} | ${exp.date} | ${exp.location}`);
      for (const r of (exp.responsibilities || [])) {
        lines.push(`- ${r.replace(/\*\*/g, '')}`);
      }
      lines.push('');
    }
  }

  if (data.education?.length) {
    lines.push('FORMAÇÃO ACADÊMICA');
    for (const edu of data.education) {
      lines.push(`${edu.degree} | ${edu.institution} | ${edu.date}`);
    }
    lines.push('');
  }

  if (data.skillsGroup?.length) {
    lines.push('HABILIDADES');
    for (const g of data.skillsGroup) {
      lines.push(`${g.category}: ${g.items?.join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ========================================================================
// Elysia Server
// ========================================================================

const DIST_DIR = resolve(import.meta.dir, "../../frontend/dist");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
};

const app = new Elysia()
  .use(cors())

  // ── Serve static files from frontend/dist FIRST ──
  .get("/assets/*", ({ params }) => {
    const filePath = resolve(DIST_DIR, "assets", params["*"]);
    const file = Bun.file(filePath);
    const ext = extname(filePath);
    return new Response(file, {
      headers: { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" }
    });
  })
  .get("/favicon.svg", () => Bun.file(resolve(DIST_DIR, "favicon.svg")))
  .get("/icons.svg", () => Bun.file(resolve(DIST_DIR, "icons.svg")))

  // ────────────────────────────────────────────────────────────────────────
  // PILAR 1: POST /api/analyze — Diagnóstico (ATS Score + Match Score)
  // ────────────────────────────────────────────────────────────────────────
  .post(
    "/api/analyze",
    async ({ body, set, headers }) => {
      try {
        const { resume, jobDescriptionText, jobDescriptionFile } = body;
        const requestGeminiKey = headers["x-api-key"];
        const requestOpenaiKey = headers["x-openai-key"];

        const resumeText = await extractResumeText(resume, set);
        if (!resumeText) {
          return { error: "Formato de currículo inválido. Envie um PDF ou DOCX." };
        }

        const runGemini = async () => {
          const currentGenAI = getGenAI(requestGeminiKey);
          const model = currentGenAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { temperature: 0 }
          });

          const contents: any[] = [];
          if (jobDescriptionFile && jobDescriptionFile.type.startsWith('image/')) {
            const buffer = Buffer.from(await jobDescriptionFile.arrayBuffer());
            contents.push({
              inlineData: {
                data: buffer.toString("base64"),
                mimeType: jobDescriptionFile.type
              }
            });
          }

          const prompt = `${ANALYSIS_SYSTEM_PROMPT}\n\nCURRÍCULO:\n${resumeText}\n\nDESCRIÇÃO DA VAGA:\n${jobDescriptionText || "Não fornecida"}`;
          contents.push(prompt);

          const result = await model.generateContent(contents);
          let text = result.response.text();
          text = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("Resposta da IA não contém JSON válido");
          return JSON.parse(jsonMatch[0]);
        };

        const runOpenAI = async () => {
          const openai = getOpenAI(requestOpenaiKey);
          if (!openai) throw new Error("OpenAI API Key not configured");
          
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
              { role: "user", content: `CURRÍCULO:\n${resumeText}\n\nDESCRIÇÃO DA VAGA:\n${jobDescriptionText || "Não fornecida"}` }
            ],
            response_format: { type: "json_object" }
          });
          
          return JSON.parse(response.choices[0].message.content || "{}");
        };

        const analysis = await withFallback(runGemini, runOpenAI, !!requestOpenaiKey);
        const validatedAnalysis = AnalysisResponseSchema.parse(analysis);

        return { success: true, data: validatedAnalysis };
      } catch (error) {
        console.error("Analyze Error:", error);
        set.status = 500;
        return { error: "Ocorreu um erro ao analisar seu currículo." };
      }
    },
    {
      body: t.Object({
        resume: t.File(),
        jobDescriptionText: t.Optional(t.String()),
        jobDescriptionFile: t.Optional(t.File())
      })
    }
  )

  // ────────────────────────────────────────────────────────────────────────
  // POST /api/suggest-keywords — Sugestões de Palavras-Chave para Boost
  // ────────────────────────────────────────────────────────────────────────
  .post(
    "/api/suggest-keywords",
    async ({ body, set, headers }) => {
      try {
        const { resumeText, jobDescription, missingKeywords } = body;
        const requestGeminiKey = headers["x-api-key"];
        const requestOpenaiKey = headers["x-openai-key"];

        const systemPrompt = `Você é um consultor especialista em ATS. Sugira entre 8 e 15 palavras-chave estratégicas. Responda APENAS com um JSON array no formato: [ { "keyword": "...", "category": "...", "reason": "...", "priority": "..." } ]`;
        const userPrompt = `
          ${missingKeywords ? `\nKEYWORDS JÁ IDENTIFICADAS:\n${missingKeywords}\n` : ''}
          CURRÍCULO:\n${resumeText}\n\nVAGA:\n${jobDescription || "Não especificada"}
        `;

        const runGemini = async () => {
          const currentGenAI = getGenAI(requestGeminiKey);
          const model = currentGenAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.1 } });
          const result = await model.generateContent(systemPrompt + userPrompt);
          let text = result.response.text();
          text = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const arrayMatch = text.match(/\[[\s\S]*\]/);
          if (!arrayMatch) throw new Error("Invalid Gemini response");
          return JSON.parse(arrayMatch[0]);
        };

        const runOpenAI = async () => {
          const openai = getOpenAI(requestOpenaiKey);
          if (!openai) throw new Error("OpenAI API Key not configured");
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
          });
          const content = response.choices[0].message.content || "[]";
          const parsed = JSON.parse(content);
          return Array.is  .post(
    "/api/generate",
    async ({ body, set, headers }) => {
      try {
        const { resume, jobDescriptionText, jobDescriptionFile, level, boostedKeywords } = body;
        const requestGeminiKey = headers["x-api-key"];
        const requestOpenaiKey = headers["x-openai-key"];
        
        let resumeText = await extractResumeText(resume, set);
        if (!resumeText) return { error: "Formato de currículo inválido." };

        const aggressiveness = level || "balanced";
        const levelInfo = LEVEL_INSTRUCTIONS[aggressiveness];

        const prompt = `Você é um especialista em ATS. Gere duas versões otimizadas do currículo: 'professional' e 'heritage'. 
        Use o nível: ${levelInfo.name}. ${boostedKeywords ? `Keywords: ${boostedKeywords}` : ''}
        
        ## REGRAS CRÍTICAS DE FORMATAÇÃO:
        1. NUNCA use markdown (** ou __) na seção de 'skills' ou 'habilidades'.
        2. Nas seções de 'experience' e 'summary', você PODE usar **negrito** para destacar tecnologias e métricas.
        3. Evite adjetivos genéricos e subjetivos nas skills (ex: "proativo", "código limpo", "escalável"). Foque em tecnologias, ferramentas e metodologias técnicas reais.
        4. Preserve todos os links originais.
        
        CURRÍCULO:\n${resumeText}\n\nVAGA:\n${jobDescriptionText || "Veja anexo"}`;

        const runGemini = async () => {
          const currentGenAI = getGenAI(requestGeminiKey);
          const model = currentGenAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
              responseSchema: {
                type: SchemaType.OBJECT,
                properties: { professional: professionalResumeSchema, heritage: heritageResumeSchema },
                required: ["professional", "heritage"]
              }
            }
          });
          const result = await model.generateContent(prompt);
          return JSON.parse(result.response.text());
        };

        const runOpenAI = async () => {
          const openai = getOpenAI(requestOpenaiKey);
          if (!openai) throw new Error("OpenAI Key not set");
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
          });
          return JSON.parse(response.choices[0].message.content || "{}");
        };

        const generatedData = await withFallback(runGemini, runOpenAI, !!requestOpenaiKey);
        const validatedData = GeminiResponseSchema.parse(generatedData);

        const latex = {
          professional: formatResumeToLatex(validatedData.professional as any),
          heritage: formatResumeToLatex(validatedData.heritage as any)
        };

        return { success: true, data: validatedData, latex, level: aggressiveness };
      } catch (error) {
        console.error("Generate Error:", error);
        set.status = 500;
        return { error: "Erro na geração do currículo." };
      }
    },
    {
      body: t.Object({
        resume: t.File(),
        jobDescriptionText: t.Optional(t.String()),
        jobDescriptionFile: t.Optional(t.File()),
        level: t.Optional(t.String()),
        boostedKeywords: t.Optional(t.String())
      })
    }
  )
tionText || "Não fornecida"}
          `;

          const analysisResult = await analysisModel.generateContent(analysisPrompt);
          let analysisText = analysisResult.response.text();
          analysisText = analysisText.replace(/```json/g, '').replace(/```/g, '').trim();
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            postAnalysis = AnalysisResponseSchema.parse(JSON.parse(jsonMatch[0]));
          }
        } catch (postErr) {
          console.warn("Post-analysis failed (non-critical):", postErr);
        }
        
        return {
          success: true,
          data: validatedData,
          latex,
          level: aggressiveness,
          postAnalysis
        };

      } catch (error) {
        console.error("Generate Error:", error);
        set.status = 500;
        return { error: "Ocorreu um erro interno ao processar seu currículo." };
      }
    },
    {
      body: t.Object({
        resume: t.File(),
        jobDescriptionText: t.Optional(t.String()),
        jobDescriptionFile: t.Optional(t.File()),
        level: t.Optional(t.String()),
        boostedKeywords: t.Optional(t.String())
      })
    }
  )

  // ────────────────────────────────────────────────────────────────────────
  // PILAR 4: POST /api/cover-letter — Carta de Apresentação
  // ────────────────────────────────────────────────────────────────────────
  .post(
    "/api/cover-letter",
    async ({ body, set }) => {
      try {
        const { resumeText, jobDescription } = body;

        const requestApiKey = headers["x-api-key"];
        const currentGenAI = getGenAI(requestApiKey);

        const model = currentGenAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          generationConfig: {
            temperature: 0.5,
          }
        });

        const prompt = `
          ${COVER_LETTER_SYSTEM_PROMPT}

          ## DADOS DO CANDIDATO
          ${resumeText}

          ## VAGA DE DESTINO
          ${jobDescription || "Não especificada - foque no valor geral e histórico de sucesso"}
        `;

        const result = await model.generateContent(prompt);
        const coverLetterText = result.response.text().trim();

        // Also generate LaTeX version
        const isPt = !jobDescription || /[àáãâéêíóôõúç]/i.test(jobDescription);
        const latex = formatCoverLetterToLatex(coverLetterText, isPt);

        return {
          success: true,
          text: coverLetterText,
          latex
        };
      } catch (error) {
        console.error("Cover Letter Error:", error);
        set.status = 500;
        return { error: "Erro ao gerar a carta de apresentação." };
      }
    },
    {
      body: t.Object({
        resumeText: t.String(),
        jobDescription: t.Optional(t.String())
      })
    }
  )

  // ────────────────────────────────────────────────────────────────────────
  // Existing: POST /api/refine — Refinar trechos individuais com IA
  // ────────────────────────────────────────────────────────────────────────
  .post(
    "/api/refine",
    async ({ body, set }) => {
      try {
        const { text, jobDescription, instruction } = body;
        
        const prompt = `
          Você é um especialista em ATS. O usuário quer refinar um trecho específico do seu currículo.
          
          Trecho Atual:
          """
          ${text}
          """
          
          Vaga de Emprego (Contexto):
          """
          ${jobDescription || "Nenhuma informada."}
          """
          
          Instrução do Usuário:
          """
          ${instruction || "Otimize este trecho com as palavras-chave da vaga, use negrito nas palavras importantes e deixe mais profissional."}
          """
          
          Sua tarefa: Retorne APENAS o novo trecho reescrito. Nada de introduções ou explicações. Se for uma responsabilidade de cargo, retorne apenas a frase direta. Mantenha no mesmo idioma.
        `;

        const requestApiKey = headers["x-api-key"];
        const currentGenAI = getGenAI(requestApiKey);
        
        const model = currentGenAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { temperature: 0.3 } });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        return { success: true, text: responseText };
      } catch (error) {
        console.error("Refine Error:", error);
        set.status = 500;
        return { error: "Erro ao refinar o trecho." };
      }
    },
    {
      body: t.Object({
        text: t.String(),
        jobDescription: t.Optional(t.String()),
        instruction: t.Optional(t.String())
      })
    }
  )
  .get("*", () => Bun.file(resolve(DIST_DIR, "index.html")))
  .listen(3000);

console.log(
  `🦊 Backend Elysia rodando em http://${app.server?.hostname}:${app.server?.port}`
);
