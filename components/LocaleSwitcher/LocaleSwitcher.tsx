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
	const [pending, startTransition] = useTransition();

	// Annotation plutôt qu'un `as` : `Object.fromEntries` infère `{[k: string]: any}`
	// depuis un tableau de `string[]`, et l'annotation fixe le type exact sans le
	// faire mentir au lecteur sur ce que contient réellement `labels`.
	const labels: Record<string, string> = Object.fromEntries(
		routing.locales.map((code) => [code, t(`names.${code}`)]),
	);

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
			disabled={pending}
			onChange={change}
		/>
	);
}
