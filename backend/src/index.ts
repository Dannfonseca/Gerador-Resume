import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY is not set in the environment variables!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const app = new Elysia()
  .use(cors())
  .use(staticPlugin({ assets: "../frontend/dist", prefix: "/" }))
  .post(
    "/api/generate",
    async ({ body, set }) => {
      try {
        const { resume, jobDescriptionText, jobDescriptionFile } = body;
        
        let resumeText = "";

        // Parse Resume
        if (resume && resume.type === "application/pdf") {
          const arrayBuffer = await resume.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const pdfData = await pdfParse(buffer);
          resumeText = pdfData.text;
        } else if (resume && (resume.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || resume.name.endsWith(".docx"))) {
          const arrayBuffer = await resume.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const result = await mammoth.extractRawText({ buffer });
          resumeText = result.value;
        } else {
          set.status = 400;
          return { error: "Formato de currículo inválido. Envie um PDF ou DOCX." };
        }

        const prompt = `
          Você é um especialista em recrutamento de alto nível e sistemas ATS (Applicant Tracking Systems).
          Eu vou te fornecer o conteúdo do Currículo Atual do candidato e as informações da Vaga de Emprego desejada.
          
          Sua tarefa é gerar DUAS VERSÕES OTIMIZADAS e SEPARADAS do currículo.

          REGRA DE SEPARAÇÃO:
          - As regras da versão "heritage" não podem alterar, resumir ou esvaziar a versão "professional".
          - As duas versões devem usar o mesmo idioma da vaga, mas podem ter estrutura e nível de concisão diferentes.
          - Não invente experiências. Quando o candidato não tiver emprego formal, use projetos, freelas, estudos práticos ou trabalhos pessoais que apareçam no currículo como experiência prática.

          VERSÃO 1: "professional" (template profissional antigo):
          1. Detecte o idioma da Vaga de Emprego (Job Description).
          2. Reescreva TODO o currículo do candidato estritamente no MESMO IDIOMA da vaga (seja Português ou Inglês), para que ele tenha o MÁXIMO de aderência à vaga (ATS Friendly).
          3. Use os mesmos verbos de ação e palavras-chave encontradas na vaga.
          4. Mantenha a seção "experience" preenchida com as experiências relevantes do candidato. Ela NÃO pode voltar vazia.
          5. Melhore o Resumo Profissional ("summary").
          6. Retorne no campo "language" o valor "pt-BR" ou "en-US", dependendo de qual idioma você usou para gerar o currículo.
          7. Use o estilo do template profissional: Informações Pessoais, Resumo Profissional, Formação Acadêmica, Experiência Profissional e Habilidades.

          VERSÃO 2: "heritage" (novo padrão compacto, à parte):
          1. Extremamente conciso e focado (ideal para 1 página). Oculte rigorosamente experiências não relacionadas.
          2. NÃO inclua o "Resumo Profissional" (deixe em branco) a não ser que seja crucial.
          3. Experiência focada em métricas (ex: "Fiz X para solucionar Y resultando em Z% de melhora").
          4. Adicione "links" (LinkedIn, GitHub) e uma seção de "projetos" se o candidato tiver.
          5. Skills categorizadas rigidamente em "Languages", "Frameworks", "Databases", "Technologies / Tools" e "Practices".
          6. Mantenha no idioma da vaga também.

          Aqui está o Currículo Atual:
          """
          ${resumeText}
          """

          Aqui está a Descrição da Vaga:
          """
          ${jobDescriptionText || "Veja a imagem anexa."}
          """
        `;

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
          "language",
          "name",
          "title",
          "email",
          "phone",
          "address",
          "summary",
          "experience",
          "education",
          "skillsGroup"
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

        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                professional: professionalResumeSchema,
                heritage: heritageResumeSchema
              },
              required: ["professional", "heritage"]
            }
          }
        });

        const contents = [];
        
        if (jobDescriptionFile && jobDescriptionFile.type.startsWith('image/')) {
          const buffer = Buffer.from(await jobDescriptionFile.arrayBuffer());
          contents.push({
            inlineData: {
              data: buffer.toString("base64"),
              mimeType: jobDescriptionFile.type
            }
          });
        }
        
        contents.push(prompt);

        const result = await model.generateContent(contents);
        const responseText = result.response.text();

        const generatedJson = JSON.parse(responseText);
        
        return {
          success: true,
          data: generatedJson
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
        jobDescriptionFile: t.Optional(t.File())
      })
    }
  )
  .get("*", () => Bun.file("../frontend/dist/index.html"))
  .listen(3000);

console.log(
  `🦊 Backend Elysia rodando em http://${app.server?.hostname}:${app.server?.port}`
);
