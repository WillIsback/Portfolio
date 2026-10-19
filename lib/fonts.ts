import {
	Bricolage_Grotesque,
	Caveat,
	Fira_Code,
	Noto_Sans_SC,
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
 * Visage CJK pour la locale chinoise.
 *
 * Google découpe Noto Sans SC en une centaine de tranches `@font-face` couvertes par
 * `unicode-range` : le navigateur ne télécharge que celles dont la page a réellement
 * besoin. Le fichier complet pèserait plusieurs mégaoctets, donc `preload: false` —
 * inutile de le précharger pour les deux tiers des visiteurs qui ne verront jamais de
 * chinois. `weight: "variable"` (100–900) donne une seule série de tranches pour toutes
 * les graisses, au lieu de la doubler par poids statique.
 *
 * Le sous-ensemble `latin` est le seul déclarable (l'API Google n'expose pas
 * `chinese-simplified` ici) ; les tranches CJK arrivent malgré tout dans la réponse CSS,
 * que next/font conserve intégralement.
 *
 * Variable séparée, et non incluse dans `fontVariables` : le visage CJK ne doit être
 * posé que sur `<html lang="zh">`. Voir `app/[locale]/layout.tsx` et le bloc `:lang(zh)`
 * de `app/globals.css`.
 */
const notoSansSC = Noto_Sans_SC({
	subsets: ["latin"],
	weight: "variable",
	variable: "--font-cjk",
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

/**
 * Classe qui pose `--font-cjk`, à ajouter en plus de `fontVariables` uniquement quand la
 * locale est le chinois. `fontVariables` reste inchangé : l'admin, monolingue, ne doit
 * pas embarquer le visage CJK.
 */
export const cjkFontVariable = notoSansSC.variable;
