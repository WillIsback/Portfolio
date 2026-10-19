import { describe, expect, it } from "vitest";
import { frTranslator } from "@/i18n/fr";
import { routing } from "@/i18n/routing";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import zh from "@/messages/zh.json";
import { ageOn, PARCOURS_IDS, parcours } from "./about";

describe("about", () => {
	it("calcule l'âge à une date donnée, anniversaire compris", () => {
		expect(ageOn(new Date("2026-04-30T12:00:00Z"))).toBe(32);
		expect(ageOn(new Date("2026-05-01T12:00:00Z"))).toBe(33);
	});

	it("aucune mention RNCP ; diplôme full stack gardé, AI Engineer en cours", () => {
		const steps = parcours(frTranslator("parcours"));
		expect(steps).toHaveLength(6);
		for (const s of steps)
			expect(s.description).not.toMatch(/RNCP|EQF|niveau [67]|bac \+/i);
		expect(
			steps.some((s) => s.title === "Diplômé Développeur full stack"),
		).toBe(true);
		expect(
			steps.some((s) => /validé en juillet 2026/.test(s.description)),
		).toBe(true);
		const last = steps[steps.length - 1];
		expect(last.title).toBe("Parcours AI Engineer");
		expect(last.year).toContain("en cours");
		expect(last.description).not.toMatch(/obtenu|diplômé/i);
	});
});

/**
 * `parcours()` indexe le dictionnaire entrée par entrée : une étape desajoutée de
 * `PARCOURS_IDS` sans l'être de `messages/*.json` renverrait une clé manquante (donc la
 * chaîne brute, ou une erreur ICU selon la config), pas une étape vide. Ce filet ferme
 * les deux listes l'une sur l'autre.
 */
describe("parcours ↔ dictionnaire", () => {
	const steps = parcours(frTranslator("parcours"));

	it("chaque identifiant a bien une étape à trois champs remplis", () => {
		expect(Object.keys(fr.parcours).sort()).toEqual([...PARCOURS_IDS].sort());
		expect(steps).toHaveLength(PARCOURS_IDS.length);
		for (const step of steps) {
			expect(step.year.trim().length).toBeGreaterThan(0);
			expect(step.title.trim().length).toBeGreaterThan(0);
			expect(step.description.trim().length).toBeGreaterThan(0);
		}
	});

	it("chaque locale rend les six étapes, dans le même ordre", () => {
		const dictionaries = { fr, en, zh } as const;
		for (const locale of routing.locales) {
			expect(Object.keys(dictionaries[locale].parcours).sort()).toEqual(
				[...PARCOURS_IDS].sort(),
			);
		}
		// L'ordre est celui de `PARCOURS_IDS` : les étapes suivent la chronologie, pas
		// l'ordre alphabétique des clés.
		expect(fr.parcours.automaticien.year).toBe(steps[0].year);
		expect(fr.parcours.aiEngineer.year).toBe(steps[steps.length - 1].year);
	});

	it("chaque étape est traduite dans les deux autres langues", () => {
		expect(en.parcours.automaticien.title).not.toBe(
			fr.parcours.automaticien.title,
		);
		expect(zh.parcours.automaticien.title).not.toBe(
			fr.parcours.automaticien.title,
		);
		// L'apostrophe est un caractère d'échappement en ICU : « l'IA » doit survivre.
		expect(fr.parcours.adminSysteme.description).toContain("l'Éducation");
	});
});
