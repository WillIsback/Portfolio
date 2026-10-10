import { tool } from "ai";
import { z } from "zod";
import { analyzeRepo } from "@/app/actions/admin.action";
import { getProjectById, getProjects } from "@/app/actions/projects.action";

function summarize(p: {
	id: number;
	title: string;
	description: string;
	pitch: string | null;
	status: string | null;
	domains: { domain: string }[];
	languages: { language: string }[];
}) {
	return {
		id: p.id,
		title: p.title,
		status: p.status,
		pitch: p.pitch ?? undefined,
		domains: p.domains.map((d) => d.domain),
		languages: p.languages.map((l) => l.language),
	};
}

export const projectTools = {
	listProjects: tool({
		description:
			"Liste/résume les projets (filtre texte optionnel sur le titre/description).",
		inputSchema: z.object({ search: z.string().optional() }),
		execute: async ({ search }) => {
			const rows = await getProjects(search ? { search } : {});
			return rows.slice(0, 50).map(summarize);
		},
	}),
	getProject: tool({
		description: "Détail complet d'un projet par son id.",
		inputSchema: z.object({ id: z.number().int().positive() }),
		execute: async ({ id }) => getProjectById(id),
	}),
	analyzeRepo: tool({
		description:
			"Analyse un dépôt GitHub (owner/repo) : stack détectée et écart avec le projet associé.",
		inputSchema: z.object({ fullName: z.string().min(3) }),
		execute: async ({ fullName }) => analyzeRepo(fullName),
	}),
};
