/** Plan d'écriture d'une synchronisation : champs cochés → colonnes et listes à remplacer. */
import { z } from "zod";
import { normalizeDomains } from "@/lib/domains";
import { normalizePractices } from "@/lib/practices";
import { AdminProjectSchema, AiDomainEnum, PracticeEnum } from "@/schemas";
import type { ListField } from "./sync";

export const SCALAR_FIELDS = [
	"description",
	"lastUpdate",
	"isPrivate",
	"github",
	"status",
] as const;

export interface WritePlan {
	scalars: {
		description?: string;
		lastUpdate?: Date;
		isPrivate?: boolean;
		github?: string;
		status?: "Archived";
	};
	lists: Partial<Record<ListField, string[]>>;
}

const listSchemas = {
	languages: AdminProjectSchema.shape.languages,
	databases: AdminProjectSchema.shape.databases,
	backends: AdminProjectSchema.shape.backends,
	frontends: AdminProjectSchema.shape.frontends,
	devops: AdminProjectSchema.shape.devops,
	mlStack: AdminProjectSchema.shape.mlStack,
	domains: z.array(AiDomainEnum),
	practices: z.array(PracticeEnum),
} as const;

/** Valide la sortie d'`applyAccepted` ; lève si une valeur sort des énumérations. */
export function planWrite(update: Record<string, unknown>): WritePlan {
	const plan: WritePlan = { scalars: {}, lists: {} };
	for (const [field, value] of Object.entries(update)) {
		if (field === "description")
			plan.scalars.description = z.string().parse(value);
		else if (field === "lastUpdate")
			plan.scalars.lastUpdate = z.date().parse(value);
		else if (field === "isPrivate")
			plan.scalars.isPrivate = z.boolean().parse(value);
		else if (field === "github")
			plan.scalars.github = z
				.string()
				.regex(/^https:\/\/github\.com\/[^/\s]+\/[^/\s]+$/)
				.parse(value);
		else if (field === "status")
			plan.scalars.status = z.literal("Archived").parse(value);
		else if (field in listSchemas) {
			const key = field as ListField;
			const parsed = listSchemas[key].parse(value) as string[];
			plan.lists[key] =
				key === "domains"
					? normalizeDomains(parsed)
					: key === "practices"
						? normalizePractices(parsed)
						: parsed;
		} else throw new Error(`Champ non synchronisable : ${field}`);
	}
	return plan;
}

export const ACCEPTABLE_FIELDS = [
	...SCALAR_FIELDS,
	"languages",
	"databases",
	"backends",
	"frontends",
	"devops",
	"mlStack",
	"domains",
	"practices",
] as const;
