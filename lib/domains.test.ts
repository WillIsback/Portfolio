import { describe, expect, it } from "vitest";
import { buildDomainRows, domainLabels, normalizeDomains } from "./domains";

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
	it("renvoie les libellés dans l'ordre", () => {
		expect(
			domainLabels([{ domain: "Speech" }, { domain: "Classifier" }]),
		).toEqual(["ML", "Classification", "Parole"]);
	});
	it("tableau vide", () => {
		expect(domainLabels([])).toEqual([]);
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
