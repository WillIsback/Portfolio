/** Logique pure de l'écran /admin/github : lignes, étiquettes, détection depuis un dépôt lu. */
import { normalizeDomains } from "@/lib/domains";
import type { ListedRepo, RepoBundle } from "./client";
import { type Detection, detectProject } from "./detect";
import {
	parseComposeImages,
	parsePackageJson,
	parsePyproject,
	parseRequirements,
} from "./manifests";
import {
	type FieldDiff,
	fullNameOf,
	type RemoteRepo,
	type SyncProject,
	type SyncStatus,
	syncStatus,
} from "./sync";

/** Sélection Prisma des champs synchronisables (relations aplaties par `toBoardProject`). */
export const SYNC_SELECT = {
	id: true,
	title: true,
	description: true,
	lastUpdate: true,
	isPrivate: true,
	github: true,
	githubRepoId: true,
	status: true,
	languages: { select: { language: true } },
	databases: { select: { database: true } },
	backends: { select: { backend: true } },
	frontends: { select: { frontend: true } },
	devops: { select: { devops: true } },
	mlStack: { select: { ml: true } },
	domains: { select: { domain: true } },
	practices: { select: { practice: true } },
} as const;

export interface DbProjectRow {
	id: number;
	title: string;
	description: string;
	lastUpdate: Date | null;
	isPrivate: boolean;
	github: string | null;
	githubRepoId: number | null;
	status: string | null;
	languages: { language: string }[];
	databases: { database: string }[];
	backends: { backend: string }[];
	frontends: { frontend: string }[];
	devops: { devops: string }[];
	mlStack: { ml: string }[];
	domains: { domain: string }[];
	practices: { practice: string }[];
}

export interface BoardProject extends SyncProject {
	id: number;
	title: string;
}

export function toBoardProject(row: DbProjectRow): BoardProject {
	return {
		id: row.id,
		title: row.title,
		description: row.description,
		lastUpdate: row.lastUpdate,
		isPrivate: row.isPrivate,
		github: row.github,
		githubRepoId: row.githubRepoId,
		status: row.status,
		languages: row.languages.map((x) => x.language),
		databases: row.databases.map((x) => x.database),
		backends: row.backends.map((x) => x.backend),
		frontends: row.frontends.map((x) => x.frontend),
		devops: row.devops.map((x) => x.devops),
		mlStack: row.mlStack.map((x) => x.ml),
		domains: row.domains.map((x) => x.domain),
		practices: row.practices.map((x) => x.practice),
	};
}

/** Dépôt de la liste (sans listes détectées). */
export function toRemoteRepo(r: ListedRepo): RemoteRepo {
	return {
		id: r.id,
		fullName: r.full_name,
		description: r.description,
		pushedAt: r.pushed_at ? new Date(r.pushed_at) : null,
		isPrivate: r.private,
		archived: r.archived,
	};
}

/** Détection à partir d'un dépôt lu en entier. */
export function detectFromBundle(bundle: RepoBundle): Detection {
	const { manifests: m, meta } = bundle;
	return detectProject({
		primaryLanguage: meta.language,
		filePaths: bundle.filePaths,
		npm: m.packageJson ? parsePackageJson(m.packageJson) : [],
		python: [
			...(m.requirements ? parseRequirements(m.requirements) : []),
			...(m.pyproject ? parsePyproject(m.pyproject) : []),
		],
		composeImages: m.compose.flatMap(parseComposeImages),
		hasCargo: m.cargo !== null,
		readmeHead: bundle.readmeHead,
		topics: meta.topics ?? [],
	});
}

