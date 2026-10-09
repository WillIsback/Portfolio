import { describe, expect, it } from "vitest";
import type { MapData } from "@/lib/carnet/map-types";
import type { NormalizedProject } from "@/lib/projects-data";
import {
	isCapture,
	mapNeighbors,
	projectYear,
	selectFeatured,
	splitIndex,
	techComposition,
	techNames,
} from "./register";

const project = (
	id: number,
	over: Partial<NormalizedProject> = {},
): NormalizedProject => ({
	id,
	title: `P${id}`,
	description: "",
	imagePath: null,
	github: `https://github.com/x/p${id}`,
	lastUpdate: new Date(`2026-0${(id % 9) + 1}-01T00:00:00Z`),
	isPrivate: false,
	isAiGenerated: false,
	createdAt: new Date(0),
	updatedAt: new Date(0),
	languages: [],
	databases: [],
	backends: [],
	frontends: [],
	devops: [],
	domains: [],
	mlStack: [],
	pitch: null,
	status: null,
	period: null,
	featuredRank: null,
	githubRepoId: null,
	...over,
});

describe("selectFeatured", () => {
	it("prend les projets publics à domaines, du plus récent au plus ancien, 6 au plus", () => {
		const ps = [1, 2, 3, 4, 5, 6, 7, 8].map((id) =>
			project(id, { domains: [{ domain: "ML" }] }),
		);
		const out = selectFeatured(ps);
		expect(out.map((p) => p.id)).toEqual([8, 7, 6, 5, 4, 3]);
	});

	it("complète jusqu'au minimum avec les projets publics les plus récents", () => {
		const ps = [
			project(1, { domains: [{ domain: "LLM" }] }),
			project(2),
			project(3),
			project(4),
			project(5),
		];
		expect(selectFeatured(ps).map((p) => p.id)).toEqual([1, 5, 4, 3]);
	});

	it("seuls les domaines étiquettent", () => {
		const ps = [
			project(1),
			project(2, { domains: [{ domain: "Vision" }], lastUpdate: new Date(0) }),
			project(3),
			project(4),
			project(5),
		];
		expect(selectFeatured(ps).map((p) => p.id)).toEqual([2, 5, 4, 3]);
	});

	it("n'inclut jamais un projet privé", () => {
		const ps = [
			project(1, { domains: [{ domain: "ML" }], isPrivate: true }),
			project(2),
			project(3),
			project(4),
			project(5),
		];
		expect(selectFeatured(ps).map((p) => p.id)).not.toContain(1);
	});

	it("suit le classement quand il existe, par rang croissant, 6 au plus", () => {
		const ps = [1, 2, 3, 4, 5, 6, 7, 8].map((id) =>
			project(id, { featuredRank: id === 8 ? 1 : id === 2 ? 2 : id + 2 }),
		);
		expect(selectFeatured(ps).map((p) => p.id)).toEqual([8, 2, 1, 3, 4, 5]);
	});

	it("sans classement, applique la règle automatique", () => {
		const ps = [1, 2, 3, 4, 5].map((id) => project(id));
		expect(selectFeatured(ps).map((p) => p.id)).toEqual([5, 4, 3, 2]);
	});

	it("exclut un projet privé classé", () => {
		const ps = [
			project(1, { featuredRank: 1, isPrivate: true }),
			project(2, { featuredRank: 2 }),
		];
		expect(selectFeatured(ps).map((p) => p.id)).toEqual([2]);
	});

	it("départage les rangs égaux par identifiant", () => {
		const ps = [
			project(3, { featuredRank: 1 }),
			project(1, { featuredRank: 1 }),
			project(2, { featuredRank: 1 }),
		];
		expect(selectFeatured(ps).map((p) => p.id)).toEqual([1, 2, 3]);
	});

	it("accepte une date sérialisée en chaîne (frontière de l'action serveur)", () => {
		const ps = [
			project(1, { lastUpdate: "2026-12-01T00:00:00.000Z" as unknown as Date }),
			project(2, { lastUpdate: new Date("2026-02-01T00:00:00Z") }),
			project(3, { lastUpdate: new Date("2026-03-01T00:00:00Z") }),
			project(4, { lastUpdate: new Date("2026-04-01T00:00:00Z") }),
			project(5, { lastUpdate: new Date("2026-05-01T00:00:00Z") }),
		];
		expect(selectFeatured(ps).map((p) => p.id)).toEqual([1, 5, 4, 3]);
	});
});

