"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * 404 du segment `[locale]` : rendue quand `notFound()` est levé par une page ou un
 * layout de ce segment — le slug inconnu d'un article, ou la locale rejetée par
 * `app/[locale]/layout.tsx`. Elle est donc localisée, contrairement à la 404 racine
 * (`app/not-found.tsx`), qui sert la locale par défaut pour les URL sans route.
 *
 * `"use client"` est nécessaire, et pas décoratif : un `Link` de next-intl rendu
 * depuis un Server Component résout la locale par `getRequestLocale()`, donc par
 * `headers()`, et la bordure `not-found` étant présente dans l'arbre de toutes les
 * routes, cela ferait retomber le site entier en rendu dynamique. Rendu client, il
 * lit la locale dans `NextIntlClientProvider` et la statique est préservée.
 */
export default function LocaleNotFound() {
	const t = useTranslations("notFound");

	return (
		<main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6">
			<h1 className="font-display text-3xl font-bold">{t("title")}</h1>
			<p className="text-ink-soft">{t("body")}</p>
			<Link href="/" className="text-primary underline underline-offset-4">
				{t("back")}
			</Link>
		</main>
	);
}
