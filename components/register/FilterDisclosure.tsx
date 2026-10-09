"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

/**
 * Panneau de filtres : ouvert d'office quand des filtres sont actifs (URL),
 * mais jamais refermé par l'application, seulement par le visiteur.
 */
export default function FilterDisclosure({
	filtersActive,
	children,
}: Readonly<{ filtersActive: boolean; children: ReactNode }>) {
	// Attribut figé au premier rendu (SSR ouvert si filtres dans l'URL) : React ne le
	// touche plus ensuite, l'état ouvert/fermé appartient au DOM et au visiteur.
	const [initiallyOpen] = useState(filtersActive);
	const ref = useRef<HTMLDetailsElement>(null);
	useEffect(() => {
		if (filtersActive && ref.current) ref.current.open = true;
	}, [filtersActive]);
	return (
		<details ref={ref} open={initiallyOpen} className="mt-3">
			<summary className="cursor-pointer rounded-sm font-mono text-xs text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
				Filtrer le registre
			</summary>
			<div className="mt-3">{children}</div>
		</details>
	);
}
