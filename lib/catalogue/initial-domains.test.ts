import { describe, expect, it } from "vitest";
import { normalizeDomains } from "../domains";
import { INITIAL_DOMAINS } from "./initial-domains";

const EXPECTED_IDS = [
	1, 2, 6, 8, 9, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 24, 25, 26,
];

describe("INITIAL_DOMAINS", () => {
	it("contient exactement les ids de la spec", () => {
		expect(Object.keys(INITIAL_DOMAINS).map(Number)).toEqual(EXPECTED_IDS);
	});

	it("est normalisé pour chaque entrée", () => {
		for (const domains of Object.values(INITIAL_DOMAINS)) {
			expect(domains.length).toBeGreaterThan(0);
			expect(domains).toEqual(normalizeDomains(domains));
		}
	});

	it("impose ML pour Classifier et Regressor", () => {
		for (const domains of Object.values(INITIAL_DOMAINS)) {
			if (domains.includes("Classifier") || domains.includes("Regressor")) {
				expect(domains).toContain("ML");
			}
		}
		expect(INITIAL_DOMAINS[16]).toEqual(["ML", "Classifier", "LLM", "NLP"]);
	});
});
