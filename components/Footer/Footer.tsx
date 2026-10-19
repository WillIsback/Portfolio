import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Composant serveur : `Header` l'est aussi, et les deux sont montés par les pages de
 * `app/[locale]/`, qui appellent toutes `setRequestLocale` avant de rendre. C'est ce qui
 * permet à `getTranslations` de rester synchrone du point de vue du rendu statique — un
 * appel sans `setRequestLocale` ferait basculer la route de `●` à `ƒ` en silence.
 *
 * `{year}` est injecté par le message : l'année vient de la locale de la requête, pas du
 * dictionnaire.
 */
export default async function Footer() {
	const t = await getTranslations("footer");
	return (
		<footer className="mt-16 w-full border-t border-border/70">
			<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 font-mono text-xs text-ink-soft sm:px-6">
				<p>{t("credit", { year: new Date().getFullYear() })}</p>
				<nav aria-label={t("ariaLabel")} className="flex items-center gap-4">
					<Link
						href="/articles"
						className="rounded-sm hover:text-primary focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						{t("articles")}
					</Link>
					{/* Nom de marque, pas un libellé d'interface : il reste en dur dans les
					    trois langues, comme `ML`/`LLM` dans `lib/domains.ts`. */}
					<a
						href="https://github.com/WillIsback/"
						className="rounded-sm hover:text-primary focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						GitHub
					</a>
				</nav>
			</div>
		</footer>
	);
}
