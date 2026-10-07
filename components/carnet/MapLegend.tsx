import type { MapCluster } from "@/lib/carnet/map-view";

/** Légende des groupes : teinte d'encre + nom en Fira Code (les groupes ne sont pas contigus sur la carte). */
export default function MapLegend({
	clusters,
}: Readonly<{ clusters: MapCluster[] }>) {
	return (
		<ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-ink-soft">
			{clusters.map((c) => (
				<li key={c.id} className="flex items-center gap-1.5">
					<span
						aria-hidden="true"
						className="inline-block size-2.5 rounded-full"
						style={{ background: `var(--cluster-${c.index})` }}
					/>
					{c.label} <span className="opacity-70">({c.count})</span>
				</li>
			))}
		</ul>
	);
}
