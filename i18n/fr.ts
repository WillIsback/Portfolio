import { createTranslator } from "next-intl";
import fr from "@/messages/fr.json";
import type { Translator } from "./translator";

/**
 * Traducteur français autonome : ni provider React, ni locale de requête.
 *
 * Trois surfaces en ont besoin et ne peuvent pas appeler de hook — l'espace admin
 * `app/(admin)/`, hors segment `[locale]`, où `<html lang="fr">` est figé ; les scripts
 * Node qui régénèrent le carnet (`pnpm embeddings`) ; les tests unitaires de `lib/`,
 * hors arbre React. Partout ailleurs, `getTranslations`/`useTranslations` avec la locale
 * de la route.
 *
 * `createTranslator` vient de `use-intl/core`, réexporté par l'entrée cliente ET serveur
 * de `next-intl` : le module est donc importable aussi bien d'un composant client que
 * d'un script Node.
 *
 * Le transtypage en `Translator` est volontaire : le type public de `lib/` ne doit pas
 * dépendre du type exact des messages, qui change à chaque clé ajoutée.
 */
export function frTranslator(namespace: string): Translator;
export function frTranslator(): Translator;
export function frTranslator(namespace?: string): Translator {
	if (namespace === undefined)
		return createTranslator({
			locale: "fr",
			messages: fr as never,
		}) as unknown as Translator;
	return createTranslator({
		locale: "fr",
		messages: fr as never,
		namespace: namespace as never,
	}) as unknown as Translator;
}
