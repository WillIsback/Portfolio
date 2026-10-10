import { z } from "zod";
import {
	AiDomainEnum,
	BackendApiEnum,
	DatabaseEnum,
	DevOpsEnum,
	FrontendEnum,
	LanguageEnum,
	MlStackEnum,
	PracticeEnum,
	ProjectStatusEnum,
	TrainingEnum,
} from "@/schemas";

export const ProposalDataSchema = z.object({
	title: z.string().min(1).optional(),
	description: z.string().min(1).optional(),
	imagePath: z.string().optional(),
	github: z.string().optional(),
	lastUpdate: z.string().optional(),
	isPrivate: z.boolean().optional(),
	isAiGenerated: z.boolean().optional(),
	languages: z.array(LanguageEnum).optional(),
	databases: z.array(DatabaseEnum).optional(),
	backends: z.array(BackendApiEnum).optional(),
	frontends: z.array(FrontendEnum).optional(),
	devops: z.array(DevOpsEnum).optional(),
	domains: z.array(AiDomainEnum).optional(),
	mlStack: z.array(MlStackEnum).optional(),
	pitch: z.string().max(140).optional(),
	status: ProjectStatusEnum.optional(),
	period: z.string().optional(),
	githubRepoId: z.number().int().optional(),
	featuredRank: z.number().int().min(1).optional(),
	practices: z.array(PracticeEnum).optional(),
	training: TrainingEnum.nullable().optional(),
});

export const ProjectProposalSchema = z
	.object({
		action: z.enum(["create", "update", "delete"]),
		projectId: z.number().int().positive().nullable().default(null),
		summary: z.string().min(1).max(400),
		data: ProposalDataSchema.optional(),
	})
	.superRefine((p, ctx) => {
		if (p.action === "create" && !p.data?.title)
			ctx.addIssue({ code: "custom", message: "create : titre requis" });
		if (p.action === "update" && p.projectId === null)
			ctx.addIssue({ code: "custom", message: "update : projectId requis" });
		if (p.action === "delete" && p.projectId === null)
			ctx.addIssue({ code: "custom", message: "delete : projectId requis" });
	});

export type ProjectProposal = z.infer<typeof ProjectProposalSchema>;

/** Champs effectivement fournis (pour l'affichage de la carte). */
export function summarizeProposal(p: ProjectProposal): string[] {
	return Object.keys(p.data ?? {}).sort();
}
