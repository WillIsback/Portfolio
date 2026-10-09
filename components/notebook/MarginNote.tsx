"use client";

import { type ReactNode, useEffect, useState } from "react";
import { NOTE_DELAY_SECONDS } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MarginNoteProps {
	children: ReactNode;
	side?: "left" | "right";
	inline?: boolean;
}

/**
 * Annotation manuscrite. Dans le flux du texte sur mobile ; dans la marge à partir de `xl`
 * (le parent doit être `relative`).
 *
 * La police manuscrite n'est appliquée qu'après le montage et ~250 ms : sa requête part ainsi
 * après le premier rendu (sinon Caveat est demandée en priorité maximale avant le LCP). Avant,
 * la note s'affiche en police du corps, texte et couleur identiques. Le mouvement (`note-in`,
 * CSS pur, transform seul) est coupé par `prefers-reduced-motion`.
 */
export default function MarginNote({
	children,
	side = "right",
	inline = false,
}: Readonly<MarginNoteProps>) {
	const [handwritten, setHandwritten] = useState(false);
	useEffect(() => {
		const timer = setTimeout(
			() => setHandwritten(true),
			NOTE_DELAY_SECONDS * 1000,
		);
		return () => clearTimeout(timer);
	}, []);
	return (
		<div
			role="note"
			className={cn(
				"note-in text-lg leading-snug text-note my-3",
				handwritten && "font-hand",
				!inline && "xl:my-0 xl:absolute xl:top-0 xl:w-48",
				!inline &&
					(side === "right" ? "xl:-right-56" : "xl:-left-56 xl:text-right"),
			)}
		>
			{children}
		</div>
	);
}
