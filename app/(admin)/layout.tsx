import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { fontVariables } from "@/lib/fonts";
import fr from "@/messages/fr.json";

import "../globals.css";

/**
 * Root layout de l'espace admin : `html` + `body`, rien d'autre (un second `<html>`
 * ou `<body>` dans le même arbre fait échouer la compilation Next).
 *
 * `className={fontVariables}` est indispensable : `app/globals.css` déclare ses familles
 * via `@theme inline` (`--font-serif: var(--font-source-serif), Georgia, …`), et une
 * `var()` non définie invalide la déclaration entière au moment du calcul — le repli
 * suivant n'est pas pris. Sans ces variables, toute page admin retomberait sur la police
 * par défaut du navigateur.
 *
 * Pas de `paper` ici, contrairement au root public : l'admin peint déjà son fond
 * (`bg-zinc-950` sur un div plein écran) et n'instancie pas de ThemeProvider, donc
 * la trame de points de `.paper::before` s'afficherait en clair sur clair, inerte.
 *
 * Le provider next-intl est là pour les composants du registre public
 * (`components/register/*`), réutilisés par l'aperçu projet : ils sont localisés et
 * lisent la locale par hook. L'admin, elle, reste figée en français (`<html lang="fr">`
 * ci-dessus) ; ses propres libellés passent par `frTranslator()` (`i18n/fr.ts`), pas par
 * le provider.
 *
 * `setRequestLocale("fr")` avant le provider : sans lui, `NextIntlClientProvider`
 * résout la locale par `headers()` et `/admin/login` bascule de `○` (statique) à `ƒ`.
 */
export default function AdminRootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	setRequestLocale("fr");
	return (
		<html lang="fr" suppressHydrationWarning className={fontVariables}>
			<body className="antialiased">
				<NextIntlClientProvider locale="fr" messages={fr}>
					{children}
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
