import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import fr from "@/messages/fr.json";
import { frTranslator } from "./fr";
import type { Translator } from "./translator";

/**
 * Affectation, pas un `as` : c'est le seul endroit du dépôt qui *prouve* que le
 * traducteur de `createTranslator` est assignable à `Translator` sans transtypage.
 *
 * next-intl expose une signature d'appel générique — aucun type de fonction
 * monomorphe ne peut en être le supertype, d'où le `any` du premier paramètre de
 * `Translator`. Si quelqu'un le resserre (`key: any` → `key: string`), ou réintroduit
 * un `as unknown as Translator` dans `i18n/fr.ts` pour masquer la rupture, ce fichier
 * cesse de compiler.
 */
const assignableWithoutCast: Translator = createTranslator({
	locale: "fr",
	messages: fr,
	namespace: "status",
});

describe("Translator", () => {
	it("accepte un traducteur next-intl sans transtypage", () => {
		expect(assignableWithoutCast("InProgress")).toBe(fr.status.InProgress);
	});

	it("accepte les valeurs ICU des messages paramétrés", () => {
		const t = frTranslator("carnet");
		expect(t("resultCount", { count: 1 })).toBe("1 résultat");
		expect(t("resultCount", { count: 4 })).toBe("4 résultats");
	});
});
