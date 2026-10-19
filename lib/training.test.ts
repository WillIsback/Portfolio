import { describe, expect, it } from "vitest";
import { frTranslator } from "@/i18n/fr";
import fr from "@/messages/fr.json";
import {
	looksLikeOpenClassrooms,
	TRAININGS,
	trainingBadge,
	trainingBadgeShort,
	trainingLabels,
} from "./training";

describe("training", () => {
	const t = frTranslator("training");

	it("deux parcours et libellés exacts", () => {
		expect(TRAININGS).toEqual(["FullstackAI", "AIEngineer"]);
		const labels = trainingLabels(t);
		expect(labels.FullstackAI).toBe(fr.training.FullstackAI);
		expect(labels.AIEngineer).toBe(fr.training.AIEngineer);
		expect(trainingBadge(t, "FullstackAI")).toBe(
			"Projet de formation · OpenClassrooms · Développeur FullStack IA",
		);
		expect(trainingBadge(t, "AIEngineer")).toBe(
			"Projet de formation · OpenClassrooms · AI Engineer",
		);
		expect(trainingBadgeShort(t, "AIEngineer")).toBe(
			"Formation OC · AI Engineer",
		);
	});

	it("couvre chaque parcours d'un libellé non vide", () => {
		const labels = trainingLabels(t);
		expect(Object.keys(labels).sort()).toEqual([...TRAININGS].sort());
		for (const training of TRAININGS)
			expect(labels[training].trim().length).toBeGreaterThan(0);
	});

	it("indice OpenClassrooms sur le nom du dépôt", () => {
		for (const n of [
			"P13-Fashion-Insta",
			"OC-P7-DataImmo",
			"p12-phase1-zenassist",
			"OC_P5_Deployez",
			"OC-Ai-Engineer-P3",
			"P8-bottleneck",
		])
			expect(looksLikeOpenClassrooms(n)).toBe(true);
		for (const n of [
			"portfolio",
			"ops-tools",
			"Python-utils",
			"p-thing",
			"occam",
		])
			expect(looksLikeOpenClassrooms(n)).toBe(false);
	});
});
