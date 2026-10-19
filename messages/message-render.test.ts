import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import zh from "@/messages/zh.json";

/**
 * Les dictionnaires partagent leurs clés (`message-parity.test.ts`) mais un
 * message ICU peut être syntaxiquement invalide dans une seule langue, ou
 * attendre un paramètre qu'une autre n'a pas. Rien ne le verrait avant le
 * rendu. On force donc le rendu de chaque feuille, dans chaque locale.
 */

type Catalog = Record<string, unknown>;

const MESSAGES: Record<
	string,
	{
		catalog: Catalog;
		translator: (key: string, values?: Record<string, unknown>) => string;
	}
> = {
	fr: {
		catalog: fr,
		translator: createTranslator({ locale: "fr", messages: fr }),
	},
	en: {
		catalog: en,
		translator: createTranslator({ locale: "en", messages: en }),
	},
	zh: {
		catalog: zh,
		translator: createTranslator({ locale: "zh", messages: zh }),
	},
};

/** Valeur plausible pour chaque paramètre attendu par un message. */
const VALUES: Record<string, unknown> = {
	count: 3,
	n: 2,
	year: 2026,
	minutes: 7,
	age: 30,
	course: "AI Engineer",
	value: 46,
};

/** Exemples de noms de paramètres ICU dans un message : {count}, {n}. */
function parameters(message: string): string[] {
	return [...message.matchAll(/\{\s*([a-zA-Z][a-zA-Z0-9]*)\s*[,}]/g)].map(
		(match) => match[1],
	);
}

/** Aplatit un catalogue en [chemin, valeur] pour les feuilles textuelles. */
function leaves(
	catalog: Catalog,
	prefix = "",
): Array<[path: string, message: string]> {
	return Object.entries(catalog).flatMap(([key, value]) => {
		const path = prefix ? `${prefix}.${key}` : key;
		if (typeof value === "string") return [[path, value] as const];
		if (typeof value === "object" && value !== null && !Array.isArray(value)) {
			return leaves(value as Catalog, path);
		}
		return [];
	});
}

describe("rendu des messages dans les trois locales", () => {
	it.each(
		Object.keys(MESSAGES),
	)("%s rend chaque feuille sans erreur ICU ni paramètre manquant", (locale) => {
		const { translator } = MESSAGES[locale];
		const failures: string[] = [];

		for (const [path, message] of leaves(MESSAGES.fr.catalog)) {
			// Les libellés purement techniques n'ont pas de clé dans cette locale :
			// c'est la parité qui les couvre, pas ce test.
			const values = Object.fromEntries(
				parameters(message).map((name) => [name, VALUES[name]]),
			);

			try {
				const rendered = translator(path, values);
				if (rendered === path || rendered.includes(`.${path}`)) {
					failures.push(`${path}: message manquant`);
				}
				for (const [name, value] of Object.entries(values)) {
					if (value !== undefined && !rendered.includes(String(value))) {
						failures.push(`${path}: {${name}} non interpolé`);
					}
				}
			} catch (error) {
				failures.push(`${path}: ${(error as Error).message}`);
			}
		}

		expect(failures).toEqual([]);
	});
});
