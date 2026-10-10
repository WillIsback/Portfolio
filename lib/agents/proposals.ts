import { z } from "zod";
import { AdminProjectSchema } from "@/schemas";

export const ProposalDataSchema = AdminProjectSchema.partial();

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
