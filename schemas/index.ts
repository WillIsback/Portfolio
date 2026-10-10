import { z } from "zod";
import { AI_DOMAINS } from "@/lib/domains";
import { FAMILIES, PRACTICES } from "@/lib/practices";
import { TRAININGS } from "@/lib/training";

// Enums correspondant au schéma Prisma
export const DatabaseEnum = z.enum([
	"Postgresql",
	"MongoDB",
	"Informix",
	"SQLite",
]);
export const BackendApiEnum = z.enum(["FastAPI", "Fastify", "ExpressJs"]);
export const FrontendEnum = z.enum([
	"React",
	"NextJs",
	"Tanstack",
	"Svelte",
	"SvelteKit",
	"TailwindCSS",
]);
export const DevOpsEnum = z.enum(["Docker", "GithubActions"]);
export const LanguageEnum = z.enum([
	"Python",
	"TypeScript",
	"JavaScript",
	"Rust",
]);

export const MlStackEnum = z.enum([
	"PyTorch",
	"Transformers",
	"ScikitLearn",
	"Pandas",
	"XGBoost",
	"HuggingFace",
	"VLLM",
	"WandB",
	"LlmSdk",
]);
export const ProjectStatusEnum = z.enum(["InProgress", "Done", "Archived"]);
export const PracticeEnum = z.enum(PRACTICES);
export const PracticeFamilyEnum = z.enum(FAMILIES);
export const TrainingEnum = z.enum(TRAININGS);

// Schéma TechStack
export const TechStackSchema = z.object({
	database: z.array(DatabaseEnum).optional(),
	backendApi: z.array(BackendApiEnum).optional(),
	frontend: z.array(FrontendEnum).optional(),
	devOps: z.array(DevOpsEnum).optional(),
});

// Schéma Project complet
export const ProjectSchema = z.object({
	id: z.number().optional(),
	title: z.string().min(1, "Le titre est requis"),
	description: z.string().min(1, "La description est requise"),
	imagePath: z.string().optional(),
	github: z.url().optional().or(z.literal("")),
	lastUpdate: z.iso.datetime().optional(),
	isPrivate: z.boolean().optional().default(false),
	isAiGenerated: z.boolean().optional().default(false),
	languages: z.array(LanguageEnum).optional(),
	techStack: TechStackSchema.optional(),
});

// Schéma pour les filtres de recherche
export const AiDomainEnum = z.enum(AI_DOMAINS);

export const ProjectFiltersSchema = z.object({
	search: z.string().optional(),
	language: z.array(LanguageEnum).optional(),
	database: z.array(DatabaseEnum).optional(),
	backend: z.array(BackendApiEnum).optional(),
	frontend: z.array(FrontendEnum).optional(),
	devops: z.array(DevOpsEnum).optional(),
	domain: z.array(AiDomainEnum).optional(),
	practice: z.array(PracticeFamilyEnum).optional(),
	training: z.enum(["only", "exclude"]).optional(),
});

// Types inférés
export type Database = z.infer<typeof DatabaseEnum>;
export type BackendApi = z.infer<typeof BackendApiEnum>;
export type Frontend = z.infer<typeof FrontendEnum>;
export type DevOps = z.infer<typeof DevOpsEnum>;
export type MlStack = z.infer<typeof MlStackEnum>;
export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;
export type Language = z.infer<typeof LanguageEnum>;
export type TechStack = z.infer<typeof TechStackSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectFilters = z.infer<typeof ProjectFiltersSchema>;

// Schema used by admin forms — all tech stack fields required for DB writes
export const AdminProjectSchema = z.object({
	title: z.string().min(1, "Le titre est requis"),
	description: z.string().min(1, "La description est requise"),
	imagePath: z.string().optional(),
	github: z.string().optional(),
	lastUpdate: z.string().optional(),
	isPrivate: z.boolean().default(false),
	isAiGenerated: z.boolean().default(false),
	languages: z.array(LanguageEnum).default([]),
	databases: z.array(DatabaseEnum).default([]),
	backends: z.array(BackendApiEnum).default([]),
	frontends: z.array(FrontendEnum).default([]),
	devops: z.array(DevOpsEnum).default([]),
	domains: z.array(AiDomainEnum).default([]),
	mlStack: z.array(MlStackEnum).default([]),
	pitch: z.string().max(140).optional(),
	status: ProjectStatusEnum.optional(),
	period: z.string().optional(),
	githubRepoId: z.number().int().optional(),
	featuredRank: z.number().int().min(1).optional(),
	practices: z
		.array(PracticeEnum)
		.max(PRACTICES.length)
		.default([])
		.transform((v) => [...new Set(v)]),
	training: TrainingEnum.nullable().default(null),
});

export type AdminProject = z.infer<typeof AdminProjectSchema>;
