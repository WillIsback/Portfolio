import prisma from "@/lib/db";
import type { AdminProject } from "@/schemas";

type Row = {
	title: string;
	description: string;
	imagePath: string | null;
	github: string | null;
	lastUpdate: Date | null;
	isPrivate: boolean;
	isAiGenerated: boolean;
	pitch: string | null;
	status: AdminProject["status"] | null;
	period: string | null;
	githubRepoId: number | null;
	featuredRank: number | null;
	training: AdminProject["training"] | null;
	languages: { language: AdminProject["languages"][number] }[];
	databases: { database: AdminProject["databases"][number] }[];
	backends: { backend: AdminProject["backends"][number] }[];
	frontends: { frontend: AdminProject["frontends"][number] }[];
	devops: { devops: AdminProject["devops"][number] }[];
	domains: { domain: AdminProject["domains"][number] }[];
	mlStack: { ml: AdminProject["mlStack"][number] }[];
	practices: { practice: AdminProject["practices"][number] }[];
};

export function toAdminProject(row: Row): AdminProject {
	return {
		title: row.title,
		description: row.description,
		imagePath: row.imagePath ?? "",
		github: row.github ?? "",
		lastUpdate: row.lastUpdate?.toISOString() ?? "",
		isPrivate: row.isPrivate,
		isAiGenerated: row.isAiGenerated,
		languages: row.languages.map((l) => l.language),
		databases: row.databases.map((d) => d.database),
		backends: row.backends.map((b) => b.backend),
		frontends: row.frontends.map((f) => f.frontend),
		devops: row.devops.map((d) => d.devops),
		domains: row.domains.map((d) => d.domain),
		mlStack: row.mlStack.map((m) => m.ml),
		pitch: row.pitch ?? undefined,
		status: row.status ?? undefined,
		period: row.period ?? undefined,
		githubRepoId: row.githubRepoId ?? undefined,
		featuredRank: row.featuredRank ?? undefined,
		practices: row.practices.map((p) => p.practice),
		training: row.training ?? null,
	};
}

const INCLUDE = {
	languages: true,
	databases: true,
	backends: true,
	frontends: true,
	devops: true,
	domains: true,
	mlStack: true,
	practices: true,
} as const;

/** Projet de la base au format formulaire, ou `null`. */
export async function loadAdminProject(
	id: number,
): Promise<AdminProject | null> {
	const row = await prisma.project.findUnique({
		where: { id },
		include: INCLUDE,
	});
	return row ? toAdminProject(row) : null;
}
