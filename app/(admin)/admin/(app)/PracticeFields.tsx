"use client";

import { FAMILIES, PRACTICE_LABELS, PRACTICES_OF } from "@/lib/practices";
import { ChipGroup } from "./github/ChipGroup";

/** Pratiques cochables, une rangée par famille. */
export function PracticeFields({
	selected,
	onToggle,
}: {
	selected: readonly string[];
	onToggle: (value: string) => void;
}) {
	return (
		<div className="space-y-3">
			{FAMILIES.map((family) => (
				<ChipGroup
					key={family}
					legend={`Pratiques ${family}`}
					options={PRACTICES_OF[family]}
					selected={selected}
					onToggle={onToggle}
					labels={PRACTICE_LABELS}
				/>
			))}
		</div>
	);
}
