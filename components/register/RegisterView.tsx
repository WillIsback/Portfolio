import type { ReactNode } from "react";
import type { MapPoint } from "@/lib/carnet/map-view";
import type { NormalizedProject } from "@/lib/projects-data";
import FeaturedCard from "./FeaturedCard";
import IndexRow from "./IndexRow";

interface RegisterViewProps {
	status: "loading" | "error" | "ready";
	error?: string;
	featured: NormalizedProject[];
	index: NormalizedProject[];
	filtersActive: boolean;
	filterBar: ReactNode;
	points: MapPoint[];
	neighbors: Record<string, string[]>;
	entries: Record<number, { slug: string; title: string }>;
}

export default function RegisterView(props: Readonly<RegisterViewProps>) {
	const {
		status,
		error,
		featured,
		index,
		filtersActive,
		filterBar,
		points,
		neighbors,
		entries,
	} = props;
	if (status === "loading")
		return (
			<div
				aria-busy="true"
				className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
			>
				<p className="sr-only">Chargement du registre des projets…</p>
				{[0, 1, 2].map((i) => (
					<div
						key={i}
						className="h-72 rounded-md border border-border bg-paper-grid motion-safe:animate-pulse"
					/>
				))}
			</div>
		);
	if (status === "error")
		return (
			<p
				role="alert"
				className="rounded-md border border-destructive/40 p-4 text-sm text-destructive"
			>
				{error ?? "Le registre des projets n'a pas pu être chargé."}
			</p>
		);
	return (
		<div className="space-y-12">
			{featured.length > 0 ? (
				<div>
					<h3 className="font-display text-lg font-semibold">Projets phares</h3>
					<ul className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
				</div>
			) : null}
			<div>
				<h3 className="font-display text-lg font-semibold">Index</h3>
				<details open={filtersActive || undefined} className="mt-3">
					<summary className="cursor-pointer rounded-sm font-mono text-xs text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						Filtrer le registre
					</summary>
					<div className="mt-3">{filterBar}</div>
				</details>
				{index.length > 0 ? (
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
