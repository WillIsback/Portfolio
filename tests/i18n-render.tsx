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
