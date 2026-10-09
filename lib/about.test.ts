import { describe, expect, it } from "vitest";
import { ageOn, PARCOURS } from "./about";

describe("about", () => {
	it("calcule l'âge à une date donnée, anniversaire compris", () => {
		expect(ageOn(new Date("2026-04-30T12:00:00Z"))).toBe(32);
		expect(ageOn(new Date("2026-05-01T12:00:00Z"))).toBe(33);
	});

	it("garde le parcours de la PR #5, RNCP 7 jamais présenté comme obtenu", () => {
		expect(PARCOURS).toHaveLength(6);
		const last = PARCOURS[PARCOURS.length - 1];
		expect(last.title).toBe("Parcours AI Engineer");
		expect(last.year).toContain("en cours");
		expect(last.description).not.toMatch(/obtenu|diplômé/i);
		expect(PARCOURS.some((s) => s.description.includes("RNCP42641"))).toBe(
			true,
		);
	});
});
