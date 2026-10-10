"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useProjects } from "@/hooks/CustomHooks";
import type { MapPoint } from "@/lib/carnet/map-view";
import { FAMILIES, type PracticeFamily } from "@/lib/practices";
import { selectFeatured, splitIndex } from "@/lib/register";
import type { ProjectFilters } from "@/schemas";
import FilterBar from "./FilterBar";
import RegisterView from "./RegisterView";

export function parseFilters(params: URLSearchParams): ProjectFilters {
	const list = (key: string) =>
		(params.get(key) ?? "").split(",").filter(Boolean);
	return {
		search: params.get("search") || undefined,
		language: list("language") as ProjectFilters["language"],
		database: list("database") as ProjectFilters["database"],
		backend: list("backend") as ProjectFilters["backend"],
		frontend: list("frontend") as ProjectFilters["frontend"],
		devops: list("devops") as ProjectFilters["devops"],
		domain: list("domain") as ProjectFilters["domain"],
		practice: list("practice").filter((v): v is PracticeFamily =>
			(FAMILIES as readonly string[]).includes(v),
		),
		training: (["only", "exclude"] as const).find(
			(v) => v === params.get("training"),
		),
	};
}

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
	const filtersActive =
		Boolean(filters.search) ||
		Boolean(filters.training) ||
		[
			filters.language,
			filters.database,
			filters.backend,
			filters.frontend,
			filters.devops,
			filters.domain,
			filters.practice,
		].some((l) => (l?.length ?? 0) > 0);
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
