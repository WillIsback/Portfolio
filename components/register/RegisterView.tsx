import type { ReactNode } from "react";
import type { MapPoint } from "@/lib/carnet/map-view";
import type { NormalizedProject } from "@/lib/projects-data";
import FeaturedCard from "./FeaturedCard";
import FilterDisclosure from "./FilterDisclosure";
import IndexRow from "./IndexRow";

type BlockStatus = "loading" | "error" | "ready";

interface RegisterViewProps {
	featuredStatus: BlockStatus;
	indexStatus: BlockStatus;
	featured: NormalizedProject[];
	index: NormalizedProject[];
	filtersActive: boolean;
	filterBar: ReactNode;
	points: MapPoint[];
	neighbors: Record<string, string[]>;
	entries: Record<number, { slug: string; title: string }>;
}

function Skeleton({ count }: Readonly<{ count: number }>) {
	return (
		<div aria-busy="true" className="grid gap-6 md:grid-cols-2">
			<p className="sr-only">Chargement du registre des projets…</p>
			{Array.from({ length: count }, (_, i) => `sk-${i}`).map((key) => (
				<div
					key={key}
					className="h-72 rounded-md border border-border bg-paper-grid motion-safe:animate-pulse"
				/>
			))}
		</div>
	);
}

const ERROR_MESSAGE =
	"Le registre des projets n'a pas pu être chargé. Réessaie dans un instant.";

function BlockError() {
	return (
		<p
			role="alert"
			className="mt-4 rounded-md border border-destructive/40 p-4 text-sm text-destructive"
		>
			{ERROR_MESSAGE}
		</p>
	);
}

export default function RegisterView(props: Readonly<RegisterViewProps>) {
	const {
		featuredStatus,
		indexStatus,
		featured,
		index,
		filtersActive,
		filterBar,
		points,
		neighbors,
		entries,
	} = props;
	const showFeatured = featuredStatus !== "ready" || featured.length > 0;
	return (
		<div className="space-y-12">
			{showFeatured ? (
				<div>
					<h3 className="font-display text-lg font-semibold">Projets phares</h3>
					{featuredStatus === "loading" ? (
						<div className="mt-4">
							<Skeleton count={4} />
						</div>
					) : featuredStatus === "error" ? (
						<BlockError />
					) : (
						<ul className="mt-4 grid gap-6 md:grid-cols-2">
							{featured.map((project, i) => (
								<li key={project.id}>
									<FeaturedCard
										project={project}
										figureNumber={i + 2}
										points={points}
										neighborIds={neighbors[`project:${project.id}`] ?? []}
										entry={entries[project.id]}
									/>
								</li>
							))}
						</ul>
					)}
				</div>
			) : null}
			<div>
				<h3 className="font-display text-lg font-semibold">Index</h3>
				<FilterDisclosure filtersActive={filtersActive}>
					{filterBar}
				</FilterDisclosure>
				{indexStatus === "loading" ? (
					<div className="mt-4">
						<Skeleton count={2} />
					</div>
				) : indexStatus === "error" ? (
					<BlockError />
				) : index.length > 0 ? (
					<ul className="mt-4">
						{index.map((project) => (
							<IndexRow key={project.id} project={project} />
						))}
					</ul>
				) : (
					<p className="mt-4 text-sm text-ink-soft">
						{filtersActive
							? "Aucun projet ne correspond à ces filtres."
							: "Aucun autre projet pour l'instant."}
					</p>
				)}
			</div>
		</div>
	);
}
