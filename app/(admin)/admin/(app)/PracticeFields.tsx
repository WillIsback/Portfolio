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
	// L'admin dispose d'un provider figé sur `fr`, mais `frTranslator` garde ce module
	// indépendant de React : utilisable aussi en script Node et en test. Traduire l'admin
	// reste hors périmètre ; il suffirait de remplacer cette ligne par
	// `useTranslations("practices")`.
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
