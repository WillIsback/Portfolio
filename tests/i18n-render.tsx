import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import type { Locale } from "@/i18n/routing";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import zh from "@/messages/zh.json";

/** Dictionnaires réels indexés par locale, pour que les rendus de test restent alignés. */
export const MESSAGES: Record<Locale, Record<string, unknown>> = { fr, en, zh };

/**
 * Rend un composant serveur ou client dans une locale donnée, avec son dictionnaire
 * réel. Le provider pilote `useTranslations`/`getTranslations` ; les effets React ne
 * s'exécutent pas sous `renderToStaticMarkup`, donc un îlot client se rend au repos.
 */
export function renderLocale(
	locale: Locale,
	element: React.ReactElement,
): string {
	return renderToStaticMarkup(
		<NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
			{element}
		</NextIntlClientProvider>,
	);
}

/**
 * Rend un composant serveur en français avec les messages réels, pour que les
 * tests de rendu restent alignés sur le dictionnaire.
 */
export function renderFr(element: React.ReactElement): string {
	return renderLocale("fr", element);
}

/**
 * Échappements produits par `renderToStaticMarkup`, pour comparer une assertion à une
 * valeur du dictionnaire.
 *
 * Le français abonde en apostrophes (`d'outils`, `l'instant`), que le rendu sérialise
 * `&#x27;` : sans cette fonction, il faudrait recopier la forme échappée dans chaque
 * test, donc vérifier autre chose que le dictionnaire. Les autres entités sont listées
 * pour rester exact si un message en contient.
 */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;");
}
