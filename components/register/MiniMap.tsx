import { type MapPoint, toPercent } from "@/lib/carnet/map-view";

/** Fig. 1 en réduction : le projet parmi ses voisins (spec §8.1). Décorative, doublée par la légende. */
export default function MiniMap({
	points,
	focusId,
	neighborIds,
}: Readonly<{ points: MapPoint[]; focusId: string; neighborIds: string[] }>) {
	const neighbors = new Set(neighborIds);
	const roleOf = (id: string) =>
		id === focusId ? "focus" : neighbors.has(id) ? "neighbor" : "other";
	// Le projet au premier plan : dessiné en dernier, aucun point ne le recouvre.
	const ordered = [...points].sort(
		(a, b) => Number(a.id === focusId) - Number(b.id === focusId),
	);
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
			{ordered.map((pt) => {
				const role = roleOf(pt.id);
				const cx = toPercent(pt.x);
				const cy = toPercent(pt.y);
				if (role === "focus") {
					return (
						<g key={pt.id} data-role="focus">
							<circle
								cx={cx}
								cy={cy}
								r={5.5}
								fill="none"
								stroke="var(--primary)"
								strokeWidth={1}
							/>
							<circle
								cx={cx}
								cy={cy}
								r={3.4}
								fill="var(--primary)"
								stroke="var(--background)"
								strokeWidth={1.2}
							/>
						</g>
					);
				}
				return (
					<circle
						key={pt.id}
						data-role={role}
						cx={cx}
						cy={cy}
						r={role === "neighbor" ? 2.6 : 1.8}
						fill={role === "neighbor" ? "none" : `var(--cluster-${pt.cluster})`}
						fillOpacity={role === "other" ? 0.25 : 1}
						stroke={role === "neighbor" ? "var(--primary)" : "none"}
						strokeWidth={role === "neighbor" ? 1 : 0}
					/>
				);
			})}
		</svg>
	);
}
