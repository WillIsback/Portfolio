import { describe, expect, it } from "vitest";
import {
	applyAccepted,
	computeDiff,
	matchByRepoName,
	type RemoteRepo,
	type SyncProject,
	shouldBackfillRepoId,
	syncStatus,
} from "./sync";

const date = new Date("2026-10-01T00:00:00Z");
const project: SyncProject = {
	description: "Un projet",
	lastUpdate: date,
	isPrivate: false,
	github: "https://github.com/WillIsback/demo",
	githubRepoId: 42,
	status: "InProgress",
	languages: ["Python"],
	databases: [],
	backends: ["FastAPI"],
	frontends: [],
	devops: ["Docker"],
	mlStack: [],
	domains: ["ML"],
};
const remote: RemoteRepo = {
	id: 42,
	fullName: "WillIsback/demo",
	description: "Un projet",
	pushedAt: date,
	isPrivate: false,
	archived: false,
	languages: ["Python"],
	databases: [],
	backends: ["FastAPI"],
	frontends: [],
	devops: ["Docker"],
	mlStack: [],
	domains: ["ML"],
};

describe("computeDiff", () => {
	it("aucun écart → []", () => {
		expect(computeDiff(project, remote)).toEqual([]);
	});
	it("écart de liste : ajouts et retraits", () => {
		const diffs = computeDiff(project, {
			...remote,
			devops: ["GithubActions"],
		});
		expect(diffs).toEqual([
			{
				field: "devops",
				kind: "list",
				added: ["GithubActions"],
				removed: ["Docker"],
				proposedList: ["GithubActions"],
			},
		]);
	});
	it("écarts scalaires", () => {
		const later = new Date("2026-10-05T00:00:00Z");
		const diffs = computeDiff(project, {
			...remote,
			description: "Nouveau",
			pushedAt: later,
			isPrivate: true,
		});
		expect(diffs.map((d) => d.field)).toEqual([
			"description",
			"lastUpdate",
			"isPrivate",
		]);
		expect(diffs[1]).toMatchObject({ current: date, proposed: later });
	});
	it("description distante vide : jamais proposée", () => {
		expect(computeDiff(project, { ...remote, description: null })).toEqual([]);
	});
	it("listes non analysées : ignorées", () => {
		expect(
			computeDiff(project, {
				id: 42,
				fullName: "WillIsback/demo",
				description: "Un projet",
				pushedAt: date,
				isPrivate: false,
				archived: false,
			}),
		).toEqual([]);
	});
	it("un champ éditorial n'apparaît jamais (hors statut d'archivage)", () => {
		const diffs = computeDiff(
			{ ...project, status: "Done" },
			{ ...remote, description: "x", devops: [], domains: ["LLM"] },
		);
		const fields = diffs.map((d) => d.field as string);
		for (const editorial of [
			"title",
			"pitch",
			"period",
			"imagePath",
			"featuredRank",
			"status",
		])
			expect(fields).not.toContain(editorial);
	});
	it("renommage : propose la nouvelle URL", () => {
		const diffs = computeDiff(project, {
			...remote,
			fullName: "WillIsback/new",
		});
		expect(diffs).toEqual([
			{
				field: "github",
				kind: "scalar",
				current: "https://github.com/WillIsback/demo",
				proposed: "https://github.com/WillIsback/new",
			},
		]);
	});
	it("archivé : propose status Archived, sauf s'il l'est déjà", () => {
		const archived = { ...remote, archived: true };
		expect(computeDiff(project, archived)).toEqual([
			{
				field: "status",
				kind: "scalar",
				current: "InProgress",
				proposed: "Archived",
			},
		]);
		expect(computeDiff({ ...project, status: "Archived" }, archived)).toEqual(
			[],
		);
	});
});

describe("syncStatus", () => {
	it("new / missing", () => {
		expect(syncStatus({ repo: remote, project: null })).toBe("new");
		expect(syncStatus({ repo: null, project })).toBe("missing");
	});
	it("up-to-date / modified", () => {
		expect(syncStatus({ repo: remote, project })).toBe("up-to-date");
		expect(
			syncStatus({ repo: { ...remote, description: "autre" }, project }),
		).toBe("modified");
	});
	it("renamed : même id, full_name différent (casse ignorée)", () => {
		expect(
			syncStatus({ repo: { ...remote, fullName: "WillIsback/new" }, project }),
		).toBe("renamed");
		expect(
			syncStatus({ repo: { ...remote, fullName: "willisback/DEMO" }, project }),
		).toBe("up-to-date");
		expect(
			syncStatus({
				repo: { ...remote, id: 7, fullName: "WillIsback/new" },
				project,
			}),
		).toBe("up-to-date");
	});
	it("archived", () => {
		expect(syncStatus({ repo: { ...remote, archived: true }, project })).toBe(
			"archived",
		);
		expect(
			syncStatus({
				repo: { ...remote, archived: true },
				project: { ...project, status: "Archived" },
			}),
		).toBe("up-to-date");
	});
});

describe("applyAccepted", () => {
	const diffs = computeDiff(project, {
		...remote,
		description: "Nouveau",
		devops: [],
		pushedAt: new Date("2026-10-05T00:00:00Z"),
	});
	it("ne retient que les champs cochés", () => {
		expect(applyAccepted(project, diffs, ["description", "devops"])).toEqual({
			description: "Nouveau",
			devops: [],
		});
	});
	it("rien de coché → objet vide ; champ sans écart ignoré", () => {
		expect(applyAccepted(project, diffs, [])).toEqual({});
		expect(applyAccepted(project, diffs, ["isPrivate", "title"])).toEqual({});
	});
});

describe("matchByRepoName / shouldBackfillRepoId", () => {
	const cands = [
		{ id: 1, github: "http://www.github.com/Me/Repo.git" },
		{ id: 2, github: "https://github.com/me/other/" },
		{ id: 3, github: null },
	];
	it("apparie une URL non canonique sans tenir compte de la casse", () => {
		expect(matchByRepoName(cands, "me/repo")?.id).toBe(1);
		expect(matchByRepoName(cands, "ME/OTHER")?.id).toBe(2);
	});
	it("ne trouve rien pour un autre dépôt", () => {
		expect(matchByRepoName(cands, "me/none")).toBeNull();
	});
	it("renseigne l'identifiant seulement s'il manque", () => {
		expect(shouldBackfillRepoId({ githubRepoId: null })).toBe(true);
		expect(shouldBackfillRepoId({ githubRepoId: 5 })).toBe(false);
	});
});
