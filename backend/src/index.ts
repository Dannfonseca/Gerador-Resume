import { Elysia, t } from "elysia";
import { GeminiResponseSchema, AnalysisResponseSchema } from "./schemas/resumeSchema";
import { formatResumeToLatex, formatCoverLetterToLatex } from "./services/latexService";
import { getComboContext, getPublicCombos } from "./data/careerCombos";
import { cors } from "@elysiajs/cors";
import { resolve, extname } from "path";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import OpenAI from "openai";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

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
  "matchAnalysis": "resumo breve da compatibilidade (2-3 frases) | null",
  "foundKeywords": ["keywords da vaga encontradas no CV"],
  "missingKeywords": ["keywords da vaga NÃO encontradas no CV"],
  "strengths": [{ "title": "string", "description": "string" }],
  "keywordOps": ["oportunidades de melhoria"],
  "tips": ["dicas práticas"]
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
      const requestGeminiKey = headers["x-api-key"];
      const requestOpenaiKey = headers["x-openai-key"];
      const resumeText = await extractResumeText(resume, set);
      if (!resumeText) return { error: "Currículo inválido." };

      const comboContext = getComboContext(careerCombo);

      const runGemini = async () => {
        const model = getGenAI(requestGeminiKey).getGenerativeModel({ 
          model: "gemini-2.5-flash", 
          generationConfig: { 
            temperature: 0.1,
            responseMimeType: "application/json"
          } 
        });
        const contents: any[] = [];
        const hasJobImage = jobDescriptionFile && jobDescriptionFile.type.startsWith('image/');
        if (hasJobImage) {
          contents.push({ inlineData: { data: Buffer.from(await jobDescriptionFile.arrayBuffer()).toString("base64"), mimeType: jobDescriptionFile.type } });
        }
        
        // Determine job description context for the prompt
        let jobContext: string;
        if (jobDescriptionText) {
          jobContext = jobDescriptionText;
        } else if (hasJobImage) {
          jobContext = "A vaga foi fornecida como IMAGEM acima. Extraia o texto da vaga a partir da imagem e use-o para realizar a análise de Match Score, foundKeywords e missingKeywords. O matchScore DEVE ser calculado.";
        } else {
          jobContext = "Não fornecida";
        }
        
        contents.push(`${ANALYSIS_SYSTEM_PROMPT}\n\n${comboContext}\n\nCURRÍCULO:\n${resumeText}\n\nVAGA:\n${jobContext}`);
        const result = await model.generateContent(contents);
        const text = result.response.text().trim();
        return JSON.parse(text);
      };

      const runOpenAI = async () => {
        const openai = getOpenAI(requestOpenaiKey);
        if (!openai) throw new Error("OpenAI not set");
        const res = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "system", content: `${ANALYSIS_SYSTEM_PROMPT}\n\n${comboContext}` }, { role: "user", content: `CURRÍCULO:\n${resumeText}\nVAGA:\n${jobDescriptionText || "Não fornecida"}` }], response_format: { type: "json_object" } });
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
  }, { body: t.Object({ resume: t.File(), jobDescriptionText: t.Optional(t.String()), jobDescriptionFile: t.Optional(t.File()), careerCombo: t.Optional(t.String()) }) })

  .post("/api/suggest-keywords", async ({ body, set, headers }) => {
    try {
      const { resumeText, jobDescription, missingKeywords, careerCombo } = body;
      const requestGeminiKey = headers["x-api-key"];
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
      const model = getGenAI(requestGeminiKey).getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json"
        }
      });
      const result = await model.generateContent(`${systemPrompt}\n\nCURRÍCULO DO CANDIDATO:\n${resumeText}\n\nDESCRIÇÃO DA VAGA:\n${jobDescription || "Não fornecida"}\n\nKEYWORDS FALTANTES IDENTIFICADAS NA ANÁLISE:\n${missingKeywords || "Nenhuma"}`);
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const match = text.match(/\[[\s\S]*\]/);
      return { success: true, suggestions: JSON.parse(match ? match[0] : text) };
    } catch (e) { set.status = 500; return { error: "Erro keywords." }; }
  }, { body: t.Object({ resumeText: t.String(), jobDescription: t.Optional(t.String()), missingKeywords: t.Optional(t.String()), careerCombo: t.Optional(t.String()) }) })

  .post("/api/generate", async ({ body, set, headers }) => {
    try {
      const { resume, jobDescriptionText, level, boostedKeywords, careerCombo } = body;
      const requestGeminiKey = headers["x-api-key"];
      const requestOpenaiKey = headers["x-openai-key"];
      const resumeText = await extractResumeText(resume, set);
      const levelInfo = LEVEL_INSTRUCTIONS[level || "balanced"];
      const comboContext = getComboContext(careerCombo);
      const prompt = `Gere currículo professional e heritage em JSON. Nível: ${levelInfo.name}. Keywords: ${boostedKeywords}. ${comboContext ? `\n\n${comboContext}` : ''} CV: ${resumeText}. Vaga: ${jobDescriptionText}`;

      const runGemini = async () => {
        const model = getGenAI(requestGeminiKey).getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: { type: SchemaType.OBJECT, properties: { professional: professionalResumeSchema, heritage: heritageResumeSchema }, required: ["professional", "heritage"] } } });
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
        const model = getGenAI(requestGeminiKey).getGenerativeModel({ 
          model: "gemini-2.5-flash",
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        });
        const res = await model.generateContent(`${ANALYSIS_SYSTEM_PROMPT}\n\n${comboContext}\n\nIMPORTANTE: O campo matchScore DEVE ser preenchido com um número de 0 a 100. NUNCA retorne null para matchScore quando uma vaga foi fornecida.\n\nCURRÍCULO GERADO:\n${JSON.stringify(validated.professional)}\nVAGA:\n${jobDescriptionText || "Não fornecida"}`);
        const text = res.response.text().trim();
        postAnalysis = AnalysisResponseSchema.parse(JSON.parse(text));
      } catch (e) { console.error("Post-analysis error:", e); }

      return { success: true, data: validated, latex, postAnalysis };
    } catch (e) { console.error(e); set.status = 500; return { error: "Erro geração." }; }
  }, { body: t.Object({ resume: t.File(), jobDescriptionText: t.Optional(t.String()), jobDescriptionFile: t.Optional(t.File()), level: t.Optional(t.String()), boostedKeywords: t.Optional(t.String()), careerCombo: t.Optional(t.String()) }) })

  .post("/api/cover-letter", async ({ body, set, headers }) => {
    try {
      const { resumeText, jobDescription } = body;
      const model = getGenAI(headers["x-api-key"]).getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(`${COVER_LETTER_SYSTEM_PROMPT}\nCV: ${resumeText}\nVaga: ${jobDescription}`);
      const text = result.response.text().trim();
      return { success: true, text, latex: formatCoverLetterToLatex(text, true) };
    } catch (e) { set.status = 500; return { error: "Erro cover letter." }; }
  }, { body: t.Object({ resumeText: t.String(), jobDescription: t.Optional(t.String()) }) })

  .post("/api/refine", async ({ body, set, headers }) => {
    try {
      const { text, jobDescription, instruction } = body;
      const model = getGenAI(headers["x-api-key"]).getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(`Refine este trecho: ${text}. Vaga: ${jobDescription}. Instrução: ${instruction}`);
      return { success: true, text: result.response.text().trim() };
    } catch (e) { set.status = 500; return { error: "Erro refino." }; }
  }, { body: t.Object({ text: t.String(), jobDescription: t.Optional(t.String()), instruction: t.Optional(t.String()) }) })

  .get("*", () => Bun.file(resolve(DIST_DIR, "index.html")))
  .listen(process.env.PORT || 3000);

console.log(`🦊 Backend rodando em http://${app.server?.hostname}:${app.server?.port}`);
