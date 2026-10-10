import { describe, expect, it } from "vitest";
import { planWrite } from "./apply";
import {
	type BoardProject,
	buildBoardRows,
	formatValue,
	summarizeDiff,
	toBoardProject,
} from "./board";
import type { RemoteRepo } from "./sync";

const project = (over: Partial<BoardProject>): BoardProject => ({
	id: 1,
	title: "T",
	description: "d",
	lastUpdate: null,
	isPrivate: false,
	github: "https://github.com/me/a",
	githubRepoId: 10,
	status: null,
	languages: [],
	databases: [],
	backends: [],
	frontends: [],
	devops: [],
	mlStack: [],
	domains: [],
	practices: [],
	...over,
});
const repo = (over: Partial<RemoteRepo>): RemoteRepo => ({
	id: 10,
	fullName: "me/a",
	description: "d",
	pushedAt: null,
	isPrivate: false,
	archived: false,
	...over,
});

describe("buildBoardRows", () => {
	it("apparie par id, signale nouveau, renommé et disparu", () => {
		const rows = buildBoardRows(
			[
				repo({}),
				repo({ id: 11, fullName: "me/b" }),
				repo({ id: 12, fullName: "me/c2" }),
			],
			[
				project({}),
				project({ id: 2, github: "https://github.com/me/c", githubRepoId: 12 }),
				project({
					id: 3,
					github: "https://github.com/me/gone",
					githubRepoId: 99,
				}),
			],
		);
		expect(rows.map((r) => [r.key, r.status])).toEqual([
			["me/a", "up-to-date"],
			["me/b", "new"],
			["me/c2", "renamed"],
			["missing-3", "missing"],
		]);
	});
	it("ignore les projets sans URL GitHub", () => {
		const rows = buildBoardRows(
			[],
			[project({ id: 5, github: "" }), project({ id: 6, github: null })],
		);
		expect(rows).toEqual([]);
	});
	it("apparie par nom sans githubRepoId, insensible à la casse", () => {
		const rows = buildBoardRows(
			[repo({ fullName: "Me/A" })],
			[project({ githubRepoId: null })],
		);
		expect(rows[0].status).toBe("up-to-date");
		expect(rows[0].project?.id).toBe(1);
	});
	it("dépôt archivé non archivé en base", () => {
		const rows = buildBoardRows([repo({ archived: true })], [project({})]);
		expect(rows[0].status).toBe("archived");
	});
});

describe("toBoardProject / formats", () => {
	it("aplatit les relations", () => {
		const p = toBoardProject({
			id: 1,
			title: "T",
			description: "d",
			lastUpdate: null,
			isPrivate: false,
			github: null,
			githubRepoId: null,
			status: null,
			languages: [{ language: "Rust" }],
			databases: [],
			backends: [],
			frontends: [],
			devops: [],
			mlStack: [{ ml: "PyTorch" }],
			domains: [{ domain: "ML" }],
			practices: [{ practice: "Hardening" }],
		});
		expect(p.practices).toEqual(["Hardening"]);
		expect(p.languages).toEqual(["Rust"]);
		expect(p.mlStack).toEqual(["PyTorch"]);
		expect(p.domains).toEqual(["ML"]);
	});
	it("formatValue / summarizeDiff", () => {
		expect(formatValue("isPrivate", true)).toBe("privé");
		expect(formatValue("status", "Archived")).toBe("archivé");
		expect(formatValue("description", null)).toBe("—");
		expect(formatValue("lastUpdate", new Date("2026-01-05T00:00:00Z"))).toMatch(
			/2026/,
		);
		expect(summarizeDiff([])).toBe("à jour");
	});
});

describe("planWrite", () => {
	it("sépare scalaires et listes, normalise les domaines", () => {
		const plan = planWrite({
			description: "x",
			status: "Archived",
			languages: ["Rust"],
			domains: ["Classifier"],
		});
		expect(plan.scalars).toEqual({ description: "x", status: "Archived" });
		expect(plan.lists.languages).toEqual(["Rust"]);
		expect(plan.lists.domains).toEqual(["ML", "Classifier"]);
	});
	it("pratiques validées et normalisées", () => {
		expect(
			planWrite({ practices: ["LlmEvaluation", "Hardening"] }).lists.practices,
		).toEqual(["Hardening", "LlmEvaluation"]);
		expect(() => planWrite({ practices: ["Foo"] })).toThrow();
	});
	it("rejette champ éditorial et valeur hors énumération", () => {
		expect(() => planWrite({ title: "x" })).toThrow();
		expect(() => planWrite({ pitch: "x" })).toThrow();
		expect(() => planWrite({ languages: ["Cobol"] })).toThrow();
		expect(() => planWrite({ status: "Done" })).toThrow();
		expect(() => planWrite({ github: "http://evil.example/x/y" })).toThrow();
	});
});
