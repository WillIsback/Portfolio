"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
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
import { debounce } from "@/lib/debounce";
import { DOMAIN_LABELS } from "@/lib/domains";
import { FAMILIES } from "@/lib/practices";
import { nextSearchField } from "@/lib/search-field-sync";
import {
	BACKEND_LABELS,
	DATABASE_LABELS,
	DEVOPS_LABELS,
	FRONTEND_LABELS,
	LANGUAGE_LABELS,
	toOptions,
} from "@/lib/tech-labels";

const DATABASE_OPTIONS: Option[] = toOptions(DATABASE_LABELS);
const BACKEND_OPTIONS: Option[] = toOptions(BACKEND_LABELS);
const FRONTEND_OPTIONS: Option[] = toOptions(FRONTEND_LABELS);
const DEVOPS_OPTIONS: Option[] = toOptions(DEVOPS_LABELS);
const LANGUAGE_OPTIONS: Option[] = toOptions(LANGUAGE_LABELS);
const DOMAIN_OPTIONS: Option[] = toOptions(DOMAIN_LABELS);

export default function FilterBar() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const [isPending, startTransition] = useTransition();

	// Récupérer les valeurs actuelles des filtres depuis l'URL
	const search = searchParams.get("search") ?? "";
	const [searchText, setSearchText] = useState(search);
	const searchInputRef = useRef<HTMLInputElement>(null);
	// Resynchronise le champ quand l'URL change de l'extérieur (Réinitialiser, retour/avance).
	// L'écho d'une valeur qu'on a poussée nous-mêmes n'écrase pas la saisie en cours.
	const [prevSearch, setPrevSearch] = useState(search);
	const [pushedSearches, setPushedSearches] = useState<string[]>([]);
	const [cancelToken, setCancelToken] = useState(0);
	if (search !== prevSearch) {
		const next = nextSearchField({
			urlSearch: search,
			prevUrlSearch: prevSearch,
			pushed: pushedSearches,
			field: searchText,
		});
		setPrevSearch(search);
		setPushedSearches(next.pushed);
		setSearchText(next.field);
		if (next.cancelPending) setCancelToken((n) => n + 1);
	}
	const language =
		searchParams.get("language")?.split(",").filter(Boolean) ?? [];
	const domain = searchParams.get("domain")?.split(",").filter(Boolean) ?? [];
	const database =
		searchParams.get("database")?.split(",").filter(Boolean) ?? [];
	const backend = searchParams.get("backend")?.split(",").filter(Boolean) ?? [];
	const frontend =
		searchParams.get("frontend")?.split(",").filter(Boolean) ?? [];
	const devops = searchParams.get("devops")?.split(",").filter(Boolean) ?? [];
	const practice =
		searchParams.get("practice")?.split(",").filter(Boolean) ?? [];
	const training = searchParams.get("training");

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

	// Saisie : l'URL (donc la requête serveur) n'est mise à jour qu'après 300 ms de pause.
	const latestUpdate = useRef(updateSearchParams);
	const latestSearch = useRef(search);
	useEffect(() => {
		latestUpdate.current = updateSearchParams;
		latestSearch.current = search;
	});
	const pushSearchRef = useRef<ReturnType<typeof debounce<[string]>> | null>(
		null,
	);
	useEffect(() => {
		const pushSearch = debounce((value: string) => {
			if (value !== latestSearch.current)
				setPushedSearches((list) => [...list, value]);
			latestUpdate.current("search", value);
		}, 300);
		pushSearchRef.current = pushSearch;
		return () => pushSearch.cancel();
	}, []);
	// Navigation externe : la saisie différée en attente est périmée.
	// biome-ignore lint/correctness/useExhaustiveDependencies: cancelToken ne sert que de déclencheur
	useEffect(() => {
		pushSearchRef.current?.cancel();
	}, [cancelToken]);

	// Réinitialiser tous les filtres
	const resetFilters = useCallback(() => {
		pushSearchRef.current?.cancel();
		setSearchText("");
		setPushedSearches([]);
		startTransition(() => {
			router.push(pathname, { scroll: false });
		});
		// Le bouton disparaît une fois les filtres vides : le focus revient au champ.
		searchInputRef.current?.focus();
	}, [router, pathname]);

	const hasFilters =
		searchText ||
		search ||
		language.length ||
		domain.length ||
		database.length ||
		backend.length ||
		frontend.length ||
		devops.length ||
		practice.length ||
		training;

	return (
		<div className="flex flex-col gap-4 p-4 bg-muted/50 rounded-xl border border-border">
			{/* Barre de recherche */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Rechercher un projet..."
					ref={searchInputRef}
					value={searchText}
					onChange={(e) => {
						setSearchText(e.target.value);
						pushSearchRef.current?.(e.target.value);
					}}
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

				{/* Domaine IA/Data (dropdown simple) */}
				<Select
					value={domain[0] ?? "all"}
					onValueChange={(value) =>
						updateSearchParams("domain", value === "all" ? [] : [value])
					}
				>
					<SelectTrigger className="w-[160px]" aria-label="Domaine">
						<SelectValue placeholder="Domaine" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Tous les domaines</SelectItem>
						{DOMAIN_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Famille de pratiques (dropdown simple) */}
				<Select
					value={practice[0] ?? "all"}
					onValueChange={(value) =>
						updateSearchParams("practice", value === "all" ? [] : [value])
					}
				>
					<SelectTrigger className="w-[160px]" aria-label="Pratiques">
						<SelectValue placeholder="Pratiques" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Toutes les pratiques</SelectItem>
						{FAMILIES.map((f) => (
							<SelectItem key={f} value={f}>
								{f}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Projets de formation (dropdown simple) */}
				<Select
					value={training ?? "all"}
					onValueChange={(value) =>
						updateSearchParams("training", value === "all" ? [] : [value])
					}
				>
					<SelectTrigger className="w-[180px]" aria-label="Formation">
						<SelectValue placeholder="Formation" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Tous les projets</SelectItem>
						<SelectItem value="only">Projets de formation</SelectItem>
						<SelectItem value="exclude">Hors formation</SelectItem>
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
						className="text-muted-foreground hover:text-foreground"
					>
						<X className="h-4 w-4 mr-1" />
						Réinitialiser
					</Button>
				)}
			</div>

			{/* Indicateur de chargement */}
			{isPending && (
				<div className="text-sm text-muted-foreground">Chargement...</div>
			)}
		</div>
	);
}
