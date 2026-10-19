import {
	Bricolage_Grotesque,
	Caveat,
	Fira_Code,
	Source_Serif_4,
} from "next/font/google";

const bricolage = Bricolage_Grotesque({
	subsets: ["latin"],
	weight: ["600", "700"],
	variable: "--font-bricolage",
	display: "swap",
});
const sourceSerif = Source_Serif_4({
	subsets: ["latin"],
	weight: ["400", "600"],
	style: "normal",
	variable: "--font-source-serif",
	display: "swap",
});
const sourceSerifItalic = Source_Serif_4({
	subsets: ["latin"],
	weight: ["400", "600"],
	style: "italic",
	variable: "--font-source-serif-italic",
	preload: false,
	display: "swap",
});
const caveat = Caveat({
	subsets: ["latin"],
	weight: ["500"],
	variable: "--font-caveat",
	preload: false,
	display: "swap",
});
const firaCode = Fira_Code({
	subsets: ["latin"],
	weight: ["400", "500"],
	variable: "--font-fira",
	preload: false,
	display: "swap",
});

/**
 * Classes CSS qui posent les variables `--font-*`.
 *
 * `app/globals.css` les consomme par `@theme inline` : `--font-serif: var(--font-source-serif),
 * Georgia, …`, et les utilitaires `font-sans` / `font-mono` suivent la même forme. Chaque
 * déclaration a bien une police de repli — mais une `var()` non définie invalide la
 * déclaration ENTIÈRE au moment du calcul, sans avancer au jeton suivant : la famille
 * entière est donc perdue, pas dégradée. D'où la nécessité de poser ces variables dans
 * les deux root layouts.
 *
 * Les deux root layouts (`app/[locale]/layout.tsx` et `app/(admin)/layout.tsx`)
 * doivent donc poser ces variables : source unique, pour que les deux arbres ne
 * puissent pas diverger.
 */
export const fontVariables = `${bricolage.variable} ${sourceSerif.variable} ${sourceSerifItalic.variable} ${caveat.variable} ${firaCode.variable}`;
