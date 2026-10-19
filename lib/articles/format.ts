import type { Translator } from "@/i18n/translator";

const dateFormatter = (locale: string) =>
	new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	});

/** "2026-10-07" → "7 octobre 2026" (fr) / "October 7, 2026" (en) / "2026年10月7日" (zh). */
export function formatDate(isoDate: string, locale: string): string {
	return dateFormatter(locale).format(new Date(`${isoDate}T00:00:00Z`));
}

/** 19.4 → "19,4" (fr) / "19.4" (en) ; 1234 → "1 234" (fr) / "1,234" (en). */
export function formatNumber(
	value: number,
	maxFractionDigits = 1,
	locale = "fr",
): string {
	return new Intl.NumberFormat(locale, {
		maximumFractionDigits: maxFractionDigits,
	}).format(value);
}

/**
 * Part d'un total : (199, 428) → "46 %" (fr) / "46%" (en).
 *
 * L'espace insécable avant `%` et la mise en forme du nombre dépendent de la langue :
 * les deux vivent dans le message (`percent.value`), seul l'arrondi est calculé ici.
 * `{value, number}` délègue le formatage à `Intl` via la locale du traducteur.
 */
export function formatPercent(
	t: Translator,
	part: number,
	total: number,
): string {
	const pct = total > 0 ? Math.round((part / total) * 100) : 0;
	if (pct === 0 && part > 0) return t("underOne");
	return t("value", { value: pct });
}

/** 7 → "7 min de lecture" (fr) / "7 min read" (en) / "阅读约 7 分钟" (zh). */
export function formatReadingTime(t: Translator, minutes: number): string {
	return t("minutes", { minutes });
}
