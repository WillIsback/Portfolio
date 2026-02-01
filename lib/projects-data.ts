import projectsData from "@/app/data/github-projects.json";
import type { ProjectFilters } from "@/schemas";

// Type pour un projet JSON
interface JsonProject {
	title: string;
	description: string;
	imagePath?: string;
	github: string;
	lastUpdate: string;
	isPrivate: boolean;
	isAiGenerated: boolean;
	languages: string[];
	techStack?: {
		database?: string[];
		frontend?: string[];
		backendApi?: string[];
		devOps?: string[];
	};
}

// Type normalisé pour l'affichage (compatible avec ProjectWithRelations)
export interface NormalizedProject {
	id: number;
	title: string;
	description: string;
	imagePath: string | null;
	github: string | null;
	lastUpdate: Date | null;
	isPrivate: boolean;
	isAiGenerated: boolean;
	createdAt: Date;
	updatedAt: Date;
	languages: { language: string }[];
	databases: { database: string }[];
	backends: { backend: string }[];
	frontends: { frontend: string }[];
	devops: { devops: string }[];
}

// Transformer un projet JSON en format normalisé
function normalizeProject(
	project: JsonProject,
	index: number,
): NormalizedProject {
	const lastUpdate = new Date(project.lastUpdate);
	return {
		id: index + 1,
		title: project.title,
		description: project.description,
		imagePath: project.imagePath || null,
		github: project.github,
		lastUpdate,
		isPrivate: project.isPrivate,
		isAiGenerated: project.isAiGenerated,
		createdAt: lastUpdate,
		updatedAt: lastUpdate,
		languages: project.languages.map((lang) => ({ language: lang })),
		databases: (project.techStack?.database || []).map((db) => ({
			database: db,
		})),
		backends: (project.techStack?.backendApi || []).map((api) => ({
			backend: api,
		})),
		frontends: (project.techStack?.frontend || []).map((fe) => ({
			frontend: fe,
		})),
		devops: (project.techStack?.devOps || []).map((dop) => ({ devops: dop })),
	};
}

// Récupérer tous les projets depuis le JSON
export function getProjectsFromJson(
	filters?: ProjectFilters,
): NormalizedProject[] {
	let projects = (projectsData.projects as JsonProject[]).map(normalizeProject);

	// Appliquer les filtres
	if (filters?.search) {
		const search = filters.search.toLowerCase();
		projects = projects.filter(
			(p) =>
				p.title.toLowerCase().includes(search) ||
				p.description.toLowerCase().includes(search),
		);
	}

	if (filters?.language?.length) {
		const langs = filters.language as string[];
		projects = projects.filter((p) =>
			p.languages.some((l) => langs.includes(l.language)),
		);
	}

	if (filters?.database?.length) {
		const dbs = filters.database as string[];
		projects = projects.filter((p) =>
			p.databases.some((d) => dbs.includes(d.database)),
		);
	}

	if (filters?.backend?.length) {
		const backs = filters.backend as string[];
		projects = projects.filter((p) =>
			p.backends.some((b) => backs.includes(b.backend)),
		);
	}

	if (filters?.frontend?.length) {
		const fronts = filters.frontend as string[];
		projects = projects.filter((p) =>
			p.frontends.some((f) => fronts.includes(f.frontend)),
		);
	}

	if (filters?.devops?.length) {
		const devs = filters.devops as string[];
		projects = projects.filter((p) =>
			p.devops.some((d) => devs.includes(d.devops)),
		);
	}

	// Trier par date de mise à jour (plus récent en premier)
	return projects.sort((a, b) => {
		const dateA = a.lastUpdate?.getTime() ?? 0;
		const dateB = b.lastUpdate?.getTime() ?? 0;
		return dateB - dateA;
	});
}
