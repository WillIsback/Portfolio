import { describe, expect, it } from "vitest";
import { ageOn, PARCOURS } from "./about";

describe("about", () => {
	it("calcule l'âge à une date donnée, anniversaire compris", () => {
		expect(ageOn(new Date("2026-04-30T12:00:00Z"))).toBe(32);
		expect(ageOn(new Date("2026-05-01T12:00:00Z"))).toBe(33);
	});

	it("aucune mention RNCP ; diplôme full stack gardé, AI Engineer en cours", () => {
		expect(PARCOURS).toHaveLength(6);
		for (const s of PARCOURS)
			expect(s.description).not.toMatch(/RNCP|EQF|niveau [67]|bac \+/i);
		expect(
			PARCOURS.some((s) => s.title === "Diplômé Développeur full stack"),
		).toBe(true);
		expect(
			PARCOURS.some((s) => /validé en juillet 2026/.test(s.description)),
		).toBe(true);
		const last = PARCOURS[PARCOURS.length - 1];
		expect(last.title).toBe("Parcours AI Engineer");
		expect(last.year).toContain("en cours");
		expect(last.description).not.toMatch(/obtenu|diplômé/i);
	});
});