/** Dépôt complet : métadonnées + listes détectées (domaines normalisés). */
export function remoteFromBundle(
	bundle: RepoBundle,
	detected: Detection,
): RemoteRepo {
	const { meta } = bundle;
	return {
		id: meta.id,
		fullName: meta.full_name,
		description: meta.description,
		pushedAt: meta.pushed_at ? new Date(meta.pushed_at) : null,
		isPrivate: meta.private,
		archived: meta.archived,
		languages: [...detected.languages],
		databases: [...detected.databases],
		backends: [...detected.backends],
		frontends: [...detected.frontends],
		devops: [...detected.devops],
		mlStack: [...detected.mlStack],
		domains: normalizeDomains(detected.domains),
		practices: [...detected.practices],
	};
}

export interface BoardRow {
	key: string;
	status: SyncStatus;
	repo: RemoteRepo | null;
	project: BoardProject | null;
}

/**
 * Une ligne par dépôt (ordre de la liste), puis une par projet « disparu ».
 * Les projets sans URL GitHub sont ignorés. Appariement : `githubRepoId`, puis nom complet.
 */
export function buildBoardRows(
	repos: RemoteRepo[],
	projects: BoardProject[],
): BoardRow[] {
	const linked = projects.filter((p) => fullNameOf(p.github) !== null);
	const byId = new Map<number, BoardProject>();
	const byName = new Map<string, BoardProject>();
	for (const p of linked) {
		if (p.githubRepoId !== null) byId.set(p.githubRepoId, p);
		const name = fullNameOf(p.github);
		if (name) byName.set(name.toLowerCase(), p);
	}
	const used = new Set<number>();
	const rows: BoardRow[] = repos.map((repo) => {
		const project =
			byId.get(repo.id) ?? byName.get(repo.fullName.toLowerCase()) ?? null;
		if (project) used.add(project.id);
		return {
			key: repo.fullName,
			status: syncStatus({ repo, project }),
			repo,
			project,
		};
	});
	for (const project of linked) {
		if (used.has(project.id)) continue;
		rows.push({
			key: `missing-${project.id}`,
			status: "missing",
			repo: null,
			project,
		});
	}
	return rows;
}

export const STATUS_LABELS: Record<SyncStatus, string> = {
	new: "nouveau",
	"up-to-date": "à jour",
	modified: "modifié",
	archived: "archivé sur GitHub",
	renamed: "renommé",
	missing: "disparu",
};

export const FIELD_LABELS: Record<FieldDiff["field"], string> = {
	description: "Description",
	lastUpdate: "Dernière mise à jour",
	isPrivate: "Visibilité",
	github: "Adresse GitHub (renommage)",
	status: "Statut",
	languages: "Langages",
	databases: "Bases de données",
	backends: "Back-end",
	frontends: "Front-end",
	devops: "DevOps",
	mlStack: "Stack ML",
	domains: "Domaines",
	practices: "Pratiques",
};

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
	dateStyle: "medium",
	timeZone: "UTC",
});

export function formatValue(
	field: FieldDiff["field"],
	value: string | boolean | Date | null,
): string {
	if (value === null || value === "") return "—";
	if (value instanceof Date) return dateFmt.format(value);
	if (field === "isPrivate") return value ? "privé" : "public";
	if (field === "status")
		return value === "Archived" ? "archivé" : String(value);
	return String(value);
}

export const formatPushed = (d: Date | null) => (d ? dateFmt.format(d) : "—");

/** Résumé d'une analyse : « à jour » ou « n écart(s) ». */
export function summarizeDiff(diff: FieldDiff[]): string {
	return diff.length === 0
		? "à jour"
		: `${diff.length} écart${diff.length > 1 ? "s" : ""}`;
}

/** Titre proposé pour un nouveau dépôt : nom du dépôt. */
export const repoName = (fullName: string) =>
	fullName.split("/")[1] ?? fullName;

/** Valeur de `status` du titre de statut d'un résultat d'analyse. */
export interface AnalyzeOk {
	ok: true;
	remote: RemoteRepo;
	projectId: number | null;
	diff: FieldDiff[];
	images: string[];
}
export type AnalyzeResult = AnalyzeOk | { ok: false; error: string };
