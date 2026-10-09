import { useEffect, useRef, useState, useTransition } from "react";
import {
	getProjects,
	type ProjectWithRelations,
} from "@/app/actions/projects.action";
import type { ProjectFilters } from "@/schemas";

// Cache global pour les projets (évite les re-fetch inutiles)
const projectsCache = new Map<string, ProjectWithRelations[]>();

// Requêtes en vol par clé : deux hooks montés avec les mêmes filtres partagent un seul appel.
const inflight = new Map<string, Promise<ProjectWithRelations[]>>();

function fetchProjects(key: string, filters: ProjectFilters) {
	let promise = inflight.get(key);
	if (!promise) {
		promise = getProjects(filters).finally(() => inflight.delete(key));
		inflight.set(key, promise);
	}
	return promise;
}

// Custom hook pour fetcher les projets
export function useProjects(filters: ProjectFilters) {
	const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [, startTransition] = useTransition();

	// Ref pour éviter les race conditions
	const abortControllerRef = useRef<AbortController | null>(null);

	// Clé de cache basée sur les filtres
	const cacheKey = JSON.stringify(filters);

	// cacheKey is JSON.stringify(filters), so it already encodes filter content as a stable
	// primitive. Including `filters` (object) would re-run the effect on every render because
	// parseFilters() returns a new reference each time, causing an infinite fetch loop.
	// biome-ignore lint/correctness/useExhaustiveDependencies: cacheKey encodes filters content
	useEffect(() => {
		// Annuler la requête précédente si elle existe
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		abortControllerRef.current = new AbortController();

		// Vérifier le cache d'abord
		const cached = projectsCache.get(cacheKey);
		if (cached) {
			startTransition(() => {
				setProjects(cached);
				setIsLoading(false);
				setError(null);
			});
			return;
		}

		// Sinon, fetch les données
		setIsLoading(true);
		setError(null);

		startTransition(() => {
			fetchProjects(cacheKey, filters)
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cacheKey]);

	return {
		projects,
		error,
		isLoading,
	};
}

// Fonction pour invalider le cache (utile après des modifications)
export function invalidateProjectsCache() {
	projectsCache.clear();
}
