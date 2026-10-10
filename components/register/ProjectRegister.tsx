"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useProjects } from "@/hooks/CustomHooks";
import type { MapPoint } from "@/lib/carnet/map-view";
import { selectFeatured, splitIndex } from "@/lib/register";
import { hasActiveFilters, parseFilters } from "@/lib/register-filters";
import type { ProjectFilters } from "@/schemas";
import FilterBar from "./FilterBar";
import RegisterView from "./RegisterView";

// Constante de module : la clé de cache de useProjects (JSON.stringify) reste stable.
const NO_FILTERS: ProjectFilters = {
	language: [],
	database: [],
	backend: [],
	frontend: [],
	devops: [],
	domain: [],
	practice: [],
};

export default function ProjectRegister({
	points,
	neighbors,
	entries,
}: Readonly<{
	points: MapPoint[];
	neighbors: Record<string, string[]>;
	entries: Record<number, { slug: string; title: string }>;
}>) {
	const params = useSearchParams();
	const filters = parseFilters(params);
	const filtersActive = hasActiveFilters(filters);
	const all = useProjects(NO_FILTERS);
	const filtered = useProjects(filtersActive ? filters : NO_FILTERS);
	const featured = useMemo(() => selectFeatured(all.projects), [all.projects]);
	const index = splitIndex(
		all.projects,
		filtered.projects,
		featured,
		filtersActive,
	);
	const blockStatus = (h: { error: string | null; isLoading: boolean }) =>
		h.error ? "error" : h.isLoading ? "loading" : "ready";
	// Sans filtre actif, l'index dérive de `all` : un seul état, une seule requête.
	const indexState = filtersActive ? filtered : all;
	return (
		<RegisterView
			featuredStatus={blockStatus(all)}
			indexStatus={blockStatus(indexState)}
			featured={featured}
			index={index}
			filtersActive={filtersActive}
			filterBar={<FilterBar />}
			points={points}
			neighbors={neighbors}
			entries={entries}
		/>
	);
}
