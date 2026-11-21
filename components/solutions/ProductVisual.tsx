import Image from "next/image";
import type { SolutionFacts } from "@/lib/solutions";

type Screenshot = Extract<SolutionFacts["visual"], { kind: "screenshot" }>;

/** Capture du produit, claire ou sombre selon le thème du site. */
export default function ProductVisual({
	visual,
	alt,
	caption,
}: Readonly<{ visual: Screenshot; alt: string; caption: string }>) {
	const common = {
		alt,
		width: visual.width,
		height: visual.height,
		sizes: "(max-width: 56rem) 100vw, 56rem",
	};
	return (
		<figure>
			<div className="overflow-hidden rounded-xl border border-border shadow-sm">
				<Image
					src={visual.light}
					className="dark:hidden"
					{...common}
					priority
				/>
				{/* Une seule des deux est affichée : `display: none` retire l'autre de l'arbre d'accessibilité. */}
				<Image src={visual.dark} className="hidden dark:block" {...common} />
			</div>
			<figcaption className="mt-3 text-xs text-ink-soft">{caption}</figcaption>
		</figure>
	);
}
