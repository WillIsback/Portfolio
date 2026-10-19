import { describe, expect, it } from "vitest";
import { frTranslator } from "@/i18n/fr";
import {
	FAMILIES,
	familiesOf,
	normalizePractices,
	PRACTICE_FAMILY,
	PRACTICES,
	PRACTICES_OF,
	practiceLabels,
	practicesByFamily,
} from "./practices";

describe("practices", () => {
	const labels = practiceLabels(frTranslator("practices"));

	it("14 pratiques, chacune avec une famille et un libellé", () => {
		expect(PRACTICES).toHaveLength(14);
		expect(Object.keys(labels).sort()).toEqual([...PRACTICES].sort());
		for (const p of PRACTICES) {
			expect(FAMILIES).toContain(PRACTICE_FAMILY[p]);
			expect(labels[p].trim().length).toBeGreaterThan(0);
		}
	});

	it("les libellés viennent du dictionnaire, apostrophes ICU comprises", () => {
		// « Suivi d'expériences » : une apostrophe seule est un caractère d'échappement
		// en ICU. Un message mal échappé perdrait la lettre qui suit.
		expect(labels.ExperimentTracking).toBe("Suivi d'expériences");
	});

	it("PRACTICES_OF partitionne PRACTICES (5 / 4 / 5)", () => {
		expect(PRACTICES_OF.DevOps).toHaveLength(5);
		expect(PRACTICES_OF.SecOps).toHaveLength(4);
		expect(PRACTICES_OF.MLOps).toHaveLength(5);
		expect(FAMILIES.flatMap((f) => PRACTICES_OF[f])).toEqual([...PRACTICES]);
	});

	it("normalise : inconnus filtrés, doublons retirés, ordre canonique", () => {
		expect(
			normalizePractices(["LlmEvaluation", "Foo", "Hardening", "Hardening"]),
		).toEqual(["Hardening", "LlmEvaluation"]);
	});

	it("regroupe par famille présente, dans l'ordre des familles", () => {
		expect(
			practicesByFamily([
				"ModelServing",
				"ContinuousIntegration",
				"ExperimentTracking",
			]),
		).toEqual([
			{ family: "DevOps", practices: ["ContinuousIntegration"] },
			{ family: "MLOps", practices: ["ExperimentTracking", "ModelServing"] },
		]);
		expect(familiesOf(["Hardening", "Containerization"])).toEqual([
			"DevOps",
			"SecOps",
		]);
		expect(familiesOf([])).toEqual([]);
	});
});
