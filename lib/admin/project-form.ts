import type { NormalizedProject } from "@/lib/projects-data";
import type { AdminProject } from "@/schemas";

export const PITCH_MAX = 140;

const encodePath = (path: string) =>
	path.split("/").map(encodeURIComponent).join("/");

/** URL publique d'un fichier du dépôt ; chaque segment (branche, chemin) est encodé. */
export function rawImageUrl(
	fullName: string,
	branch: string,
	path: string,
): string {
	return `https://raw.githubusercontent.com/${encodePath(fullName)}/${encodePath(branch)}/${encodePath(path)}`;
}

/** Objet `NormalizedProject` du site, construit depuis l'état du formulaire. */
export function buildPreviewProject(
	id: number,
	form: AdminProject,
	now: Date = new Date(),
): NormalizedProject {
	const lastUpdate = form.lastUpdate ? new Date(form.lastUpdate) : null;
	return {
		id,
		title: form.title,
		description: form.description,
		imagePath: form.imagePath || null,
		github: form.github || null,
		lastUpdate,
		isPrivate: form.isPrivate,
		isAiGenerated: form.isAiGenerated,
		createdAt: lastUpdate ?? now,
		updatedAt: lastUpdate ?? now,
		languages: form.languages.map((language) => ({ language })),
		databases: form.databases.map((database) => ({ database })),
		backends: form.backends.map((backend) => ({ backend })),
		frontends: form.frontends.map((frontend) => ({ frontend })),
		devops: form.devops.map((devops) => ({ devops })),
		domains: form.domains.map((domain) => ({ domain })),
		mlStack: form.mlStack.map((ml) => ({ ml })),
		pitch: form.pitch || null,
		status: form.status ?? null,
		period: form.period || null,
		featuredRank: form.featuredRank ?? null,
		githubRepoId: form.githubRepoId ?? null,
	};
}

/** « À compléter » : sans accroche ou sans domaine. */
export function needsCompletion(p: {
	pitch: string | null;
	domainCount: number;
}): boolean {
	return !p.pitch?.trim() || p.domainCount === 0;
}
