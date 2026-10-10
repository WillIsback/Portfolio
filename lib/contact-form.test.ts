import { describe, expect, it } from "vitest";
import {
	errorSummary,
	firstInvalidField,
	firstServerErrors,
} from "./contact-form";

describe("errorSummary", () => {
	it("accorde le résumé selon le nombre de champs", () => {
		expect(errorSummary(0)).toBe("");
		expect(errorSummary(1)).toBe("1 champ à corriger");
		expect(errorSummary(3)).toBe("3 champs à corriger");
	});
});

describe("firstInvalidField", () => {
	it("renvoie le premier champ en erreur dans l'ordre du formulaire", () => {
		expect(
			firstInvalidField(["email", "sujet", "message"], {
				message: "trop court",
				sujet: "trop court",
			}),
		).toBe("sujet");
	});

	it("ne renvoie rien sans erreur", () => {
		expect(firstInvalidField(["email", "sujet", "message"], {})).toBeNull();
	});
});

describe("firstServerErrors", () => {
	it("ne garde que le premier message par champ", () => {
		expect(
			firstServerErrors({
				email: ["Adresse email invalide", "Autre"],
				sujet: ["Le sujet doit faire au moins 3 caractères"],
			}),
		).toEqual({
			email: "Adresse email invalide",
			sujet: "Le sujet doit faire au moins 3 caractères",
		});
	});

	it("tolère l'absence d'erreurs", () => {
		expect(firstServerErrors(undefined)).toEqual({});
	});
});
