"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import LocaleSelect from "./LocaleSelect";

export default function LocaleSwitcher() {
	const t = useTranslations("locale");
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();
	const [isPending, startTransition] = useTransition();

	// Annotation plutôt qu'un `as` : elle vérifie l'assignabilité au lieu de l'affirmer.
	const labels: Record<string, string> = Object.fromEntries(
		routing.locales.map((code) => [code, t(`names.${code}`)]),
	);

	// Volontairement sans `name` ni `<form>` : un `<select>` hors formulaire ne fait
	// rien sans JavaScript, ce qui est le comportement attendu ici et la pratique de
	// la documentation next-intl. Ajouter un formulaire ou un `name` déclencherait une
	// navigation complète qui casserait la transition douce ci-dessous — ne pas « corriger ».
	function change(next: string) {
		startTransition(() => {
			router.replace(pathname, { locale: next });
		});
	}

	return (
		<LocaleSelect
			id="locale-switcher"
			value={locale}
			locales={routing.locales}
			labels={labels}
			label={t("label")}
			disabled={isPending}
			onChange={change}
		/>
	);
}
