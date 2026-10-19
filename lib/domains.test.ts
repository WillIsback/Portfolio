import { describe, expect, it } from "vitest";
import { frTranslator } from "@/i18n/fr";
import {
	buildDomainRows,
	domainLabelList,
	domainLabels,
	normalizeDomains,
} from "./domains";

describe("normalizeDomains", () => {
	it("ajoute ML pour Classifier", () => {
		expect(normalizeDomains(["Classifier"])).toEqual(["ML", "Classifier"]);
	});
	it("ajoute ML pour Regressor", () => {
		expect(normalizeDomains(["Regressor"])).toEqual(["ML", "Regressor"]);
	});
	it("dédoublonne", () => {
		expect(normalizeDomains(["LLM", "LLM", "NLP"])).toEqual(["LLM", "NLP"]);
	});
	it("ignore les valeurs inconnues", () => {
		expect(normalizeDomains(["Nope", "Vision"])).toEqual(["Vision"]);
	});
	it("trie dans l'ordre canonique", () => {
		expect(normalizeDomains(["Speech", "DataAnalysis", "Agents"])).toEqual([
			"DataAnalysis",
			"Agents",
			"Speech",
		]);
	});
	it("tableau vide", () => {
		expect(normalizeDomains([])).toEqual([]);
	});
});

describe("domainLabels", () => {
	const labels = domainLabels(frTranslator("domains"));

	it("couvre chaque domaine, valeur inconnue comprise", () => {
		expect(Object.keys(labels).sort()).toEqual(
			[
				"DataAnalysis",
				"ML",
				"Classifier",
				"Regressor",
				"LLM",
				"Vision",
				"NLP",
				"Agents",
				"Speech",
			].sort(),
		);
		for (const label of Object.values(labels))
			expect(label.trim().length).toBeGreaterThan(0);
	});

	it("garde les quatre sigles en littéral, dans toutes les langues", () => {
		// ML, LLM, Vision et NLP sont des anglicismes : les mettre au dictionnaire
		// créerait trois clés identiques, donc trois occasions de diverger pour rien.
		for (const acronym of ["ML", "LLM", "Vision", "NLP"] as const)
			expect(labels[acronym]).toBe(acronym);
	});
});

describe("domainLabelList", () => {
	const t = frTranslator("domains");

	it("renvoie les libellés dans l'ordre", () => {
		expect(
			domainLabelList(t, [{ domain: "Speech" }, { domain: "Classifier" }]),
		).toEqual(["ML", "Classification", "Parole"]);
	});
	it("tableau vide", () => {
		expect(domainLabelList(t, [])).toEqual([]);
	});
});

describe("buildDomainRows", () => {
	it("normalise et associe le projet", () => {
		expect(buildDomainRows(7, ["Regressor", "Regressor", "Nope"])).toEqual([
			{ projectId: 7, domain: "ML" },
			{ projectId: 7, domain: "Regressor" },
		]);
	});
	it("renvoie un tableau vide sans domaine", () => {
		expect(buildDomainRows(7, [])).toEqual([]);
	});
});
