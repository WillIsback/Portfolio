"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect, type Option } from "@/components/ui/multi-select";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

// Options pour les filtres
const DATABASE_OPTIONS: Option[] = [
	{ value: "Postgresql", label: "PostgreSQL" },
	{ value: "MongoDB", label: "MongoDB" },
	{ value: "Informix", label: "Informix" },
];

const BACKEND_OPTIONS: Option[] = [
	{ value: "FastAPI", label: "FastAPI" },
	{ value: "Fastify", label: "Fastify" },
	{ value: "ExpressJs", label: "Express.js" },
];

const FRONTEND_OPTIONS: Option[] = [
	{ value: "React", label: "React" },
	{ value: "NextJs", label: "Next.js" },
	{ value: "Tanstack", label: "Tanstack" },
	{ value: "Svelte", label: "Svelte" },
	{ value: "SvelteKit", label: "SvelteKit" },
];

const DEVOPS_OPTIONS: Option[] = [
	{ value: "Docker", label: "Docker" },
	{ value: "GithubActions", label: "GitHub Actions" },
];

const LANGUAGE_OPTIONS: Option[] = [
	{ value: "Python", label: "Python" },
	{ value: "TypeScript", label: "TypeScript" },
	{ value: "JavaScript", label: "JavaScript" },
];

export default function FilterBar() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const [isPending, startTransition] = useTransition();

	// Récupérer les valeurs actuelles des filtres depuis l'URL
	const search = searchParams.get("search") ?? "";
	const language =
		searchParams.get("language")?.split(",").filter(Boolean) ?? [];
	const database =
		searchParams.get("database")?.split(",").filter(Boolean) ?? [];
	const backend = searchParams.get("backend")?.split(",").filter(Boolean) ?? [];
	const frontend =
		searchParams.get("frontend")?.split(",").filter(Boolean) ?? [];
	const devops = searchParams.get("devops")?.split(",").filter(Boolean) ?? [];

	// Mettre à jour l'URL avec les nouveaux paramètres
	const updateSearchParams = useCallback(
		(key: string, value: string | string[]) => {
			startTransition(() => {
				const params = new URLSearchParams(searchParams.toString());

				if (Array.isArray(value)) {
					if (value.length > 0) {
						params.set(key, value.join(","));
					} else {
						params.delete(key);
					}
				} else {
					if (value) {
						params.set(key, value);
					} else {
						params.delete(key);
					}
				}

				router.push(`${pathname}?${params.toString()}`, { scroll: false });
			});
		},
		[searchParams, router, pathname],
	);

	// Réinitialiser tous les filtres
	const resetFilters = useCallback(() => {
		startTransition(() => {
			router.push(pathname, { scroll: false });
		});
	}, [router, pathname]);

	const hasFilters =
		search ||
		language.length ||
		database.length ||
		backend.length ||
		frontend.length ||
		devops.length;

	return (
		<div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
			{/* Barre de recherche */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
				<Input
					type="search"
					placeholder="Rechercher un projet..."
					value={search}
					onChange={(e) => updateSearchParams("search", e.target.value)}
					className="pl-10"
				/>
			</div>

			{/* Filtres */}
			<div className="flex flex-wrap gap-3 items-center">
				{/* Langage (dropdown simple) */}
				<Select
					value={language[0] ?? "all"}
					onValueChange={(value) =>
						updateSearchParams("language", value === "all" ? [] : [value])
					}
				>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="Langage" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Tous les langages</SelectItem>
						{LANGUAGE_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Base de données (multi-select) */}
				<MultiSelect
					options={DATABASE_OPTIONS}
					selected={database}
					onChange={(value) => updateSearchParams("database", value)}
					placeholder="Base de données"
				/>

				{/* Backend (multi-select) */}
				<MultiSelect
					options={BACKEND_OPTIONS}
					selected={backend}
					onChange={(value) => updateSearchParams("backend", value)}
					placeholder="API Backend"
				/>

				{/* Frontend (multi-select) */}
				<MultiSelect
					options={FRONTEND_OPTIONS}
					selected={frontend}
					onChange={(value) => updateSearchParams("frontend", value)}
					placeholder="Frontend"
				/>

				{/* DevOps (multi-select) */}
				<MultiSelect
					options={DEVOPS_OPTIONS}
					selected={devops}
					onChange={(value) => updateSearchParams("devops", value)}
					placeholder="DevOps"
				/>

				{/* Bouton reset */}
				{hasFilters && (
					<Button
						variant="ghost"
						size="sm"
						onClick={resetFilters}
						className="text-gray-500 hover:text-gray-700"
					>
						<X className="h-4 w-4 mr-1" />
						Réinitialiser
					</Button>
				)}
			</div>

			{/* Indicateur de chargement */}
			{isPending && <div className="text-sm text-gray-500">Chargement...</div>}
		</div>
	);
}
