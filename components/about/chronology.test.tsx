import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PARCOURS } from "@/lib/about";
import Chronology from "./Chronology";

describe("Chronology", () => {
	const html = renderToStaticMarkup(<Chronology steps={PARCOURS} />);

	it("est une liste ordonnée d'étapes datées, titres en h2", () => {
		expect(html).toContain("<ol");
		expect(html.match(/<h2/g)?.length).toBe(PARCOURS.length);
		expect(html).toContain("font-mono");
		expect(html).toContain(PARCOURS[0].year);
	});

	it("numérote les étapes (vraie chronologie) et ne cache rien au repos", () => {
		expect(html).toContain("01");
		expect(html).not.toContain("opacity:0");
	});

	it("trace la ligne au défilement seulement là où c'est supporté, et jamais en mouvement réduit", () => {
		const css = readFileSync(
			path.join(process.cwd(), "app/globals.css"),
			"utf8",
		);
		expect(css).toMatch(/@supports \(animation-timeline: view\(\)\)/);
		expect(css).toMatch(
			/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.chrono-ink[\s\S]*animation: none/,
		);
	});

	it("la page À propos n'utilise plus framer-motion", () => {
		const page = readFileSync(
			path.join(process.cwd(), "app/About/page.tsx"),
			"utf8",
		);
		expect(page).not.toContain("framer-motion");
		expect(page).not.toContain('"use client"');
	});
});
