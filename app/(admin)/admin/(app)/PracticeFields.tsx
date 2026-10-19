"use client";

import { frTranslator } from "@/i18n/fr";
import { FAMILIES, PRACTICES_OF, practiceLabels } from "@/lib/practices";
import { ChipGroup } from "./github/ChipGroup";

/** Pratiques cochables, une rangée par famille. */
export function PracticeFields({
	selected,
	onToggle,
}: {
	selected: readonly string[];
	onToggle: (value: string) => void;
}) {
	// L'admin est hors segment `[locale]` et figé en français (`<html lang="fr">`) :
	// pas de provider next-intl dans son arbre, donc pas de hook. Traduire l'admin est
	// hors périmètre ; brancher le provider et passer à `useTranslations` suffirait.
	const labels = practiceLabels(frTranslator("practices"));
	return (
		<div className="space-y-3">
			{FAMILIES.map((family) => (
				<ChipGroup
					key={family}
					legend={`Pratiques ${family}`}
					options={PRACTICES_OF[family]}
					selected={selected}
					onToggle={onToggle}
					labels={labels}
				/>
			))}
		</div>
	);
}
