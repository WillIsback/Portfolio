import { createTranslator } from "next-intl";
import { type Locale, routing } from "@/i18n/routing";
import type { Translator } from "@/i18n/translator";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import zh from "@/messages/zh.json";

/**
 * Traducteur de test, pour une locale et un namespace quelconques.
 *
 * `i18n/fr.ts` ne couvre que le français ; or les règles d'ICU ne valent pas qu'en
 * français : le chinois n'a pas de catégorie de pluriel, l'anglais et le français en ont.
 * Une règle vérifiée sur une seule locale a déjà laissé passer « 0 条结果 » là où fr/en
 * annonçaient « aucun résultat ». Tout test de message pluriel passe donc par ici.
 *
 * Les trois dictionnaires sont typés par `typeof fr` : la parité des clés est déjà imposée
 * par `messages/message-parity.test.ts`, donc ce typage ne fait qu'en décalquer la forme —
 * et ferait échouer `tsc` si elle se rompait.
 */
const dictionaries: Record<Locale, typeof fr> = { fr, en, zh };

export function translator(locale: Locale, namespace: string): Translator {
	return createTranslator({
		locale,
		messages: dictionaries[locale],
		namespace: namespace as never,
	});
}

/** Tous les codes de locale déclarés, dans l'ordre de `routing`. */
export const LOCALES: readonly Locale[] = routing.locales;
