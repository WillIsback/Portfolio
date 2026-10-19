import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * Légende de figure numérotée (« Fig. 2 · … »).
 *
 * Le préfixe est un message ICU : la graphie change avec la locale (« Fig. » en français
 * et en anglais, « 图 » en chinois), et `{n}` garde le numéro hors du texte.
 *
 * `useTranslations` et non `getTranslations` : le composant est rendu aussi bien par un
 * arbre serveur (l'accueil) que par un arbre client (`ProjectRegister` → `FeaturedCard`,
 * qui l'importe via la frontière « use client »). Un composant serveur ne peut pas
 * convertir un composant importé par un composant client en composant serveur — les deux
 * usages partagent donc le hook, qui fonctionne des deux côtés.
 */
export default function FigureCaption({
	number,
	children,
}: Readonly<{ number: number; children: ReactNode }>) {
	const t = useTranslations("figure");
	return (
		<figcaption className="mt-3 font-mono text-xs tracking-wide text-ink-soft">
			{t("prefix", { n: number })}
			{children}
		</figcaption>
	);
}
