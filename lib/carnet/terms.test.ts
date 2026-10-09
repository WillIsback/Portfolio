import { describe, expect, it } from "vitest";
import { extractTerms } from "./terms";

describe("extractTerms", () => {
	it("garde les mots utiles du titre et de la description, pliés et dédupliqués", () => {
		expect(
			extractTerms(
				"Neuf agents, neuf jours",
				"Une flotte de neuf agents SRE sur un home-server",
			),
		).toEqual(["neuf", "agents", "jours", "flotte", "sre", "home", "server"]);
	});

	it("écarte les mots vides français et anglais et les mots de moins de 3 lettres", () => {
		expect(
			extractTerms(
				"The search for the best model",
				"pour les données de la vision",
			),
		).toEqual(["search", "best", "model", "donnees", "vision"]);
	});

	it("renvoie une liste vide pour un texte vide", () => {
		expect(extractTerms("", "")).toEqual([]);
	});
});
