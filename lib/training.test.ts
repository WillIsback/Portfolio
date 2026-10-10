import { describe, expect, it } from "vitest";
import {
	looksLikeOpenClassrooms,
	TRAININGS,
	trainingBadge,
	trainingBadgeShort,
} from "./training";

describe("training", () => {
	it("deux parcours et libellés exacts", () => {
		expect(TRAININGS).toEqual(["FullstackAI", "AIEngineer"]);
		expect(trainingBadge("FullstackAI")).toBe(
			"Projet de formation · OpenClassrooms · Développeur FullStack IA",
		);
		expect(trainingBadge("AIEngineer")).toBe(
			"Projet de formation · OpenClassrooms · AI Engineer",
		);
		expect(trainingBadgeShort("AIEngineer")).toBe("Formation OC · AI Engineer");
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
