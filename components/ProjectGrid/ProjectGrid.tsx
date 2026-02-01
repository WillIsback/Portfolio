"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useProjects } from "@/hooks/CustomHooks";
import type { ProjectFilters } from "@/schemas";
import FilterBar from "./FilterBar";
import ProjectGridSkeleton from "./ProjectGridSkeleton";
import ProjectList from "./ProjectList";

// Fonction utilitaire pour parser les search params
function parseFilters(params: URLSearchParams): ProjectFilters {
	const parseArray = (key: string): string[] => {
		const value = params.get(key);
		if (!value) return [];
		return value.split(",").filter(Boolean);
	};

	return {
		search: params.get("search") || undefined,
		language: parseArray("language") as ProjectFilters["language"],
		database: parseArray("database") as ProjectFilters["database"],
		backend: parseArray("backend") as ProjectFilters["backend"],
		frontend: parseArray("frontend") as ProjectFilters["frontend"],
		devops: parseArray("devops") as ProjectFilters["devops"],
	};
}

// Composant interne qui utilise useSearchParams
function ProjectGridContent() {
	const searchParams = useSearchParams();
	const filters = parseFilters(searchParams);
	const { projects, error, isLoading } = useProjects(filters);

	return (
		<section className="space-y-6">
			<Suspense
				fallback={<div className="h-24 bg-gray-100 rounded-xl animate-pulse" />}
			>
				<FilterBar />
			</Suspense>

			<ErrorBoundary
				fallback={
					<div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
						<p className="text-red-600">
							Erreur lors du chargement des projets
						</p>
					</div>
				}
			>
				{error ? (
					<div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
						<p className="text-red-600">{error}</p>
					</div>
				) : isLoading ? (
					<ProjectGridSkeleton />
				) : (
					<ProjectList projects={projects} />
				)}
			</ErrorBoundary>
		</section>
	);
}

// Export avec Suspense boundary pour le pre-rendering
export default function ProjectGrid() {
	return (
		<Suspense fallback={<ProjectGridSkeleton />}>
			<ProjectGridContent />
		</Suspense>
	);
}
