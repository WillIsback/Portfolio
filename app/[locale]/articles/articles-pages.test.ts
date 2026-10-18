import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (f: string) => readFileSync(path.join(process.cwd(), f), "utf8");

describe("pages articles (carnet)", () => {
	it("la liste réutilise les entrées datées de l'accueil", () => {
		expect(read("app/articles/page.tsx")).toContain("<LatestEntries");
	});

	it("la prose n'a plus de dégradé décoratif et lit en Source Serif", () => {
		const css = read("app/articles/articles.css");
		expect(css).not.toContain("linear-gradient");
		expect(css).toMatch(
			/\.article-prose\s*\{[^}]*font-family:\s*var\(--font-serif\)/,
		);
	});

	it("la date de l'article est en Fira Code", () => {
		expect(read("app/articles/[slug]/page.tsx")).toMatch(
			/font-mono[^>]*>\s*<time/,
		);
	});
});
