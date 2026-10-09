import { type MapPoint, toPercent } from "@/lib/carnet/map-view";

/** Fig. 1 en réduction : le projet parmi ses voisins (spec §8.1). Décorative, doublée par la légende. */
export default function MiniMap({
	points,
	focusId,
	neighborIds,
}: Readonly<{ points: MapPoint[]; focusId: string; neighborIds: string[] }>) {
	const neighbors = new Set(neighborIds);
	return (
		<svg
			viewBox="0 0 100 100"
			aria-hidden="true"
			className="h-full w-full text-ink-soft"
		>
			<path
				d="M4 96 H98 M4 96 V2"
				stroke="currentColor"
				strokeWidth={0.4}
				fill="none"
			/>
			{points.map((pt) => {
				const role =
					pt.id === focusId
						? "focus"
						: neighbors.has(pt.id)
							? "neighbor"
							: "other";
				return (
					<circle
						key={pt.id}
						data-role={role}
						cx={toPercent(pt.x)}
						cy={toPercent(pt.y)}
						r={role === "focus" ? 3.2 : 2}
						fill={
							role === "focus"
								? "var(--primary)"
								: `var(--cluster-${pt.cluster})`
						}
						fillOpacity={role === "other" ? 0.3 : 1}
						stroke={role === "neighbor" ? "var(--primary)" : "none"}
						strokeWidth={role === "neighbor" ? 0.8 : 0}
					/>
				);
			})}
		</svg>
	);
}
