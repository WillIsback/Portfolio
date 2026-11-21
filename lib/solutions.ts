import { GRAMMARIA_COPY } from "@/content/solutions/grammaria";
import { SYNTHEO_COPY } from "@/content/solutions/syntheo";
import type { Locale } from "@/i18n/routing";

/**
 * Onglet « Solutions » : les logiciels que je publie pour qu'on s'en serve, avec
 * leur site, par opposition aux projets du carnet. Les faits (liens, licence,
 * version) sont communs aux locales ; les textes sont dans `content/solutions/`,
 * typés par locale pour qu'une traduction manquante ne compile pas.
 */
export const SOLUTION_SLUGS = ["syntheo", "grammaria"] as const;
export type SolutionSlug = (typeof SOLUTION_SLUGS)[number];

export const isSolutionSlug = (value: string): value is SolutionSlug =>
	(SOLUTION_SLUGS as readonly string[]).includes(value);

export interface SolutionFacts {
	slug: SolutionSlug;
	name: string;
	/** Site officiel, et son libellé affiché (le domaine). */
	site: string;
	siteLabel: string;
	github: string;
	license: string;
	version: string;
	/** Systèmes servis, pour `operatingSystem` en JSON-LD. */
	operatingSystems: string[];
	/** Catégorie schema.org de `SoftwareApplication`. */
	applicationCategory: string;
	/** Article du carnet qui raconte le projet. */
	articleSlug: string;
	/** Visuel : capture claire et sombre (fichiers dans `public/`), ou démonstration. */
	visual:
		| {
				kind: "screenshot";
				light: string;
				dark: string;
				width: number;
				height: number;
		  }
		| { kind: "demo" };
}

export interface SolutionCopy {
	/** Promesse en une ligne, sous le nom. */
	tagline: string;
	/** Deux ou trois phrases : carte de l'index et description de la page. */
	summary: string;
	/** Statut affiché en pastille (« Bêta 0.7 · Linux et Windows »). */
	status: string;
	audience: { title: string; text: string }[];
	features: { title: string; text: string }[];
	/** Ce qui sort, ou non, de chez l'utilisateur. */
	privacy: string[];
	figures: { value: string; label: string }[];
	/** Pile technique en une phrase. */
	stack: string;
	limits: string[];
	/** Texte alternatif et légende du visuel. */
	visualAlt: string;
	visualCaption: string;
	/** Démonstration textuelle, quand il n'y a pas de capture. */
	demo?: {
		input: string;
		faults: { wrong: string; right: string; rule: string; why: string }[];
	};
}

export const SOLUTIONS: Record<SolutionSlug, SolutionFacts> = {
	syntheo: {
		slug: "syntheo",
		name: "Syntheo",
		site: "https://syntheo.studio",
		siteLabel: "syntheo.studio",
		github: "https://github.com/WillIsback/Syntheo",
		license: "MIT",
		version: "0.7",
		operatingSystems: ["Linux", "Windows"],
		applicationCategory: "BusinessApplication",
		articleSlug: "syntheo-beta-0-7",
		visual: {
			kind: "screenshot",
			light: "/solutions/syntheo-note-light.png",
			dark: "/solutions/syntheo-note-dark.png",
			width: 1440,
			height: 893,
		},
	},
	grammaria: {
		slug: "grammaria",
		name: "Grammaria",
		site: "https://grammaria.fr",
		siteLabel: "grammaria.fr",
		github: "https://github.com/WillIsback/Grammaria",
		license: "GPL-3.0",
		version: "0.5",
		operatingSystems: ["Linux", "Windows"],
		applicationCategory: "UtilitiesApplication",
		articleSlug: "grammaria-corriger-et-apprendre",
		visual: { kind: "demo" },
	},
};

const COPY: Record<SolutionSlug, Record<Locale, SolutionCopy>> = {
	syntheo: SYNTHEO_COPY,
	grammaria: GRAMMARIA_COPY,
};

export function solutionCopy(slug: SolutionSlug, locale: Locale): SolutionCopy {
	return COPY[slug][locale];
}
