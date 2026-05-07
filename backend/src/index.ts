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
          
          SUA TAREFA:
          1. Detecte o idioma da Vaga de Emprego (Job Description).
          2. Reescreva TODO o currículo do candidato estritamente no MESMO IDIOMA da vaga (seja Português ou Inglês), para que ele tenha o MÁXIMO de aderência à vaga (ATS Friendly).
          3. Use os mesmos verbos de ação e palavras-chave encontradas na vaga.
          4. Oculte experiências totalmente irrelevantes ou destaque as relevantes.
          5. Melhore o Resumo Profissional ("summary").
          6. Retorne no campo "language" o valor "pt-BR" ou "en-US", dependendo de qual idioma você usou para gerar o currículo.

          Aqui está o Currículo Atual:
          """
          ${resumeText}
          """

          Aqui está a Descrição da Vaga:
          """
          ${jobDescriptionText || "Veja a imagem anexa."}
          """
        `;

        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                language: { type: SchemaType.STRING, description: "Must be 'pt-BR' or 'en-US'" },
                name: { type: SchemaType.STRING },
                title: { type: SchemaType.STRING },
                email: { type: SchemaType.STRING },
                phone: { type: SchemaType.STRING },
                address: { type: SchemaType.STRING },
                summary: { type: SchemaType.STRING },
                experience: {
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
                },
                education: {
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
                },
                skillsGroup: {
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
                }
              },
              required: ["language", "name", "title", "email", "phone", "address", "summary", "experience", "education", "skillsGroup"]
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
          data: {
            id: "generated-ats",
            theme: "ats-basic-theme",
            ...generatedJson
          }
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
