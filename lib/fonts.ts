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
 * `app/globals.css` les consomme sans repli : `body { font-family: var(--font-serif) }`,
 * et les utilitaires `font-sans` / `font-mono` passent par `var(--font-bricolage)` /
 * `var(--font-fira)`. Une `var()` non définie invalide la déclaration en temps de
 * calcul, donc la police se dégrade silencieusement vers celle du navigateur.
 *
 * Les deux root layouts (`app/[locale]/layout.tsx` et `app/(admin)/layout.tsx`)
 * doivent donc poser ces variables : source unique, pour que les deux arbres ne
 * puissent pas diverger.
 */
export const fontVariables = `${bricolage.variable} ${sourceSerif.variable} ${sourceSerifItalic.variable} ${caveat.variable} ${firaCode.variable}`;
