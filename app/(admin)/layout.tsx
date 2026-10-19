import { fontVariables } from "@/lib/fonts";

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
 * Pas de `NextIntlClientProvider` ici, et c'est délibéré : il sérialise le dictionnaire
 * `fr` entier dans le HTML de *chaque* route admin, y compris `/admin/login` qui n'affiche
 * aucun texte traduit. Le dictionnaire grossit à chaque tâche de traduction, et ce poids
 * était payé dix fois pour un besoin réel unique. Le provider est donc descendu dans le
 * seul sous-arbre qui en dépend, `admin/(app)/projects/[id]/` — voir le layout de ce
 * dossier. Les modules `lib/` eux-mêmes restent indépendants de React (`i18n/fr.ts`).
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
