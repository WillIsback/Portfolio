import { createTranslator } from "next-intl";
import fr from "@/messages/fr.json";
import type { Translator } from "./translator";

/**
 * Namespaces de `messages/fr.json`. `keyof typeof fr` plutôt que `string` : une faute de
 * frappe (`frTranslator("statuss")`) casserait la compilation, au lieu d'atteindre la
 * branche `MISSING_MESSAGE` de next-intl à l'exécution et de rendre la clé brute — un
 * `<select>` admin affichant `statuss.InProgress`.
 */
export type FrNamespace = keyof typeof fr;

/**
 * Traducteur français autonome, indépendant de React et de la locale de requête.
 *
 * L'admin dispose d'un provider figé sur `fr` (cf. `app/(admin)/…/projects/[id]/layout.tsx`),
 * mais `frTranslator` sert aussi les scripts Node qui régénèrent le carnet
 * (`pnpm embeddings`) et les tests unitaires de `lib/` : deux surfaces sans arbre React,
 * où un hook ne peut pas s'exécuter.
 *
 * `createTranslator` vient de `use-intl/core`, réexporté par l'entrée cliente ET serveur
 * de `next-intl` : le module est donc importable aussi bien d'un composant client que
 * d'un script Node.
 *
 * Aucun `as unknown as Translator` : le `any` de `Translator` rend le traducteur
 * next-intl directement assignable (cf. `i18n/translator.test.ts`, qui fige cette
 * propriété à la compilation). Seul le `namespace` reste transtypé, `string` ne
 * satisfaissant pas `NamespaceKeys`.
 */
export function frTranslator(namespace: FrNamespace): Translator {
	return createTranslator({
		locale: "fr",
		messages: fr,
		namespace: namespace as never,
	});
}
