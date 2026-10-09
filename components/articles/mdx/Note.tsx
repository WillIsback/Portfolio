import type { ReactNode } from "react";
import MarginNote from "@/components/notebook/MarginNote";

/**
 * Annotation manuscrite d'un article (spec §8.2) : en marge à partir de `xl`, dans le flux sinon.
 * À placer juste après le paragraphe qu'elle commente ; le texte reste lu normalement.
 */
export default function Note({
	children,
	side = "right",
}: Readonly<{ children: ReactNode; side?: "left" | "right" }>) {
	return (
		<div className="relative">
			<MarginNote side={side}>
				<span className="sr-only">Note : </span>
				{children}
			</MarginNote>
		</div>
	);
}
