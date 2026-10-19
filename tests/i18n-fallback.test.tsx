import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import CarnetExplorer from "@/components/carnet/CarnetExplorer";
import Instruments from "@/components/home/Instruments";
import FeaturedCard from "@/components/register/FeaturedCard";
import { MultiSelect } from "@/components/ui/multi-select";
import { type Locale, routing } from "@/i18n/routing";
import type { Translator } from "@/i18n/translator";
import type { MapCluster, MapPoint } from "@/lib/carnet/map-view";
import type { NormalizedProject } from "@/lib/projects-data";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import zh from "@/messages/zh.json";
import { escapeHtml, MESSAGES, renderLocale } from "./i18n-render";

/**
 * Garde anti-« français codé en dur ».
 *
 * Les tests de rendu historiques tournent tous en français : un composant qui écrit
 * `voir le détail` au lieu d'appeler le dictionnaire est vert, puisque la valeur
 * attendue est la même. Cette garde rend les surfaces publiques dans les autres
 * locales et exige qu'aucun message français ne s'y glisse.
 *
 * Méthode : pour chaque clé dont la valeur diffère entre `fr` et la locale testée, on
 * rend le message ICU avec des marqueurs pour ses paramètres, on transforme le rendu en
 * motif (les paramètres deviennent des jokers), et on vérifie que le HTML ne le contient
 * pas. Comparer le **rendu** et non le gabarit `{title}` est indispensable : c'est le
 * texte substitué que le composant fautif émet.
 */

/** Aplatit un dictionnaire imbriqué en chemins pointés, feuilles de type chaîne. */
function flatten(
	value: unknown,
	prefix = "",
	out: Record<string, string> = {},
): Record<string, string> {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		if (typeof value === "string") out[prefix] = value;
		return out;
	}
	for (const [key, child] of Object.entries(value))
		flatten(child, prefix ? `${prefix}.${key}` : key, out);
	return out;
}

