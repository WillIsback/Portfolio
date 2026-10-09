/** Statut de synchronisation et écarts GitHub ↔ base. Logique pure. */

export type SyncStatus =
	| "new"
	| "up-to-date"
	| "modified"
	| "archived"
	| "renamed"
	| "missing";

/** Dépôt GitHub tel que lu. Les listes détectées sont absentes tant que le dépôt n'est pas analysé. */
export interface RemoteRepo {
	id: number;
	fullName: string;
	description: string | null;
	pushedAt: Date | null;
	isPrivate: boolean;
	archived: boolean;
	languages?: string[];
	databases?: string[];
	backends?: string[];
	frontends?: string[];
	devops?: string[];
	mlStack?: string[];
	domains?: string[];
}

/** Projet en base, relations aplaties en listes de valeurs d'enum. */
export interface SyncProject {
	description: string;
	lastUpdate: Date | null;
	isPrivate: boolean;
	github: string | null;
	githubRepoId: number | null;
	status: string | null;
	languages: string[];
	databases: string[];
	backends: string[];
	frontends: string[];
	devops: string[];
	mlStack: string[];
	domains: string[];
}

export const LIST_FIELDS = [
	"languages",
	"databases",
	"backends",
	"frontends",
	"devops",
	"mlStack",
	"domains",
] as const;
export type ListField = (typeof LIST_FIELDS)[number];
export type ScalarField =
	| "description"
	| "lastUpdate"
	| "isPrivate"
	| "github"
	| "status";

export type FieldDiff =
	| {
			field: ScalarField;
			kind: "scalar";
			current: string | boolean | Date | null;
			proposed: string | boolean | Date;
	  }
	| {
			field: ListField;
			kind: "list";
			added: string[];
			removed: string[];
			proposedList: string[];
	  };

export const GITHUB_URL_PREFIX = "https://github.com/";

/** `owner/repo` d'une URL GitHub en base, ou null. */
export function fullNameOf(url: string | null): string | null {
	if (!url) return null;
	const match = /github\.com\/([^/\s]+\/[^/\s#?]+?)(?:\.git)?\/?$/i.exec(url);
	return match ? match[1] : null;
}

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function isRenamed(repo: RemoteRepo, project: SyncProject): boolean {
	if (project.githubRepoId === null || project.githubRepoId !== repo.id)
		return false;
	const current = fullNameOf(project.github);
	return current !== null && !sameName(current, repo.fullName);
}

function sameTime(a: Date | null, b: Date | null): boolean {
	return (a?.getTime() ?? null) === (b?.getTime() ?? null);
}

export function computeDiff(
	project: SyncProject,
	remote: RemoteRepo,
): FieldDiff[] {
	const diffs: FieldDiff[] = [];

	if (remote.description && remote.description !== project.description) {
		diffs.push({
			field: "description",
			kind: "scalar",
			current: project.description,
			proposed: remote.description,
		});
	}
	if (remote.pushedAt && !sameTime(remote.pushedAt, project.lastUpdate)) {
		diffs.push({
			field: "lastUpdate",
			kind: "scalar",
			current: project.lastUpdate,
			proposed: remote.pushedAt,
		});
	}
	if (remote.isPrivate !== project.isPrivate) {
		diffs.push({
			field: "isPrivate",
			kind: "scalar",
			current: project.isPrivate,
			proposed: remote.isPrivate,
		});
	}
	if (isRenamed(remote, project)) {
		diffs.push({
			field: "github",
			kind: "scalar",
			current: project.github,
			proposed: `${GITHUB_URL_PREFIX}${remote.fullName}`,
		});
	}
	for (const field of LIST_FIELDS) {
		const proposedList = remote[field];
		if (!proposedList) continue;
		const current = project[field];
		const added = proposedList.filter((v) => !current.includes(v));
		const removed = current.filter((v) => !proposedList.includes(v));
		if (added.length || removed.length) {
			diffs.push({ field, kind: "list", added, removed, proposedList });
		}
	}
	// Seule exception au statut éditorial : un dépôt archivé propose « Archived » (case à cocher).
	if (remote.archived && project.status !== "Archived") {
		diffs.push({
			field: "status",
			kind: "scalar",
			current: project.status,
			proposed: "Archived",
		});
	}
	return diffs;
}

/** `repo` null = le dépôt n'est plus dans la liste (« missing »). */
export function syncStatus({
	repo,
	project,
}: {
	repo: RemoteRepo | null;
	project: SyncProject | null;
}): SyncStatus {
	if (!project) return repo ? "new" : "missing";
	if (!repo) return "missing";
	if (isRenamed(repo, project)) return "renamed";
	if (repo.archived && project.status !== "Archived") return "archived";
	return computeDiff(project, repo).length > 0 ? "modified" : "up-to-date";
}

/** Objet de mise à jour minimal : uniquement les champs cochés ayant un écart. */
export function applyAccepted(
	_project: SyncProject,
	diffs: FieldDiff[],
	acceptedFields: readonly string[],
): Record<string, unknown> {
	const update: Record<string, unknown> = {};
	for (const diff of diffs) {
		if (!acceptedFields.includes(diff.field)) continue;
		update[diff.field] =
			diff.kind === "list" ? diff.proposedList : diff.proposed;
	}
	return update;
}
