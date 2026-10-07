import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) =>
	readFileSync(path.join(process.cwd(), file), "utf8");

describe("accueil L2", () => {
	it("est un composant serveur qui monte la Fig. 1", () => {
		const page = read("app/page.tsx");
		expect(page).not.toContain('"use client"');
		expect(page).toContain("CarnetExplorer");
	});

	it("a retiré l'animation du message vers Contact", () => {
		expect(
			existsSync(
				path.join(process.cwd(), "components/animation/HeroPrompt.tsx"),
			),
		).toBe(false);
		for (const file of [
			"app/page.tsx",
			"components/Header/Header.tsx",
			"components/Header/NavMenu.tsx",
			"app/About/page.tsx",
			"app/Contact/page.tsx",
			"app/articles/layout.tsx",
		]) {
			expect(read(file)).not.toMatch(
				/HeroPrompt|highlightContact|contactBtnRef/,
			);
		}
	});
});
