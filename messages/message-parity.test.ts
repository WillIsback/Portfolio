import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { type Locale, routing } from "@/i18n/routing";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import zh from "@/messages/zh.json";

/**
 * Aplatit un dictionnaire imbriqué en chemins pointés : {a: {b: 1}} → ["a.b"].
 *
 * Les tableaux sont des feuilles opaques : une liste de mots-clés n'a pas la même
 * longueur dans chaque langue, et ce n'est pas une dérive. Un objet vide reste une
 * feuille nommée (`{a: {}}` vaut pour la clé « a »), sans quoi une clé absente chez
 * une locale passerait inaperçue. La racine n'ayant pas de nom, un dictionnaire vide
 * ne produit aucune clé : le test de référence non vide reste ainsi capable de le rejeter.
 */
function keys(value: unknown, prefix = ""): string[] {
	const isLeaf =
		value === null ||
		typeof value !== "object" ||
		Array.isArray(value) ||
		Object.keys(value).length === 0;
	if (isLeaf) return prefix ? [prefix] : [];
	return Object.entries(value as Record<string, unknown>)
		.flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k))
		.sort();
}

/**
 * Indexé par `Locale` : ajouter une locale à `i18n/routing.ts` sans importer son
 * dictionnaire devient une erreur de compilation, pas une dérive silencieuse.
 */
const messages: Record<Locale, unknown> = { fr, en, zh };

const base = keys(fr);

describe("parité des messages", () => {
	it("fr est le dictionnaire de référence non vide", () => {
		expect(base.length).toBeGreaterThan(0);
	});

	it("chaque locale déclarée a exactement un fichier de dictionnaire", () => {
		const files = readdirSync(path.join(process.cwd(), "messages"))
			.filter((f) => f.endsWith(".json"))
			.map((f) => f.slice(0, -".json".length))
			.sort();
		expect(files).toEqual([...routing.locales].sort());
	});

	it.each(
		routing.locales,
	)("%s couvre exactement les mêmes clés que fr", (locale) => {
		expect(keys(messages[locale])).toEqual(base);
	});
});

describe("keys", () => {
	it("traite un tableau comme une feuille, quelle que soit sa longueur", () => {
		expect(keys({ tags: ["a", "b"] })).toEqual(keys({ tags: [] }));
	});

	it("fait d'un objet vide une feuille nommée", () => {
		expect(keys({ a: {} })).toEqual(["a"]);
		expect(keys({ a: {} })).not.toEqual(keys({}));
	});

	it("ne produit aucune clé pour un dictionnaire racine vide", () => {
		expect(keys({})).toEqual([]);
	});
});
