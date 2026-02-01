import { z } from "zod";

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
]);
export const DevOpsEnum = z.enum(["Docker", "GithubActions"]);
export const LanguageEnum = z.enum([
	"Python",
	"TypeScript",
	"JavaScript",
	"Rust",
]);

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
export const ProjectFiltersSchema = z.object({
	search: z.string().optional(),
	language: z.array(LanguageEnum).optional(),
	database: z.array(DatabaseEnum).optional(),
	backend: z.array(BackendApiEnum).optional(),
	frontend: z.array(FrontendEnum).optional(),
	devops: z.array(DevOpsEnum).optional(),
});

// Types inférés
export type Database = z.infer<typeof DatabaseEnum>;
export type BackendApi = z.infer<typeof BackendApiEnum>;
export type Frontend = z.infer<typeof FrontendEnum>;
export type DevOps = z.infer<typeof DevOpsEnum>;
export type Language = z.infer<typeof LanguageEnum>;
export type TechStack = z.infer<typeof TechStackSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectFilters = z.infer<typeof ProjectFiltersSchema>;
