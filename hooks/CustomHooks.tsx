import { useEffect, useRef, useState, useTransition } from "react";
import {
	getProjects,
	type ProjectWithRelations,
} from "@/app/actions/projects.action";
import type { ProjectFilters } from "@/schemas";

// Cache global pour les projets (évite les re-fetch inutiles)
const projectsCache = new Map<string, ProjectWithRelations[]>();

// Custom hook pour fetcher les projets
export function useProjects(filters: ProjectFilters) {
	const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isPending, startTransition] = useTransition();

	// Ref pour éviter les race conditions
	const abortControllerRef = useRef<AbortController | null>(null);

	// Clé de cache basée sur les filtres
	const cacheKey = JSON.stringify(filters);

	useEffect(() => {
		// Annuler la requête précédente si elle existe
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		abortControllerRef.current = new AbortController();

		// Vérifier le cache d'abord
		const cached = projectsCache.get(cacheKey);
		if (cached) {
			setProjects(cached);
			setIsLoading(false);
			setError(null);
			return;
		}

		// Sinon, fetch les données
		setIsLoading(true);
		setError(null);

		startTransition(() => {
			getProjects(filters)
				.then((data) => {
					// Vérifier si la requête n'a pas été annulée
					if (!abortControllerRef.current?.signal.aborted) {
						projectsCache.set(cacheKey, data);
						setProjects(data);
						setIsLoading(false);
					}
				})
				.catch((err) => {
					if (!abortControllerRef.current?.signal.aborted) {
						setError(err.message);
						setIsLoading(false);
					}
				});
		});

		return () => {
			abortControllerRef.current?.abort();
		};
	}, [cacheKey, filters]);

	return {
		projects,
		error,
		isLoading: isLoading || isPending,
	};
}

// Fonction pour invalider le cache (utile après des modifications)
export function invalidateProjectsCache() {
	projectsCache.clear();
}
