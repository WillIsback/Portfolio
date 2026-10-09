import Link from "next/link";
import FigureCaption from "@/components/notebook/FigureCaption";
import MiniMap from "@/components/register/MiniMap";
import { isExternalHref, type MapPoint } from "@/lib/carnet/map-view";

const NEIGHBOR_LINK =
	"rounded-sm font-display font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Neighbor {
	id: string;
	title: string;
	href: string;
	kind: "article" | "project";
}

/** « Sur la carte » (spec §8.2) : l'article parmi ses trois voisins les plus proches dans map.json. */
export default function OnTheMap({
	articleId,
	points,
	neighbors,
	figureNumber,
}: Readonly<{
	articleId: string;
	points: MapPoint[];
	neighbors: Neighbor[];
	figureNumber: number;
}>) {
	if (neighbors.length === 0) return null;
	return (
		<section
			aria-labelledby="on-the-map"
			className="mt-14 border-t border-border pt-8"
		>
			<h2 id="on-the-map" className="font-display text-xl font-semibold">
				Sur la carte
			</h2>
			<div className="mt-5 grid gap-6 sm:grid-cols-[10rem_1fr] sm:items-start">
				<figure className="m-0">
					<div className="aspect-square w-40">
						<MiniMap
							points={points}
							focusId={articleId}
							neighborIds={neighbors.map((n) => n.id)}
						/>
					</div>
					<FigureCaption number={figureNumber}>
						Cette entrée parmi ses voisins
					</FigureCaption>
				</figure>
				<ol className="space-y-3">
					{neighbors.map((n) => (
						<li key={n.id}>
							{isExternalHref(n.href) ? (
								<a
									href={n.href}
									target="_blank"
									rel="noopener noreferrer"
									className={NEIGHBOR_LINK}
								>
									{n.title}
								</a>
							) : (
								<Link href={n.href} className={NEIGHBOR_LINK}>
									{n.title}
								</Link>
							)}
							<span className="ml-2 font-mono text-[11px] text-ink-soft">
								{n.kind === "article" ? "article" : "projet"}
							</span>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