const FR_LEAVES = flatten(fr);
const SENTINEL = "@@P@@";
/** Petit entier : le `#` d'un pluriel ICU reste littéral, sans séparateur de milliers. */
const COUNT = 7;
const PLURAL_ARG = /\{\s*([a-zA-Z0-9_]+)\s*,\s*(?:plural|selectordinal)/g;
const ANY_ARG = /\{\s*([a-zA-Z0-9_]+)\s*[,}]/g;

/** Noms des paramètres d'un message ICU, avec ceux à valeur numérique (pluriels). */
function paramsOf(message: string): {
	names: Set<string>;
	numeric: Set<string>;
} {
	const names = new Set<string>();
	for (const m of message.matchAll(ANY_ARG)) names.add(m[1]);
	const numeric = new Set<string>();
	for (const m of message.matchAll(PLURAL_ARG)) numeric.add(m[1]);
	return { names, numeric };
}

/** Valeurs sentinelles : le rendu porte le marqueur, remplacé ensuite par un joker. */
function valuesFor(message: string): {
	values: Record<string, string | number>;
	sentinels: string[];
} {
	const { names, numeric } = paramsOf(message);
	const values: Record<string, string | number> = {};
	const sentinels: string[] = [];
	for (const name of names) {
		const numericValue = numeric.has(name);
		values[name] = numericValue ? COUNT : SENTINEL;
		sentinels.push(numericValue ? String(COUNT) : SENTINEL);
	}
	return { values, sentinels };
}

const TRANSLATORS: Record<Locale, Translator> = {
	fr: createTranslator({ locale: "fr", messages: fr }),
	en: createTranslator({ locale: "en", messages: en }),
	zh: createTranslator({ locale: "zh", messages: zh }),
};

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Motif cherchant le message rendu dans le HTML. Renvoie `null` quand il n'y a rien
 * d'assez distinctif : un message fait uniquement de paramètres, ou une clé trop courte
 * (sigles comme `ML`) dont l'absence ne prouverait rien.
 */
function needlePattern(rendered: string, sentinels: string[]): string | null {
	if (sentinels.length === 0)
		return literalTooShort(rendered)
			? null
			: escapeRegExp(escapeHtml(rendered));
	const split = new RegExp(sentinels.map(escapeRegExp).join("|"));
	const parts = rendered.split(split);
	if (literalTooShort(parts.join(""))) return null;
	return parts.map((part) => escapeRegExp(escapeHtml(part))).join("[\\s\\S]*?");
}

function literalTooShort(literal: string): boolean {
	const condensed = literal.replace(/\s/g, "");
	return condensed.length < 5 || !/\p{L}/u.test(condensed);
}

/** Clés dont le motif est trop proche d'un symbole pour être une preuve fiable. */
const SKIP_PATHS = new Set(["figure.prefix"]);

/** Messages français présents à tort dans un HTML rendu dans `locale`. */
function frenchOffenders(html: string, locale: Locale): string[] {
	const localeLeaves = flatten(MESSAGES[locale]);
	const offenders: string[] = [];
	// On ne garde que le texte visible : une valeur dans un attribut (`href`, `alt`,
	// `aria-*`) ne doit pas produire de faux positif, et le bug visé écrit dans un nœud
	// texte. Les entités HTML restent, d'où la comparaison au massage par `escapeHtml`.
	const text = html.replace(/<[^>]*>/g, " ");
	for (const [path, frValue] of Object.entries(FR_LEAVES)) {
		if (SKIP_PATHS.has(path)) continue;
		const localeValue = localeLeaves[path];
		if (localeValue === undefined || localeValue === frValue) continue;
		const { values, sentinels } = valuesFor(frValue);
		let renderedFr: string;
		let renderedLocale: string;
		try {
			renderedFr = TRANSLATORS.fr(path, values);
			renderedLocale = TRANSLATORS[locale](path, values);
		} catch {
			continue;
		}
		if (renderedFr === renderedLocale) continue;
		const pattern = needlePattern(renderedFr, sentinels);
		if (pattern && new RegExp(pattern).test(text)) {
			offenders.push(`${path} → « ${renderedFr} »`);
		}
	}
	return offenders;
}

const project = (over: Partial<NormalizedProject> = {}): NormalizedProject => ({
	id: 7,
	title: "P13",
	description: "First sentence. Second sentence.",
	imagePath: null,
	github: "https://github.com/x/p13",
	lastUpdate: new Date("2026-06-01T00:00:00Z"),
	isPrivate: false,
	isAiGenerated: false,
	createdAt: new Date(0),
	updatedAt: new Date(0),
	languages: [{ language: "Python" }],
	databases: [{ database: "Postgresql" }],
	backends: [{ backend: "FastAPI" }],
	frontends: [],
	devops: [{ devops: "Docker" }],
	domains: [],
	mlStack: [],
	pitch: null,
	status: null,
	period: null,
	featuredRank: null,
	githubRepoId: null,
	practices: [],
	training: null,
	...over,
});

const points: MapPoint[] = [
	{
		id: "project:7",
		kind: "project",
		title: "Alpha",
		href: "h",
		x: 0.5,
		y: 0.5,
		cluster: 1,
	},
	{
		id: "project:8",
		kind: "project",
		title: "Beta",
		href: "h",
		x: 0.6,
		y: 0.5,
		cluster: 1,
	},
];

const clusters: MapCluster[] = [
	{ id: "c1", label: "Zone A", index: 1, count: 1 },
];

const SURFACES: Record<string, () => React.ReactElement> = {
	instruments: () => <Instruments />,
	"multi-select": () => (
		<MultiSelect
			options={[
				{ value: "a", label: "Alpha" },
				{ value: "b", label: "Beta" },
			]}
			selected={["a", "b"]}
			onChange={() => {}}
		/>
	),
	"registre — voisins de carte": () => (
		<FeaturedCard
			project={project()}
			figureNumber={2}
			points={points}
			neighborIds={["project:8"]}
		/>
	),
	"registre — composition seule": () => (
		<FeaturedCard
			project={project({ id: 99 })}
			figureNumber={3}
			points={points}
			neighborIds={[]}
		/>
	),
	"registre — capture": () => (
		<FeaturedCard
			project={project({ imagePath: "/captures/p13.webp" })}
			figureNumber={4}
			points={points}
			neighborIds={[]}
			entry={{ slug: "a", title: "A" }}
		/>
	),
	carnet: () => (
		<CarnetExplorer
			points={points}
			clusters={clusters}
			intro={<h1>Intro</h1>}
			note={<p>Note</p>}
		/>
	),
};

const NON_FRENCH: Locale[] = routing.locales.filter((l) => l !== "fr");

describe("aucune chaîne française codée en dur hors du français", () => {
	it.each(
		NON_FRENCH,
	)("%s : les surfaces publiques n'émettent aucun message de fr.json", (locale) => {
		for (const [name, build] of Object.entries(SURFACES)) {
			const html = renderLocale(locale, build());
			const offenders = frenchOffenders(html, locale);
			expect(
				offenders,
				`${locale} / ${name} : messages français codés en dur :\n${offenders.join("\n")}`,
			).toEqual([]);
		}
	});
});
