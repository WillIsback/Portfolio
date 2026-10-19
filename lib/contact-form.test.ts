import { describe, expect, it } from "vitest";
import { frTranslator } from "@/i18n/fr";
import zhMessages from "@/messages/zh.json";
import { LOCALES, translator } from "@/tests/translator";
import {
	errorSummary,
	firstInvalidField,
	firstServerErrors,
} from "./contact-form";

describe("errorSummary", () => {
	const t = frTranslator("contact");

	it("accorde le résumé selon le nombre de champs", () => {
		expect(errorSummary(t, 0)).toBe("");
		expect(errorSummary(t, 1)).toBe("1 champ à corriger");
		expect(errorSummary(t, 3)).toBe("3 champs à corriger");
	});

	it("l'accord vient du dictionnaire, pas d'un ternaire en code", () => {
		// Le chinois n'a pas de catégorie de pluriel ICU : son message reste un gabarit
		// simple, et `errorSummary` ne doit rien y ajouter.
		expect(zhMessages.contact.errorSummary).not.toMatch(/plural/);
		expect(errorSummary(translator("zh", "contact"), 1)).toBe(
			"需修正 1 个字段",
		);
		expect(errorSummary(translator("zh", "contact"), 5)).toBe(
			"需修正 5 个字段",
		);
		expect(errorSummary(translator("zh", "contact"), 0)).toBe("");
	});
});

describe("errorSummary — même structure dans les trois langues", () => {
	it.each(LOCALES)("%s : rien à zéro, un décompte au-delà", (locale) => {
		const t = translator(locale, "contact");
		// La position du décompte varie (le chinois énonce « 需修正 1 个字段 ») : ce qui ne
		// varie pas, c'est qu'il est présent, et que zéro ne se dit pas.
		expect(errorSummary(t, 0)).toBe("");
		expect(errorSummary(t, 1)).toContain("1");
		expect(errorSummary(t, 3)).toContain("3");
		expect(errorSummary(t, 1)).not.toBe(errorSummary(t, 3));
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
