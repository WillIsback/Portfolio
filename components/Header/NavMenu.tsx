"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Cibles seulement : les libellés dépendent de la locale, donc ils sont traduits dans le
 * composant et non au niveau du module.
 *
 * `usePathname` vient de `@/i18n/navigation` et rend le chemin **sans** le préfixe de
 * locale, ce qu'attend `isActive`. Celui de `next/navigation` renverrait `/en/articles`,
 * jamais actif.
 */
const TARGETS = [
	{ href: "/", key: "home", isActive: (p: string) => p === "/" },
	{
		href: "/articles",
		key: "articles",
		isActive: (p: string) => p.startsWith("/articles"),
	},
	{
		href: "/About",
		key: "about",
		isActive: (p: string) => p === "/About",
	},
	{
		href: "/Contact",
		key: "contact",
		isActive: (p: string) => p === "/Contact",
	},
] as const;

export default function NavMenu() {
	const t = useTranslations("nav");
	const pathname = usePathname() ?? "/";
	return (
		<nav aria-label={t("ariaLabel")}>
			<ul className="flex flex-wrap items-center gap-0.5 sm:gap-1">
				{TARGETS.map((target) => {
					const active = target.isActive(pathname);
					return (
						<li key={target.href}>
							<Button
								asChild
								variant="ghost"
								size="sm"
								className={cn(
									"rounded-none border-b-2 border-transparent px-2 font-display text-sm font-semibold transition-colors sm:px-3",
									active
										? "border-primary text-foreground"
										: "text-ink-soft hover:border-paper-grid hover:text-foreground",
								)}
							>
								<Link
									href={target.href}
									aria-current={active ? "page" : undefined}
								>
									{t(target.key)}
								</Link>
							</Button>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
