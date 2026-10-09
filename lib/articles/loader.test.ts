import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	getAllArticles,
	getArticleBySlug,
	getArticleSlugs,
	latestArticles,
	parseArticle,
	parseFrontmatter,
	projectEntries,
	readingTime,
} from "./loader";

function mdx(fm: Record<string, string>, body = "Bonjour le monde.") {
	const lines = Object.entries(fm).map(([k, v]) => `${k}: ${v}`);
	return `---\n${lines.join("\n")}\n---\n\n${body}\n`;
}

let dir: string;

beforeAll(() => {
	dir = fs.mkdtempSync(path.join(os.tmpdir(), "articles-"));
	fs.writeFileSync(
		path.join(dir, "ancien.mdx"),
		mdx({
			title: '"Ancien"',
			description: '"Plus vieux"',
			date: '"2025-01-15"',
			tags: '["a"]',
		}),
	);
	fs.writeFileSync(
		path.join(dir, "recent.mdx"),
		mdx(
			{
				title: '"Récent"',
				description: '"Le plus récent"',
				date: "2026-10-07", // unquoted: YAML parses it as a Date
				period: '"27 sept. → 6 oct. 2026"',
				tags: '["SRE", "LLM local"]',
				status: '"Expérience close"',
			},
			"mot ".repeat(660),
		),
	);
	fs.writeFileSync(
		path.join(dir, "milieu.mdx"),
		mdx({
			title: '"Milieu"',
			description: '"Entre les deux"',
			date: '"2026-03-01"',
			tags: "[]",
		}),
	);
	fs.writeFileSync(path.join(dir, "notes.md"), "pas un article");
	fs.writeFileSync(path.join(dir, "Bad Slug.mdx"), "ignored");
});

afterAll(() => {
	fs.rmSync(dir, { recursive: true, force: true });
});

describe("parseFrontmatter", () => {
	it("keeps required and optional fields", () => {
		expect(
			parseFrontmatter({
				title: "T",
				description: "D",
				date: "2026-10-07",
				period: "P",
				tags: ["x", "y"],
				status: "S",
			}),
		).toEqual({
			title: "T",
			description: "D",
			date: "2026-10-07",
			period: "P",
			tags: ["x", "y"],
			status: "S",
		});
	});

	it("normalises a YAML Date to YYYY-MM-DD", () => {
		const fm = parseFrontmatter({
			title: "T",
			description: "D",
			date: new Date("2026-10-07T00:00:00Z"),
		});
		expect(fm.date).toBe("2026-10-07");
		expect(fm.tags).toEqual([]);
		expect(fm.period).toBeUndefined();
	});

	it("rejects missing title, bad date and non-string tags", () => {
		expect(() =>
			parseFrontmatter({ description: "D", date: "2026-10-07" }),
		).toThrow(/title/);
		expect(() =>
			parseFrontmatter({ title: "T", description: "D", date: "07/10/2026" }),
		).toThrow(/date/);
		expect(() =>
			parseFrontmatter({
				title: "T",
				description: "D",
				date: "2026-10-07",
				tags: [1],
			}),
		).toThrow(/tags/);
	});
});

describe("readingTime", () => {
	it("is at least one minute", () => {
		expect(readingTime("")).toBe(1);
		expect(readingTime("trois petits mots")).toBe(1);
	});

	it("scales with word count at 220 wpm", () => {
		expect(readingTime("mot ".repeat(660))).toBe(3);
		expect(readingTime("mot ".repeat(2200))).toBe(10);
	});

	it("counts accented words and ignores markup", () => {
		const words = "élégant façon où ".repeat(100); // 300 words
		expect(readingTime(`<Lesson title="x">\n${words}\n</Lesson>`)).toBe(1);
		expect(readingTime(words.repeat(4))).toBe(5); // 1200 / 220 ≈ 5.45
	});
});

describe("loader", () => {
	it("lists valid .mdx slugs only, sorted", () => {
		expect(getArticleSlugs(dir)).toEqual(["ancien", "milieu", "recent"]);
	});

	it("returns an empty list for a missing directory", () => {
		expect(getArticleSlugs(path.join(dir, "nope"))).toEqual([]);
	});

	it("sorts articles newest first and drops the body", () => {
		const all = getAllArticles(dir);
		expect(all.map((a) => a.slug)).toEqual(["recent", "milieu", "ancien"]);
		expect(all[0]).not.toHaveProperty("content");
		expect(all[0].readingTimeMinutes).toBe(3);
		expect(all[0].date).toBe("2026-10-07");
	});

	it("loads one article with frontmatter stripped from content", () => {
		const a = getArticleBySlug("recent", dir);
		expect(a?.title).toBe("Récent");
		expect(a?.tags).toEqual(["SRE", "LLM local"]);
		expect(a?.status).toBe("Expérience close");
		expect(a?.content).not.toContain("---");
	});

	it("returns null for unknown or unsafe slugs", () => {
		expect(getArticleBySlug("inconnu", dir)).toBeNull();
		expect(getArticleBySlug("../etc/passwd", dir)).toBeNull();
	});

	it("parses the real article in content/articles", () => {
		const a = getArticleBySlug("neuf-agents-neuf-jours");
		expect(a?.title).toBe("Neuf agents, neuf jours");
		expect(a?.date).toBe("2026-10-07");
		expect(a?.tags).toContain("SRE");
		expect(a?.readingTimeMinutes).toBeGreaterThan(5);
	});

	it("parseArticle reports the file on invalid frontmatter", () => {
		expect(() => parseArticle("x", mdx({ title: '"T"' }))).toThrow(/x\.mdx/);
	});
});

describe("frontmatter projects", () => {
	const base = { title: "T", description: "D", date: "2026-10-01", tags: [] };

	it("accepte une liste d'identifiants de projets", () => {
		expect(
			parseFrontmatter({ ...base, projects: [3, 12] }, "a.mdx").projects,
		).toEqual([3, 12]);
	});

	it("reste absent quand il n'est pas renseigné", () => {
		expect(parseFrontmatter(base, "a.mdx").projects).toBeUndefined();
	});

	it("refuse un identifiant qui n'est pas un entier positif", () => {
		expect(() => parseFrontmatter({ ...base, projects: [0] }, "a.mdx")).toThrow(
			"projects",
		);
		expect(() =>
			parseFrontmatter({ ...base, projects: ["x"] }, "a.mdx"),
		).toThrow("projects");
	});
});

describe("projectEntries", () => {
	it("associe chaque projet à l'article le plus récent qui le cite", () => {
		const meta = (slug: string, date: string, projects?: number[]) => ({
			slug,
			title: slug.toUpperCase(),
			description: "",
			date,
			tags: [],
			readingTimeMinutes: 1,
			projects,
		});
		expect(
			projectEntries([
				meta("old", "2026-01-01", [3]),
				meta("new", "2026-06-01", [3, 7]),
				meta("none", "2026-07-01"),
			]),
		).toEqual({
			3: { slug: "new", title: "NEW" },
			7: { slug: "new", title: "NEW" },
		});
	});
});

describe("latestArticles", () => {
	it("renvoie au plus n articles, du plus récent au plus ancien", () => {
		const all = latestArticles(10);
		expect(all.length).toBeGreaterThan(0);
		const dates = all.map((a) => a.date);
		expect([...dates].sort().reverse()).toEqual(dates);
		expect(latestArticles(0)).toEqual([]);
	});
});