describe("splitIndex", () => {
	const all = [1, 2, 3, 4].map((id) => project(id));
	const featured = [all[0], all[1]];

	it("sans filtre, l'index exclut les projets phares", () => {
		expect(splitIndex(all, all, featured, false).map((p) => p.id)).toEqual([
			3, 4,
		]);
	});

	it("avec un filtre, l'index montre toutes les correspondances", () => {
		expect(
			splitIndex(all, [all[0], all[2]], featured, true).map((p) => p.id),
		).toEqual([1, 3]);
	});
});

describe("techComposition", () => {
	it("donne la part de chaque catégorie non vide, dans l'ordre fixe", () => {
		const p = project(1, {
			languages: [{ language: "Python" }, { language: "TypeScript" }],
			backends: [{ backend: "FastAPI" }],
			devops: [{ devops: "Docker" }],
		});
		expect(techComposition(p)).toEqual([
			{ key: "languages", label: "Langages", count: 2, share: 0.5 },
			{ key: "backends", label: "Back-end", count: 1, share: 0.25 },
			{ key: "devops", label: "DevOps", count: 1, share: 0.25 },
		]);
	});

	it("est vide pour un projet sans technologie", () => {
		expect(techComposition(project(1))).toEqual([]);
	});
});

describe("techNames", () => {
	it("liste les technologies dans l'ordre des catégories", () => {
		const p = project(1, {
			devops: [{ devops: "Docker" }],
			languages: [{ language: "Rust" }],
		});
		expect(techNames(p)).toEqual(["Rust", "Docker"]);
	});
});

describe("techNames libellés", () => {
	it("humanise les valeurs de la base, brut à défaut", () => {
		const p = project(1, {
			databases: [{ database: "Postgresql" }],
			frontends: [{ frontend: "NextJs" }],
			devops: [{ devops: "GithubActions" }],
			languages: [{ language: "Rust" as never }],
		});
		expect(techNames(p)).toEqual([
			"Rust",
			"PostgreSQL",
			"Next.js",
			"GitHub Actions",
		]);
	});
});

describe("isCapture", () => {
	it("ne reconnaît que des images matricielles, jamais un logo SVG ni l'image GitHub", () => {
		expect(isCapture("/captures/syntheo.webp")).toBe(true);
		expect(isCapture("https://example.com/shot.PNG")).toBe(true);
		expect(isCapture("logo/ML.svg")).toBe(false);
		expect(isCapture("https://opengraph.githubassets.com/1/x/y.png")).toBe(
			false,
		);
		expect(isCapture("")).toBe(false);
		expect(isCapture(null)).toBe(false);
	});
});

describe("mapNeighbors", () => {
	const map: MapData = {
		model: "m",
		generatedAt: "2026-10-09T00:00:00Z",
		clusters: [{ id: "c1", label: "g" }],
		items: [
			{
				id: "project:1",
				kind: "project",
				title: "A",
				href: "h",
				x: 0,
				y: 0,
				cluster: "c1",
				keywords: [],
				terms: [],
				vector: [1, 0],
			},
			{
				id: "project:2",
				kind: "project",
				title: "B",
				href: "h",
				x: 0,
				y: 0,
				cluster: "c1",
				keywords: [],
				terms: [],
				vector: [0.9, 0.1],
			},
			{
				id: "article:a",
				kind: "article",
				title: "C",
				href: "h",
				x: 0,
				y: 0,
				cluster: "c1",
				keywords: [],
				terms: [],
				vector: [0, 1],
			},
		],
	};

	it("donne les k plus proches de chaque projet, lui-même exclu", () => {
		const n = mapNeighbors(map, 1);
		expect(n["project:1"]).toEqual(["project:2"]);
		expect(n["project:2"]).toEqual(["project:1"]);
		expect(n["article:a"]).toBeUndefined();
	});
});

describe("projectYear", () => {
	it("donne l'année de dernière mise à jour", () => {
		expect(
			projectYear(project(1, { lastUpdate: new Date("2025-03-02T00:00:00Z") })),
		).toBe("2025");
		expect(projectYear(project(1, { lastUpdate: null }))).toBe("—");
	});

	it("accepte une date sérialisée en chaîne", () => {
		expect(
			projectYear(
				project(1, {
					lastUpdate: "2024-05-01T00:00:00.000Z" as unknown as Date,
				}),
			),
		).toBe("2024");
	});
});
