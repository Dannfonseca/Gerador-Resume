import { z } from "zod";

// ========== Resume Data Schemas ==========

export const LinkSchema = z.object({
  url: z.string(),
  label: z.string()
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  technologies: z.string(),
  url: z.string()
});

export const ExperienceSchema = z.object({
  role: z.string(),
  company: z.string(),
  date: z.string(),
  location: z.string(),
  responsibilities: z.array(z.string())
});

export const EducationSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  date: z.string(),
  location: z.string()
});

export const SkillsGroupSchema = z.object({
  category: z.string(),
  items: z.array(z.string())
});

export const CommonResumeSchema = z.object({
  language: z.string().describe("pt-BR ou en-US"),
  name: z.string(),
  title: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  summary: z.string(),
  experience: z.array(ExperienceSchema),
  education: z.array(EducationSchema),
  skillsGroup: z.array(SkillsGroupSchema)
});

export const ProfessionalResumeSchema = CommonResumeSchema;

export const HeritageResumeSchema = CommonResumeSchema.extend({
  links: z.array(LinkSchema),
  projects: z.array(ProjectSchema)
});

export const GeminiResponseSchema = z.object({
  professional: ProfessionalResumeSchema,
  heritage: HeritageResumeSchema
});

// ========== Analysis (Diagnóstico) Schemas ==========

export const StrengthSchema = z.object({
  title: z.string(),
  description: z.string()
});

export const AnalysisResponseSchema = z.object({
  atsScore: z.number().min(0).max(100),
  probability: z.enum(["Alta", "Média", "Baixa"]),
  screeningReason: z.string(),
  matchScore: z.number().min(0).max(100).nullable(),
  matchAnalysis: z.string().nullable(),
  foundKeywords: z.array(z.string()).nullable(),
  missingKeywords: z.array(z.string()).nullable(),
  strengths: z.array(StrengthSchema),
  keywordOps: z.array(z.string()),
  tips: z.array(z.string())
});

// ========== Aggressiveness Level ==========

export const AggressivenessLevel = z.enum(["conservative", "balanced", "aggressive"]);
export type AggressivenessLevel = z.infer<typeof AggressivenessLevel>;
