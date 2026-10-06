const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
	day: "numeric",
	month: "long",
	year: "numeric",
	timeZone: "UTC",
});

/** "2026-10-07" → "7 octobre 2026" */
export function formatDateFr(isoDate: string): string {
	return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

/** 19.4 → "19,4" ; 1234 → "1 234" (French grouping, narrow no-break space). */
export function formatNumberFr(value: number, maxFractionDigits = 1): string {
	return new Intl.NumberFormat("fr-FR", {
		maximumFractionDigits: maxFractionDigits,
	}).format(value);
}

/** Rounded percentage, French format: (199, 428) → "46 %". */
export function formatPercentFr(part: number, total: number): string {
	const pct = total > 0 ? Math.round((part / total) * 100) : 0;
	if (pct === 0 && part > 0) return "< 1 %";
	return `${formatNumberFr(pct, 0)} %`;
}

export function formatReadingTime(minutes: number): string {
	return `${minutes} min de lecture`;
}
