import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";

import "./globals.css";

/**
 * 404 globale, pour toute URL qui ne correspond à aucune route : `/en/nope`,
 * `/fr/articles/does-not-exist`, `/xx`, etc. Vérifié en production : ces trois
 * familles renvoyaient auparavant la coquille 404 brute de Next, sans un mot du site.
 *
 * Il n'y a pas de `app/layout.tsx` : chaque groupe de routes porte son propre root
 * layout (`app/[locale]/layout.tsx`, `app/(admin)/layout.tsx`), donc ce fichier est
 * sa propre racine et rend `<html>`/`<body>`.
 *
 * Servie dans la locale par défaut, et c'est un choix mesuré. Localiser cette page
 * demanderait de lire la locale de la requête — en-tête `x-next-intl-locale` du proxy,
 * ou `window.location` après hydratation. La première route passe par `headers()`,
 * que Next évalue dans l'arbre de TOUTES les routes (la bordure `not-found` est
 * présente partout) : mesuré, les routes publiques repassent toutes de `●` à `ƒ`. La
 * seconde afficherait du français puis corrigerait à l'hydratation. Les deux coûtent
 * plus cher que l'absence de traduction sur une URL inexistante.
 *
 * Unique point d'entrée 404, volontairement : avec `app/(admin)/layout.tsx` et
 * `app/[locale]/layout.tsx` comme root layouts, Next compose la bordure racine AVEC
 * celle du segment. Un `app/[locale]/not-found.tsx` en doublon affichait donc deux
 * 404 superposées sur le même HTML (mesuré : « Page introuvable » et « Page not found »
 * dans la même page). Il était de toute façon inatteignable : le seul `notFound()` du
 * segment est celui du slug inconnu, et `dynamicParams = false` fait respondedre à
 * Next au niveau du routage avant que la page ne s'exécute.
 */
export default async function RootNotFound() {
	const { defaultLocale } = routing;
	const t = await getTranslations({
		locale: defaultLocale,
		namespace: "notFound",
	});

	return (
		<html
			lang={defaultLocale}
			suppressHydrationWarning
			className={fontVariables}
		>
			<body className="paper antialiased">
				<main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6">
					<h1 className="font-display text-3xl font-bold">{t("title")}</h1>
					<p className="text-ink-soft">{t("body")}</p>
					{/* `next/link` et non `@/i18n/navigation` : ce `Link` résout la locale
					    par `getRequestLocale()`, donc par `headers()`. Voir la note sur la
					    locale ci-dessus. La cible `/` est celle de la locale par défaut. */}
					<Link href="/" className="text-primary underline underline-offset-4">
						{t("back")}
					</Link>
				</main>
			</body>
		</html>
	);
}
