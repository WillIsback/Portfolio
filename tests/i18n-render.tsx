import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import fr from "@/messages/fr.json";

/**
 * Rend un composant serveur en français avec les messages réels, pour que les
 * tests de rendu restent alignés sur le dictionnaire.
 */
export function renderFr(element: React.ReactElement): string {
	return renderToStaticMarkup(
		<NextIntlClientProvider locale="fr" messages={fr}>
			{element}
		</NextIntlClientProvider>,
	);
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
