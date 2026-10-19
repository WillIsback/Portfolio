import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import type { Translator } from "@/i18n/translator";
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
		translator: Translator;
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
	name: "sre-dev",
	kind: "work",
	label: "Energy",
	values: "CatBoost 0.24, Kumo 0.45",
	summary: "28/09: 4 tasks",
	segments: "Capacity 199 (47%)",
	total: 428,
	traces: 264,
	scans: 5,
	other: 3,
	title: "Project X",
	full: "CI, tests",
	list: "Python, Docker",
};

/** Exemples de noms de paramètres ICU dans un message : {count}, {n}. */
function parameters(message: string): string[] {
	return [...message.matchAll(/\{\s*([a-zA-Z][a-zA-Z0-9]*)\s*[,}]/g)].map(
		(match) => match[1],
	);
}

/** Lit la feuille `path` (« mdx.faultTraces ») dans un catalogue, sinon `undefined`. */
function lookup(catalog: Catalog, path: string): string | undefined {
	let node: unknown = catalog;
	for (const key of path.split(".")) {
		if (typeof node !== "object" || node === null) return undefined;
		node = (node as Catalog)[key];
	}
	return typeof node === "string" ? node : undefined;
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
		const { catalog, translator } = MESSAGES[locale];
		const failures: string[] = [];

		for (const [path, frMessage] of leaves(MESSAGES.fr.catalog)) {
			const localeMessage = lookup(catalog, path) ?? frMessage;
			const frParameters = new Set(parameters(frMessage));
			const localeParameters = new Set(parameters(localeMessage));

			// La parité porte sur les clés, pas sur les paramètres : une locale qui
			// oublie un paramètre rend une phrase amputée sans que rien ne le signale.
			// On compare donc structurellement, sans passer par le rendu.
			const missing = [...frParameters].filter(
				(name) => !localeParameters.has(name),
			);
			const extra = [...localeParameters].filter(
				(name) => !frParameters.has(name),
			);
			if (missing.length > 0 || extra.length > 0) {
				const parts: string[] = [];
				if (missing.length > 0) {
					parts.push(
						`absents de cette locale : ${missing.map((n) => `{${n}}`).join(", ")}`,
					);
				}
				if (extra.length > 0) {
					parts.push(
						`absents du français : ${extra.map((n) => `{${n}}`).join(", ")}`,
					);
				}
				failures.push(`${path}: ${parts.join(" ; ")}`);
			}

			const declared = [...new Set([...frParameters, ...localeParameters])];

			// Sans valeur d'exemple, l'interpolation ne peut pas être prouvée : on
			// échoue bruyamment plutôt que d'ignorer le paramètre en silence.
			const unsampled = declared.filter((name) => VALUES[name] === undefined);
			if (unsampled.length > 0) {
				failures.push(
					`${path}: aucun exemple dans VALUES pour ${unsampled
						.map((name) => `{${name}}`)
						.join(", ")}`,
				);
				continue;
			}

			const values = Object.fromEntries(
				declared.map((name) => [name, VALUES[name]]),
			);

			try {
				const rendered = translator(path, values);
				if (rendered === path || rendered.includes(`.${path}`)) {
					failures.push(`${path}: message manquant`);
				}
				// L'interpolation se prouve par la disparition du marqueur, jamais par
				// la présence de la valeur brute : ICU formate ({n, number} → « 1 000 »,
				// pluriels), donc `String(value)` peut légitimement être absent.
				for (const name of declared) {
					if (rendered.includes(`{${name}}`)) {
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
