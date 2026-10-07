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
		"--ink-soft",
		"--note",
	])("%s est défini en clair et en sombre", (token) => {
		expect(block(":root")).toContain(`${token}:`);
		expect(block("\\.dark")).toContain(`${token}:`);
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
});
