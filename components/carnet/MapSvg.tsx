import type { CSSProperties } from "react";
import {
	isExternalHref,
	type MapPoint,
	toPercent,
} from "@/lib/carnet/map-view";

interface MapSvgProps {
	points: MapPoint[];
	highlighted?: ReadonlySet<string>;
	queryPoint?: { x: number; y: number } | null;
	activeId?: string | null;
	onHover?: (id: string | null) => void;
}

/** Fig. 1 : carte des projets (ronds) et articles (carrés). Rendue côté serveur. */
export default function MapSvg({
	points,
	highlighted,
	queryPoint,
	activeId,
	onHover,
}: Readonly<MapSvgProps>) {
	return (
		<svg
			viewBox="0 0 100 100"
			role="img"
			aria-labelledby="carnet-map-title"
			aria-describedby="carnet-map-desc"
			className="h-full w-full overflow-visible text-ink-soft"
		>
			<title id="carnet-map-title">Carte de mes projets et articles</title>
			<desc id="carnet-map-desc">
				{`${points.length} éléments placés selon la proximité de leur sujet, calculée par un modèle d'embeddings. La liste des éléments sous la carte en donne l'équivalent.`}
			</desc>
			<path
				className="carnet-axis"
				d="M4 96 H98"
				pathLength={1}
				stroke="currentColor"
				strokeWidth={0.3}
				fill="none"
			/>
			<path
				className="carnet-axis"
				d="M4 96 V2"
				pathLength={1}
				stroke="currentColor"
				strokeWidth={0.3}
				fill="none"
			/>
			{points.map((p) => {
				const cx = toPercent(p.x);
				const cy = toPercent(p.y);
				const hit = highlighted?.has(p.id) ?? false;
				const style = {
					"--i": p.cluster - 1,
					fill: `var(--cluster-${p.cluster})`,
				} as CSSProperties;
				const common = {
					className: "carnet-point",
					"data-hit": hit ? "true" : undefined,
					"data-active": activeId === p.id ? "true" : undefined,
					style,
				};
				return (
					<a
						key={p.id}
						href={p.href}
						tabIndex={-1}
						target={isExternalHref(p.href) ? "_blank" : undefined}
						rel={isExternalHref(p.href) ? "noopener noreferrer" : undefined}
						onPointerEnter={onHover ? () => onHover(p.id) : undefined}
						onPointerLeave={onHover ? () => onHover(null) : undefined}
					>
						{p.kind === "article" ? (
							<rect
								{...common}
								x={cx - 1.6}
								y={cy - 1.6}
								width={3.2}
								height={3.2}
							/>
						) : (
							<circle {...common} cx={cx} cy={cy} r={1.7} />
						)}
					</a>
				);
			})}
			{queryPoint ? (
				<g className="carnet-query">
					<circle
						cx={toPercent(queryPoint.x)}
						cy={toPercent(queryPoint.y)}
						r={3.2}
						fill="none"
						stroke="var(--primary)"
						strokeWidth={0.4}
						strokeDasharray="1 1"
					/>
					<circle
						cx={toPercent(queryPoint.x)}
						cy={toPercent(queryPoint.y)}
						r={1.3}
						fill="var(--primary)"
					/>
				</g>
			) : null}
		</svg>
	);
}
