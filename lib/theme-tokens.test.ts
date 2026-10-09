import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(
	path.join(process.cwd(), "app", "globals.css"),
	"utf8",
);

function block(selector: string): string {
	const match = css.match(
		new RegExp(`^${selector}\\s*\\{([\\s\\S]*?)^\\}`, "m"),
	);
	if (!match) throw new Error(`bloc ${selector} introuvable`);
	return match[1];
}

describe("tokens du carnet", () => {
	it.each([
		"--paper-grid",
		"--paper-dot",
		"--ink-soft",
		"--note",
	])("%s est défini en clair et en sombre", (token) => {
		expect(block(":root")).toContain(`${token}:`);
		expect(block("\\.dark")).toContain(`${token}:`);
	});

	it("le fond est une trame de points de 24 px, plus un quadrillage scolaire", () => {
		const paper =
			css.match(/\.paper::before\s*\{([\s\S]*?)\n {2}\}/)?.[1] ?? "";
		expect(paper).toContain("radial-gradient(circle, var(--paper-dot)");
		expect(paper).toContain("background-size: 24px 24px");
		expect(paper).not.toMatch(/background-image:[^;]*linear-gradient/);
		expect(paper).toContain("mask-image");
	});

	it("l'accent reste indigo en clair et violet en sombre", () => {
		expect(block(":root")).toContain("--primary: oklch(0.45 0.15 270)");
		expect(block("\\.dark")).toContain("--primary: oklch(0.65 0.22 270)");
	});

	it("garde la police des titres pour l'italique à l'intérieur d'un titre", () => {
		expect(css).toMatch(
			/:is\(h1, h2, h3, h4\) :is\(em, i\)\s*\{\s*font-family: inherit;/,
		);
	});

	it("définit cinq teintes de groupe en clair et en sombre", () => {
		for (let i = 1; i <= 5; i++)
			expect(css.match(new RegExp(`--cluster-${i}:`, "g"))?.length).toBe(2);
	});

	it("neutralise toute animation de la carte en mouvement réduit", () => {
		expect(css).toMatch(
			/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.carnet-axis,\s*\.carnet-point,\s*\.carnet-query\s*\{\s*animation: none;/,
		);
	});
});
