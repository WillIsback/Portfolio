import type { MapPoint } from "@/lib/carnet/map-view";

interface MapItemListProps {
	points: MapPoint[];
	onFocusItem?: (id: string | null) => void;
}

const isExternal = (href: string) => href.startsWith("http");

/** Équivalent textuel et clavier de la carte (spec §7.5). */
export default function MapItemList({
	points,
	onFocusItem,
}: Readonly<MapItemListProps>) {
	const sorted = [...points].sort((a, b) =>
		a.title.localeCompare(b.title, "fr"),
	);
	return (
		<details className="mt-4 text-sm">
			<summary className="cursor-pointer rounded-sm font-mono text-xs text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
				Les {points.length} éléments de la carte
			</summary>
			<ul className="mt-2 grid gap-1 sm:grid-cols-2">
				{sorted.map((p) => (
					<li key={p.id}>
						<a
							href={p.href}
							target={isExternal(p.href) ? "_blank" : undefined}
							rel={isExternal(p.href) ? "noopener noreferrer" : undefined}
							className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							onFocus={onFocusItem ? () => onFocusItem(p.id) : undefined}
							onBlur={onFocusItem ? () => onFocusItem(null) : undefined}
							onMouseEnter={onFocusItem ? () => onFocusItem(p.id) : undefined}
							onMouseLeave={onFocusItem ? () => onFocusItem(null) : undefined}
						>
							{p.title}
							<span className="ml-1 font-mono text-[11px] text-ink-soft">
								{p.kind === "article" ? "article" : "projet"}
							</span>
						</a>
					</li>
				))}
			</ul>
		</details>
	);
}
