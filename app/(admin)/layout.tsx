import { fontVariables } from "@/lib/fonts";

import "../globals.css";

/**
 * Root layout de l'espace admin : `html` + `body`, rien d'autre (un second `<html>`
 * ou `<body>` dans le même arbre fait échouer la compilation Next).
 *
 * `className={fontVariables}` est indispensable : `app/globals.css` consomme
 * `--font-serif` / `--font-bricolage` / `--font-fira` sans repli, donc sans ces
 * variables toute page admin retomberait sur la police par défaut du navigateur.
 *
 * Pas de `paper` ici, contrairement au root public : l'admin peint déjà son fond
 * (`bg-zinc-950` sur un div plein écran) et n'instancie pas de ThemeProvider, donc
 * la trame de points de `.paper::before` s'afficherait en clair sur clair, inerte.
 */
export default function AdminRootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="fr" suppressHydrationWarning className={fontVariables}>
			<body className="antialiased">{children}</body>
		</html>
	);
}
